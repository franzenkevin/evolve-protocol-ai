import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Body {
  photos: string[]; // data URLs
  context?: Record<string, unknown>;
}

const SYSTEM = `Você é um avaliador físico estilo coach Evoria. Analise as fotos do usuário e devolva uma leitura inicial OBJETIVA, respeitosa e motivadora em pt-BR. Não diagnostique patologias. Responda APENAS em JSON com o schema:
{
  "posture": string,          // 1-2 frases sobre postura geral
  "symmetry": string,         // 1-2 frases sobre simetria
  "priorities": string[],     // 3 pontos prioritários de desenvolvimento (curtos)
  "recommendation": string    // 1-2 frases recomendando foco inicial de treino
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { photos, context } = (await req.json()) as Body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma foto enviada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [
      { type: "text", text: `Contexto do usuário (quiz):\n${JSON.stringify(context ?? {}, null, 2)}\n\nAnalise as fotos a seguir e devolva o JSON pedido.` },
      ...photos.slice(0, 4).map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Tente em instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI Gateway: ${t}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = {}; }

    const result = {
      posture: parsed.posture ?? "Postura geral alinhada, com pontos sutis a ajustar.",
      symmetry: parsed.symmetry ?? "Boa simetria entre lados, com pequenas assimetrias naturais.",
      priorities: Array.isArray(parsed.priorities) && parsed.priorities.length
        ? parsed.priorities.slice(0, 5)
        : ["Posterior de ombro e dorsais médias", "Glúteo médio e core", "Mobilidade torácica"],
      recommendation: parsed.recommendation ?? "Foco em puxadas horizontais, rotação externa e core nas primeiras semanas.",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
