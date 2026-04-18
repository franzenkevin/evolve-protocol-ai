// Edge function: gera lote de 5 artigos rascunho do journal cobrindo
// treino, dieta, peptídeos, mente e suplementação. Salva todos como draft.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TOPICS: { topic: string; category: string }[] = [
  {
    topic:
      "treino de musculação: principal estudo recente sobre volume, frequência ou intensidade para hipertrofia",
    category: "treino",
  },
  {
    topic:
      "nutrição esportiva: descoberta recente sobre proteína, distribuição de macros ou timing alimentar para ganho de massa",
    category: "nutrição",
  },
  {
    topic:
      "peptídeos para performance e composição corporal (BPC-157, TB-500, GHRP, ipamorelina): evidência atual e segurança",
    category: "peptídeos",
  },
  {
    topic:
      "saúde mental e performance: sono, manejo de estresse, dopamina e disciplina aplicados a quem treina pesado",
    category: "mente",
  },
  {
    topic:
      "suplementação inteligente: novidades sobre creatina, ômega-3, vitamina D, ashwagandha ou cafeína para atletas",
    category: "suplementação",
  },
];

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
        excerpt: { type: "string", description: "Chamada curta (até 160 chars)" },
        summary: { type: "string", description: "Resumo (até 220 chars)" },
        content: { type: "string", description: "Artigo em markdown (300-700 palavras)" },
        tags: { type: "array", items: { type: "string" } },
        read_time_minutes: { type: "integer" },
      },
      required: ["title", "excerpt", "summary", "content", "tags", "read_time_minutes"],
      additionalProperties: false,
    },
  },
} as const;

async function generateOne(topic: string, category: string, apiKey: string) {
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Tema: ${topic}\n\nPesquise na web e gere o artigo agora.`,
        },
      ],
      tools: [TOOL, { type: "google_search" }],
      tool_choice: { type: "function", function: { name: "generate_article" } },
    }),
  });

  if (!aiResp.ok) {
    const text = await aiResp.text();
    throw new Error(`AI ${aiResp.status}: ${text.slice(0, 200)}`);
  }

  const data = await aiResp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("IA não retornou tool_call");
  const parsed = JSON.parse(toolCall.function.arguments);

  const grounding = data?.choices?.[0]?.grounding_metadata?.groundingChunks as any[] | undefined;
  const sources = (grounding || [])
    .map((c) => ({ title: c?.web?.title || c?.web?.uri, uri: c?.web?.uri }))
    .filter((s) => s.uri)
    .slice(0, 8);

  return { ...parsed, category, sources, ai_prompt: topic };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gera em sequência para não estourar rate limit
    const created: any[] = [];
    const errors: string[] = [];
    for (const t of TOPICS) {
      try {
        const draft = await generateOne(t.topic, t.category, LOVABLE_API_KEY);
        const { data: row, error } = await admin
          .from("journal_articles")
          .insert({
            title: draft.title,
            summary: draft.summary,
            excerpt: draft.excerpt,
            content: draft.content,
            category: draft.category,
            tags: draft.tags || null,
            read_time_minutes: draft.read_time_minutes || 3,
            status: "draft",
            ai_generated: true,
            ai_sources: draft.sources || null,
            ai_prompt: draft.ai_prompt,
          })
          .select("id, title, category")
          .single();
        if (error) throw error;
        created.push(row);
      } catch (e: any) {
        console.error(`Erro tema ${t.category}:`, e);
        errors.push(`${t.category}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ created, errors, total: created.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("journal-batch-generate error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
