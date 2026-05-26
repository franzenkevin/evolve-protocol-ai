// Edge function: análise física por IA (prévia do quiz Evoria)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-physique] LOVABLE_API_KEY ausente");
      return json(500, { error: "LOVABLE_API_KEY ausente" });
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

    // Timeout de 45s para o gateway
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 45_000);

    let resp: Response;
    try {
      resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(`[analyze-physique] gateway status=${resp.status}`);

    if (resp.status === 429) return json(429, { error: "Muitas requisições. Tente em instantes." });
    if (resp.status === 402) return json(402, { error: "Créditos de IA esgotados." });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("[analyze-physique] gateway error", t);
      return json(500, { error: `AI Gateway: ${resp.status}` });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      parsed = {};
    }

    const result = {
      posture: parsed.posture ?? "Postura geral alinhada, com pontos sutis a ajustar.",
      symmetry: parsed.symmetry ?? "Boa simetria entre lados, com pequenas assimetrias naturais.",
      priorities:
        Array.isArray(parsed.priorities) && parsed.priorities.length
          ? parsed.priorities.slice(0, 5)
          : ["Posterior de ombro e dorsais médias", "Glúteo médio e core", "Mobilidade torácica"],
      recommendation:
        parsed.recommendation ??
        "Foco em puxadas horizontais, rotação externa e core nas primeiras semanas.",
    };

    return json(200, result);
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Tempo esgotado na análise" : (e?.message ?? "erro interno");
    console.error("[analyze-physique] exception", msg);
    return json(500, { error: msg });
  }
});
