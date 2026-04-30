import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const milestone = Number(body?.milestone_day);
    const responses = body?.responses || {};
    if (![30, 60].includes(milestone)) {
      return new Response(JSON.stringify({ error: "milestone_day inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega protocolo ativo + métricas
    const { data: protocol } = await supabase
      .from("protocols")
      .select("id, start_date, training, diet, version")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, sex, age, weight, height, goal")
      .eq("user_id", user.id)
      .maybeSingle();

    const startDate = protocol?.start_date || new Date(Date.now() - milestone * 86400000).toISOString().slice(0, 10);

    const { data: checkins } = await supabase
      .from("checkins")
      .select("weight, adherence, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .order("created_at", { ascending: true });

    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("session_date")
      .eq("user_id", user.id)
      .gte("session_date", startDate);

    const { data: workoutFb } = await supabase
      .from("workout_feedback")
      .select("rating, notes, session_date")
      .eq("user_id", user.id)
      .gte("session_date", startDate)
      .order("session_date", { ascending: false })
      .limit(20);

    const { data: dietFb } = await supabase
      .from("diet_feedback")
      .select("adherence, energy_level, hunger_level, digestion, rated_date")
      .eq("user_id", user.id)
      .gte("rated_date", startDate)
      .order("rated_date", { ascending: false })
      .limit(30);

    const initialWeight = checkins?.[0]?.weight ?? profile?.weight ?? null;
    const lastWeight = checkins?.[checkins.length - 1]?.weight ?? null;
    const weightDelta =
      initialWeight && lastWeight ? Number((Number(lastWeight) - Number(initialWeight)).toFixed(1)) : null;
    const adherenceAvg =
      checkins && checkins.length > 0
        ? Math.round(checkins.reduce((s, c) => s + (c.adherence || 0), 0) / checkins.length)
        : null;
    const workoutsDone = workoutLogs?.length || 0;
    const dietAdhAvg =
      dietFb && dietFb.length > 0
        ? Math.round(dietFb.reduce((s, d) => s + (d.adherence || 0), 0) / dietFb.length)
        : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isMid = milestone === 30;
    const systemPrompt = isMid
      ? `Você é um coach de hipertrofia experiente. Faça uma análise CURTA (máx 3 parágrafos) do progresso do aluno em 30 dias do protocolo. Seja sincero: destaque o que melhorou de fato, aponte fragilidades sem suavizar, e oriente que o protocolo é de 60 dias — então deve continuar firme até o final para colher os frutos. Português BR, tom direto e motivador, sem floreios.`
      : `Você é um coach de hipertrofia experiente. O aluno completou 60 dias do protocolo. Faça uma análise SINCERA da evolução: o que ele realmente conquistou, o que não evoluiu como esperado e por quê (com base nos dados e nas respostas dele). Não suavize fracassos — seja direto. Em seguida, indique as principais mudanças que serão feitas no próximo protocolo de 60 dias com base nas respostas e no histórico (treino, dieta, solicitações, mudanças de rotina). Português BR, máx 4 parágrafos curtos.`;

    const userPayload = {
      milestone_day: milestone,
      profile: {
        nome: profile?.full_name,
        sexo: profile?.sex,
        idade: profile?.age,
        objetivo: profile?.goal,
        altura_cm: profile?.height,
      },
      metricas: {
        peso_inicial_kg: initialWeight,
        peso_atual_kg: lastWeight,
        delta_peso_kg: weightDelta,
        treinos_realizados: workoutsDone,
        treinos_esperados_aprox: Math.round(milestone * (4 / 7)),
        aderencia_checkins_pct: adherenceAvg,
        aderencia_dieta_pct: dietAdhAvg,
        feedbacks_treino_recentes: workoutFb?.slice(0, 5).map((w) => ({
          rating: w.rating,
          notes: w.notes,
          data: w.session_date,
        })),
      },
      respostas_aluno: responses,
      protocolo_versao: protocol?.version,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Tente em 1 minuto." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const analysis = aiJson?.choices?.[0]?.message?.content || "Análise indisponível.";

    // Persiste o feedback
    const { data: saved, error: saveErr } = await supabase
      .from("protocol_milestone_feedbacks")
      .upsert(
        {
          user_id: user.id,
          protocol_id: protocol?.id || null,
          milestone_day: milestone,
          diet_notes: responses?.diet_notes || null,
          training_notes: responses?.training_notes || null,
          requests_notes: responses?.requests_notes || null,
          routine_changes_notes: responses?.routine_changes_notes || null,
          ai_analysis: {
            text: analysis,
            metrics: userPayload.metricas,
            generated_at: new Date().toISOString(),
          },
        },
        { onConflict: "user_id,protocol_id,milestone_day" }
      )
      .select()
      .single();

    if (saveErr) console.error("Save error:", saveErr);

    return new Response(
      JSON.stringify({
        analysis,
        metrics: userPayload.metricas,
        feedback_id: saved?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("milestone-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
