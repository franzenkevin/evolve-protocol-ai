// Edge function: 2 modos.
// Modo 1 (search): { topic } -> retorna 3 sugestões de estudos do Google Scholar/PubMed
// Modo 2 (expand): { topic, selected: { study_title, study_url, study_authors?, study_year?, short_pitch? } }
//   -> retorna artigo completo já com source_url = study_url
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEARCH_SYSTEM = `Você é um pesquisador científico do app Hypertrophy (musculação e nutrição).
Sua tarefa: encontrar 3 ESTUDOS CIENTÍFICOS REAIS sobre o tema solicitado, priorizando Google Scholar (scholar.google.com), PubMed (pubmed.ncbi.nlm.nih.gov), revistas como JISSN, Sports Medicine, MSSE, JSCR.

Regras CRÍTICAS:
- NUNCA invente estudos, autores, anos, periódicos ou URLs
- Cada sugestão DEVE ter um link real e funcional (scholar.google.com, pubmed, doi.org, journal oficial)
- Prefira estudos dos últimos 10 anos
- 3 ângulos diferentes do mesmo tema (ex: efeito agudo, segurança, dose ideal)
- Se não encontrar 3 estudos com link confiável, retorne menos (mínimo 1)

Você DEVE responder SEMPRE chamando a função suggest_studies.`;

const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "suggest_studies",
    description: "Retorna 1 a 3 estudos científicos encontrados",
    parameters: {
      type: "object",
      properties: {
        studies: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              angle: { type: "string", description: "Ângulo/abordagem deste estudo (ex: dose-resposta, segurança, performance)" },
              study_title: { type: "string", description: "Título exato do estudo" },
              study_authors: { type: "string", description: "Autores principais (ex: Smith et al.)" },
              study_year: { type: "integer", description: "Ano de publicação" },
              study_url: { type: "string", description: "URL real do estudo (scholar, pubmed, doi)" },
              short_pitch: { type: "string", description: "Resumo de 1-2 frases sobre achado central (até 220 chars)" },
            },
            required: ["angle", "study_title", "study_url", "short_pitch"],
            additionalProperties: false,
          },
        },
      },
      required: ["studies"],
      additionalProperties: false,
    },
  },
} as const;

const EXPAND_SYSTEM = `Você é o redator científico do Hypertrophy.
Você vai escrever um artigo curto baseado em UM estudo específico fornecido pelo admin.
O artigo deve CITAR o estudo no corpo (autores, ano, periódico se souber) e usar a fonte como referência principal.

Regras de escrita:
- Português do Brasil
- Tom direto, motivacional, sem firulas
- 300-700 palavras
- Markdown leve (## subtítulos, **negrito**, listas)
- Cite o estudo principal no corpo (ex: "Segundo Smith et al. (2022)...")
- Pode trazer contexto extra mas sempre voltando ao estudo central
- NÃO invente dados que não estão no estudo

Você DEVE retornar chamando a função generate_article.`;

const EXPAND_TOOL = {
  type: "function",
  function: {
    name: "generate_article",
    description: "Retorna o rascunho do artigo",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título atrativo (até 80 chars)" },
        excerpt: { type: "string", description: "Chamada curta (até 160 chars)" },
        summary: { type: "string", description: "Resumo 1-2 frases (até 220 chars)" },
        content: { type: "string", description: "Artigo em markdown 300-700 palavras" },
        category: {
          type: "string",
          description: "treino, nutrição, suplementação, recuperação, saúde ou ciência",
        },
        tags: { type: "array", items: { type: "string" } },
        read_time_minutes: { type: "integer" },
      },
      required: ["title", "excerpt", "summary", "content", "category", "tags", "read_time_minutes"],
      additionalProperties: false,
    },
  },
} as const;

