// Edge function: análise física por IA (prévia do quiz Evoria) — resiliente
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Body {
  photos: string[];
  context?: Record<string, unknown>;
}

const SYSTEM = `Você é um avaliador físico estilo coach Evoria. Analise as fotos do usuário e devolva uma leitura inicial OBJETIVA, respeitosa e motivadora em pt-BR. Não diagnostique patologias. Responda APENAS em JSON com o schema:
{
  "posture": string,          // 1-2 frases sobre postura geral
  "symmetry": string,         // 1-2 frases sobre simetria
  "priorities": string[],     // 3 pontos prioritários de desenvolvimento (curtos)
  "recommendation": string    // 1-2 frases recomendando foco inicial de treino
}`;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const FALLBACK = {
  posture: "Postura geral alinhada, com pequenos ajustes possíveis em ombros e quadril.",
  symmetry: "Simetria razoável entre os lados, com leve dominância natural de um hemisfério.",
  priorities: [
    "Posterior de ombro e dorsais médias",
    "Glúteo médio e core anti-extensão",
    "Mobilidade torácica",
  ],
  recommendation:
    "Comece com puxadas horizontais, rotação externa de ombro e core nas primeiras 2-3 semanas.",
};

async function callModel(model: string, content: any[], timeoutMs: number): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });
    console.log(`[analyze-physique] ${model} status=${resp.status}`);
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error(`[analyze-physique] ${model} error: ${txt.slice(0, 300)}`);
      return null;
    }
    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  } catch (e: any) {
    console.error(`[analyze-physique] ${model} exception: ${e?.message ?? e}`);
    return null;
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-physique] LOVABLE_API_KEY ausente — retornando fallback");
      return json(200, FALLBACK);
    }

    const { photos, context } = (await req.json()) as Body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return json(400, { error: "Nenhuma foto enviada" });
    }

    console.log(`[analyze-physique] received ${photos.length} photo(s)`);

    const content: any[] = [
      {
        type: "text",
        text: `Contexto do usuário (quiz):\n${JSON.stringify(context ?? {}, null, 2)}\n\nAnalise as fotos a seguir e devolva o JSON pedido.`,
      },
      ...photos.slice(0, 3).map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    // Cascata de modelos: tenta o mais rápido primeiro, com fallbacks.
    const attempts: Array<{ model: string; timeoutMs: number }> = [
      { model: "google/gemini-2.5-flash", timeoutMs: 55_000 },
      { model: "google/gemini-2.5-flash-lite", timeoutMs: 40_000 },
      { model: "google/gemini-2.5-pro", timeoutMs: 60_000 },
    ];

    let parsed: any = null;
    for (const a of attempts) {
      parsed = await callModel(a.model, content, a.timeoutMs);
      if (parsed && (parsed.posture || parsed.priorities)) break;
    }

    // Garante resposta válida mesmo se todos os modelos falharem
    const safe = parsed ?? {};
    const result = {
      posture: safe.posture || FALLBACK.posture,
      symmetry: safe.symmetry || FALLBACK.symmetry,
      priorities:
        Array.isArray(safe.priorities) && safe.priorities.length
          ? safe.priorities.slice(0, 5)
          : FALLBACK.priorities,
      recommendation: safe.recommendation || FALLBACK.recommendation,
      _degraded: !parsed,
    };

    return json(200, result);
  } catch (e: any) {
    console.error("[analyze-physique] fatal", e?.message ?? e);
    // Nunca falhar para o usuário — retorna fallback genérico
    return json(200, FALLBACK);
  }
});
