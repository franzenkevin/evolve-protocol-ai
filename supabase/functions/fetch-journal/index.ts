import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Topics to search for
    const topics = [
      "peptides bodybuilding research 2025",
      "hypertrophy training science study",
      "fitness aesthetics supplement evidence",
      "hormonal optimization men health study",
      "body composition nutrition research",
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Ask AI to generate a journal article summary
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a fitness science journalist. Generate a realistic journal article entry about recent research in fitness, hypertrophy, peptides, or aesthetics. Return ONLY valid JSON with these fields:
- title (string, max 100 chars, in Portuguese BR)
- summary (string, 2-3 paragraphs in Portuguese BR, summarizing a hypothetical recent study)
- category (one of: "fitness", "nutrição", "peptídeos", "hormonal", "estética")
- source_url (a plausible PubMed or journal URL)

Do NOT wrap in markdown code blocks. Return raw JSON only.`
          },
          {
            role: "user",
            content: `Generate a journal article about: ${randomTopic}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content from AI");

    // Parse the JSON response
    let article;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      article = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Insert into database
    const { data, error } = await supabase.from("journal_articles").insert({
      title: article.title,
      summary: article.summary,
      source_url: article.source_url || null,
      category: article.category || "fitness",
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, article: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-journal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
