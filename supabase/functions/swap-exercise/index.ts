import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user (verify JWT signature server-side)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const exerciseName = clip(body?.exerciseName, 200);
    const muscleGroup = clip(body?.muscleGroup, 100);
    const gymType = clip(body?.gymType, 100);
    const reason = clip(body?.reason, 300);

    if (!exerciseName) {
      return new Response(JSON.stringify({ error: "exerciseName is required" }), {
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

    const systemPrompt = `Você é um preparador físico especializado em biomecânica. Sua tarefa é sugerir UMA substituição equivalente para um exercício, mantendo:
- O MESMO ângulo de trabalho (inclinado, declinado, reto, vertical, horizontal)
- O MESMO feixe muscular principal (ex: porção clavicular do peitoral, deltoide lateral, vasto lateral)
- O MESMO padrão de ativação (composto vs isolado, empurrar vs puxar)

Regras:
- Sugira APENAS 1 substituição (a melhor equivalente)
- Se NÃO houver substituição equivalente possível para a condição informada, responda EXATAMENTE: "SEM_SUBSTITUICAO"
- Caso contrário, responda em JSON estrito: { "newExercise": "Nome do exercício", "reason": "Explicação curta (1-2 frases) da equivalência biomecânica" }
- Sem markdown, sem texto extra, apenas o JSON ou a string SEM_SUBSTITUICAO.

Banco de exercícios disponíveis:
Peito: Supino reto barra, Supino reto halteres, Supino inclinado barra, Supino inclinado halteres, Supino declinado, Crucifixo banco, Crucifixo máquina, Crossover alto, Crossover baixo, Flexão de braço, Fly inclinado halteres, Peck deck
Costas: Puxada frontal aberta, Puxada frontal fechada, Puxada triângulo, Remada curvada barra, Remada curvada halteres, Remada unilateral halter, Pulldown corda, Remada cavaleiro, Barra fixa, Remada baixa máquina, Pullover halter, Pullover polia
Pernas: Agachamento livre, Agachamento smith, Agachamento búlgaro, Leg press 45°, Leg press horizontal, Cadeira extensora, Hack squat, Sissy squat, Passada halteres, Stiff barra, Stiff halteres, Mesa flexora, Cadeira flexora, Elevação pélvica, Hip thrust, Good morning, Nordic curl, Abdução máquina, Coice na polia
Ombros: Desenvolvimento halteres, Desenvolvimento barra, Desenvolvimento máquina, Arnold press, Elevação lateral halteres, Elevação lateral polia, Elevação lateral máquina, Elevação frontal halter, Elevação frontal polia, Face pull, Crucifixo invertido
Tríceps: Tríceps pulley corda, Tríceps pulley barra, Tríceps testa EZ, Tríceps francês, Mergulho banco, Mergulho paralelas, Tríceps coice
Bíceps: Rosca direta barra, Rosca direta EZ, Rosca alternada halteres, Rosca martelo, Rosca scott barra, Rosca scott máquina, Rosca concentrada, Rosca polia, Rosca inversa
Core: Prancha, Abdominal infra, Crunch, Abdominal oblíquo, Roda abdominal, Elevação de pernas
Panturrilha: Panturrilha em pé, Panturrilha sentado, Panturrilha leg press`;

    const userPrompt = `Exercício original: ${exerciseName}
Grupo muscular do dia: ${muscleGroup || "não informado"}
Tipo de academia: ${gymType || "completa"}
Motivo da substituição: ${reason || "Não tem a máquina/equipamento disponível"}

Sugira 1 substituição equivalente que trabalhe o mesmo ângulo, feixe muscular e padrão de ativação. Se não houver equivalente real, responda SEM_SUBSTITUICAO.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
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
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = (aiData.choices?.[0]?.message?.content || "").trim();

    // Strip markdown if any
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    if (content.includes("SEM_SUBSTITUICAO")) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "Não há substituição equivalente que mantenha o mesmo ângulo, feixe e ativação muscular para este exercício.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const parsed = JSON.parse(content);
      return new Response(
        JSON.stringify({
          available: true,
          newExercise: parsed.newExercise,
          reason: parsed.reason,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      console.error("Failed to parse swap response:", content.substring(0, 300));
      return new Response(
        JSON.stringify({
          available: false,
          message: "Não foi possível processar a sugestão. Tente novamente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("swap-exercise error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
