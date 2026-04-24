// Admin-only: regenera protocolos ativos em massa após ajustes globais
// (correções na dieta, jejum, horários etc.)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Authenticate caller and verify admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = !!body?.dryRun;
    const reason: string = (body?.reason || "Reajuste global pós-correções (jejum/horários/dieta)").toString();

    // 2) Find all users with an ACTIVE protocol
    const { data: activeProtocols, error: protoErr } = await admin
      .from("protocols")
      .select("id, user_id, version, created_at")
      .eq("status", "active");

    if (protoErr) throw protoErr;

    const userIds = Array.from(new Set((activeProtocols || []).map((p) => p.user_id)));

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          eligible_users: userIds.length,
          eligible_protocols: activeProtocols?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 3) For each user, invoke generate-protocol with force_regenerate
    let success = 0;
    let failed = 0;
    const errors: Array<{ user_id: string; error: string }> = [];

    for (const uid of userIds) {
      try {
        // Load profile
        const { data: profile, error: pErr } = await admin
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();
        if (pErr || !profile) {
          failed++;
          errors.push({ user_id: uid, error: pErr?.message || "profile not found" });
          continue;
        }

        // Latest body assessment (optional)
        const { data: assessment } = await admin
          .from("body_assessments")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Invoke the existing generate-protocol function with service role
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-protocol`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
            apikey: SERVICE_KEY,
            // Pass caller identity via custom header (function uses auth.getUser, so we forge with service role JWT)
            // For bulk admin runs we instead bypass user check by using service role context. The generate-protocol
            // function expects an Authorization header — service role passes auth.getUser as the postgres role.
            // We pass an extra body field so generate-protocol can attribute the run to this user.
          },
          body: JSON.stringify({
            profile,
            bodyAssessment: assessment || undefined,
            bodyEmphasis: profile.body_emphasis || undefined,
            force_regenerate: true,
            admin_bulk: true,
            target_user_id: uid,
            reanalysisFeedback: { progressNotes: reason },
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          failed++;
          errors.push({ user_id: uid, error: `${resp.status}: ${txt.slice(0, 200)}` });
          continue;
        }
        success++;
      } catch (e: any) {
        failed++;
        errors.push({ user_id: uid, error: e?.message || String(e) });
      }
    }

    // 4) Audit log
    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "bulk_regenerate_protocols",
      metadata: { reason, total: userIds.length, success, failed, errors: errors.slice(0, 20) },
    });

    return new Response(
      JSON.stringify({
        total: userIds.length,
        success,
        failed,
        errors: errors.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e: any) {
    console.error("admin-bulk-regenerate error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
