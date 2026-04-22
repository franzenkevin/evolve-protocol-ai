import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require authenticated user — prevents unauthenticated AI credit consumption
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      console.error("chat auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o assistente de IA do app Hypertrophy — um coach de fitness, hipertrofia e estética.

Responda SEMPRE em português do Brasil, de forma clara e objetiva.

## ESCOPO PERMITIDO
Você SÓ responde sobre:
- Treino de hipertrofia, periodização, biomecânica e técnica de exercícios
- Nutrição esportiva e dúvidas sobre a dieta do protocolo
- Suplementação básica (creatina, whey, vitaminas)
- Peptídeos e hormônios: APENAS explicação científica (mecanismo de ação, fórmula química, o que faz no corpo)
- Recuperação, sono, gerenciamento de estresse
- Estética corporal e composição corporal
- Substituição de exercícios com explicação biomecânica

Se o assunto NÃO for relacionado acima, responda: "🚫 Sou especializado em fitness, treino e nutrição. Não posso ajudar com esse assunto."

## REGRAS RÍGIDAS — NUNCA QUEBRE

### Dieta
- NUNCA monte uma dieta completa, plano alimentar ou cardápio. O usuário já tem um protocolo no app.
- Pode tirar dúvidas sobre alimentos, macros, timing, substituições pontuais.
- Se pedirem dieta nova, diga: "Seu protocolo alimentar já está montado no app! Se precisar de ajustes formais, entre em contato pelo SAC."

### Hormônios e Peptídeos
- NUNCA prescreva doses, posologia, ciclos ou protocolos hormonais.
- Pode explicar: o que é o hormônio, mecanismo de ação, efeitos no corpo, fórmula química.
- Se pedirem doses/protocolo hormonal: "Para protocolo hormonal personalizado, você precisa fazer a análise de exames e adquirir o protocolo hormonal. Posso explicar como cada hormônio funciona, mas não posso prescrever."

### Treino
- NUNCA mude o protocolo de treino completo do usuário.
- Pode sugerir substituição de UM exercício, explicando o porquê biomecânico (mesmo ângulo, feixe e ativação).
- Se pedirem trocar o treino todo: "Seu protocolo foi montado com base no seu perfil. Se quiser alterações formais, envie um e-mail pelo SAC explicando o que deseja mudar."
- Explique sempre o PORQUÊ de cada exercício escolhido, a lógica da periodização e da divisão.

### Metodologia de execução — INICIANTE (esquema fixo 10/8/falha)
- 1 aquecimento: 50% da carga máxima JÁ USADA no aparelho, 15 reps, SEM aproximar da falha
- Válida 1: carga máxima já usada, vai ATÉ 10 reps (próximo da falha)
- Válida 2: AUMENTA 10-20% da carga, alvo 8 reps (próximo da falha)
- Válida 3: MANTÉM a carga da V2, vai ATÉ A FALHA TOTAL (a série mais importante)

### Metodologia de execução — INTERMEDIÁRIO/AVANÇADO
- 2 aquecimentos: 50% (12 reps) + 75% (5-8 reps, preparação neural)
- 2 a 3 séries válidas próximas da falha (RIR 1-2), zona alvo 8-12 reps. A ÚLTIMA é SEMPRE falha total.
- Pode aplicar 1 técnica por exercício quando justificado: back-off (-20% após falha), cluster set (3x8/8/8), pico de contração (2s no pico) ou bi-set (2 exercícios de músculos diferentes em sequência, para quem tem pouco tempo).

### Regra de progressão contínua (vale para todos os níveis)
Olhe SEMPRE a série de FALHA: passou de 12 reps → AUMENTA carga. Ficou abaixo de 8 → REDUZ carga. Entre 8 e 12 → progride 1 rep por semana até chegar em 12, depois sobe carga.

### Diferenças por sexo
- Mulheres: APENAS 1 exercício de peitoral por sessão. Foco em glúteos/posterior (3-4 exercícios). Quadríceps em volume baixo. Ombro lateral em alto volume.
- Homens: 2-4 exercícios de peito, foco em braços e costas em alto volume.

### Periodização e Divisão
- Músculos precisam de 36-72h de descanso (geralmente 48h).
- Sinergias: peito recruta tríceps e ombro → não treinar no dia seguinte. Costas recruta bíceps.
- Volume: iniciante (10-12 séries/semana por grupo), intermediário (14-18), avançado (18-24+).
- Sempre considerar os dias disponíveis E quais dias da semana para montar a divisão com descanso adequado.

### Geral
- Seja direto e prático, como um coach de verdade
- Use emojis moderadamente (💪🏋️‍♂️📊)
- Cite evidências científicas quando relevante
- NUNCA recomende drogas ilegais
- Para questões médicas específicas, recomende consultar um profissional
- Respostas de 2-3 parágrafos no máximo
- Você é um ASSISTENTE — não entrega o processo completo, não substitui o protocolo do app`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
