import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { photoPaths, sex, weight, height, age } = await req.json();
    if (!photoPaths || !Array.isArray(photoPaths) || photoPaths.length < 1) {
      return new Response(JSON.stringify({ error: "At least 1 photo required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get signed URLs for the photos
    const imageContents: { type: string; image_url: { url: string } }[] = [];
    const labels = ["Frente", "Costas", "Lateral Direita", "Lateral Esquerda"];

    for (let i = 0; i < photoPaths.length; i++) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("photos")
        .createSignedUrl(photoPaths[i], 600);

      if (signedError || !signedData?.signedUrl) {
        console.error("Signed URL error:", signedError);
        continue;
      }
      imageContents.push({
        type: "image_url",
        image_url: { url: signedData.signedUrl },
      });
    }

    if (imageContents.length === 0) {
      return new Response(JSON.stringify({ error: "Could not access photos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um avaliador físico profissional especializado em análise corporal por fotos.
Analise as fotos enviadas e forneça uma avaliação detalhada em português brasileiro.

Dados do paciente: ${sex === "M" ? "Masculino" : "Feminino"}, ${age} anos, ${weight}kg, ${height}cm.

Responda EXCLUSIVAMENTE em JSON válido com esta estrutura:
{
  "body_fat_estimate": "XX-XX%",
  "body_fat_category": "categoria (ex: Atlético, Normal, Acima do peso)",
  "posture_deviations": ["lista de desvios posturais identificados"],
  "strong_points": ["pontos fortes identificados"],
  "weak_points": ["pontos fracos / áreas para melhorar"],
  "muscle_development": {
    "upper_body": "descrição breve",
    "core": "descrição breve",
    "lower_body": "descrição breve"
  },
  "recommendations": ["recomendações específicas para o treino"],
  "overall_summary": "resumo geral da avaliação em 2-3 frases"
}

Considere que pessoas com IMC alto podem ter muita massa muscular (atletas). Avalie visualmente, não apenas por números.
Seja profissional, motivador e honesto.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Analise estas ${imageContents.length} foto(s) corporal(is) (${labels.slice(0, imageContents.length).join(", ")}) e forneça a avaliação completa.`,
      },
      ...imageContents,
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na análise de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let assessment;
    try {
      assessment = JSON.parse(content);
    } catch {
      assessment = { overall_summary: content, raw: true };
    }

    return new Response(JSON.stringify({ assessment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