function isValidUrl(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function callAI(body: any, apiKey: string) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

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

    const { data: { user } } = await supabase.auth.getUser();
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

    if (!roleData)
      return new Response(JSON.stringify({ error: "Apenas admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const body = await req.json().catch(() => ({}));
    const topic = String(body?.topic || "").trim();
    const selected = body?.selected;

    if (!topic || topic.length < 3 || topic.length > 300) {
      return new Response(JSON.stringify({ error: "Tema inválido (3-300 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------- MODO 1: SEARCH (3 sugestões) --------
    if (!selected) {
      const aiResp = await callAI({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SEARCH_SYSTEM },
          {
            role: "user",
            content: `Tema: ${topic}\n\nPesquise no Google Scholar, PubMed e periódicos científicos. Retorne 3 estudos reais com link funcional via suggest_studies.`,
          },
        ],
        tools: [SEARCH_TOOL, { type: "google_search" }],
        tool_choice: { type: "function", function: { name: "suggest_studies" } },
      }, LOVABLE_API_KEY);

      if (!aiResp.ok) {
        const text = await aiResp.text();
        console.error("AI search error", aiResp.status, text);
        if (aiResp.status === 429)
          return new Response(JSON.stringify({ error: "Limite de IA atingido. Aguarde alguns segundos." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        if (aiResp.status === 402)
          return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        return new Response(JSON.stringify({ error: "Erro na IA: " + text.slice(0, 200) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await aiResp.json();
      const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
      let parsed: any = null;
      if (toolCall?.function?.arguments) {
        try { parsed = JSON.parse(toolCall.function.arguments); } catch (e) { console.error(e); }
      }

      const studies = (parsed?.studies || []).filter(
        (s: any) => s?.study_url && isValidUrl(s.study_url) && s?.study_title && s?.short_pitch,
      );

      if (!studies.length) {
        return new Response(
          JSON.stringify({ error: "Nenhum estudo encontrado. Refine o tema (ex: adicione 'creatina', 'hipertrofia', 'cafeína')." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ studies: studies.slice(0, 3), topic }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // -------- MODO 2: EXPAND (artigo a partir do estudo) --------
    const studyUrl = String(selected?.study_url || "").trim();
    const studyTitle = String(selected?.study_title || "").trim();
    if (!studyUrl || !isValidUrl(studyUrl) || !studyTitle) {
      return new Response(JSON.stringify({ error: "Estudo selecionado inválido (faltando URL ou título)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studyContext = `Tema do artigo: ${topic}

Estudo selecionado:
- Título: ${studyTitle}
- Autores: ${selected?.study_authors || "(não informado)"}
- Ano: ${selected?.study_year || "(não informado)"}
- URL: ${studyUrl}
- Achado central: ${selected?.short_pitch || "(não informado)"}

Escreva o artigo em torno deste estudo, citando-o no corpo.`;

    const aiResp = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: EXPAND_SYSTEM },
        { role: "user", content: studyContext },
      ],
      tools: [EXPAND_TOOL, { type: "google_search" }],
      tool_choice: { type: "function", function: { name: "generate_article" } },
    }, LOVABLE_API_KEY);

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("AI expand error", aiResp.status, text);
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "Limite de IA atingido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: "Erro na IA: " + text.slice(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = null;
    if (toolCall?.function?.arguments) {
      try { parsed = JSON.parse(toolCall.function.arguments); } catch (e) { console.error(e); }
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "IA não retornou artigo no formato esperado." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grounding = data?.choices?.[0]?.grounding_metadata?.groundingChunks as any[] | undefined;
    const extraSources = (grounding || [])
      .map((c) => ({ title: c?.web?.title || c?.web?.uri, uri: c?.web?.uri }))
      .filter((s) => s.uri && s.uri !== studyUrl)
      .slice(0, 6);

    // Fonte primária = estudo selecionado, sempre primeiro
    const sources = [
      { title: studyTitle, uri: studyUrl },
      ...extraSources,
    ];

    return new Response(
      JSON.stringify({
        ...parsed,
        sources,
        source_url: studyUrl,
        ai_prompt: `${topic} — estudo: ${studyTitle}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("journal-research error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
