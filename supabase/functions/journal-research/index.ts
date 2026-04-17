// Edge function: gera rascunho de artigo de Journal usando Lovable AI com Google Search grounding.
// Recebe { topic } -> retorna { title, summary, excerpt, content, category, tags, read_time_minutes, sources[] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o redator científico do Hypertrophy, um app de musculação e nutrição.
Pesquise informações ATUAIS e CONFIÁVEIS na web sobre o tema solicitado e produza um artigo curto, prático e baseado em evidências para um leitor brasileiro que treina musculação.

Regras de escrita:
- Português do Brasil
- Tom direto, motivacional, sem firulas
- Cite estudos/órgãos quando possível (ISSN, ACSM, OMS, etc.) — sem inventar
- Conteúdo entre 300 e 700 palavras
- Use markdown leve (## subtítulos, **negrito**, listas)
- NUNCA fabrique fontes, datas, números ou nomes de pesquisadores

Você DEVE retornar a resposta SEMPRE chamando a função generate_article com os campos preenchidos.`;

const TOOL = {
  type: "function",
  function: {
    name: "generate_article",
    description: "Retorna o rascunho do artigo estruturado",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título atrativo (até 80 chars)" },
        excerpt: {
          type: "string",
          description: "Chamada curta para a lista (até 160 chars)",
        },
        summary: {
          type: "string",
          description: "Resumo de 1-2 frases (até 220 chars)",
        },
        content: {
          type: "string",
          description: "Artigo completo em markdown (300-700 palavras)",
        },
        category: {
          type: "string",
          description:
            "Categoria sugerida: treino, nutrição, suplementação, recuperação, saúde, ciência",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "3 a 6 tags em minúsculas",
        },
        read_time_minutes: {
          type: "integer",
          description: "Tempo de leitura estimado em minutos (2-6)",
        },
      },
      required: [
        "title",
        "excerpt",
        "summary",
        "content",
        "category",
        "tags",
        "read_time_minutes",
      ],
      additionalProperties: false,
    },
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY não configurada");

    // Auth: somente admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return new Response(JSON.stringify({ error: "Usuário inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const topic = String(body?.topic || "").trim();
    if (!topic || topic.length < 3 || topic.length > 300) {
      return new Response(
        JSON.stringify({ error: "Tema inválido (3-300 chars)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Tema do artigo: ${topic}\n\nPesquise na web e produza o artigo agora chamando a função generate_article.`,
            },
          ],
          tools: [TOOL, { type: "google_search" }],
          tool_choice: { type: "function", function: { name: "generate_article" } },
        }),
      },
    );

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI error", aiResp.status, text);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições à IA atingido. Aguarde alguns segundos e tente novamente.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Créditos de IA esgotados. Adicione créditos no workspace Lovable.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro na IA: " + text.slice(0, 200) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await aiResp.json();
    const choice = data?.choices?.[0]?.message;

    let parsed: any = null;
    const toolCall = choice?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Erro parsing tool args", e);
      }
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({
          error: "A IA não retornou o artigo no formato esperado. Tente novamente.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extrai fontes do grounding (quando disponível)
    const grounding = data?.choices?.[0]?.grounding_metadata
      ?.groundingChunks as any[] | undefined;
    const sources = (grounding || [])
      .map((c) => ({
        title: c?.web?.title || c?.web?.uri,
        uri: c?.web?.uri,
      }))
      .filter((s) => s.uri)
      .slice(0, 8);

    return new Response(
      JSON.stringify({
        ...parsed,
        sources,
        ai_prompt: topic,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    console.error("journal-research error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
