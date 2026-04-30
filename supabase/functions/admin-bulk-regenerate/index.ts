// Admin-only: regenera protocolos ativos em massa após ajustes globais.
// Chama generate-protocol e grava o resultado na tabela protocols como nova versão.
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
      return jsonResp({ error: "Missing authorization" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate caller and check admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return jsonResp({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return jsonResp({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = !!body?.dryRun;
    const reason: string =
      (body?.reason || "Reajuste global pós-correções (jejum/horários/dieta)").toString();
    const limit: number | null = typeof body?.limit === "number" ? body.limit : null;
    const explicitTargets: string[] | null = Array.isArray(body?.target_user_ids)
      ? body.target_user_ids.filter((x: unknown) => typeof x === "string")
      : null;

    let userIds: string[] = [];

    if (explicitTargets && explicitTargets.length > 0) {
      userIds = explicitTargets;
    } else {
      // Find users with ACTIVE protocols (latest first, dedup per user)
      const { data: activeProtocols, error: protoErr } = await admin
        .from("protocols")
        .select("id, user_id, version, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (protoErr) throw protoErr;

      const seen = new Set<string>();
      for (const p of activeProtocols || []) {
        if (!seen.has(p.user_id)) {
          seen.add(p.user_id);
          userIds.push(p.user_id);
        }
      }
    }
    const targets = limit ? userIds.slice(0, limit) : userIds;

    if (dryRun) {
      return jsonResp({
        dryRun: true,
        eligible_users: userIds.length,
        will_process: targets.length,
      });
    }

    // Run heavy work in background to avoid 150s edge timeout.
    // Return immediately; progress is logged in admin_audit_log.
    const jobStartedAt = new Date().toISOString();
    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "bulk_regenerate_protocols_started",
      metadata: { reason, total: targets.length, started_at: jobStartedAt },
    });

    const work = async () => {
      let success = 0;
      let failed = 0;
      const errors: Array<{ user_id: string; error: string }> = [];

      for (const uid of targets) {
      try {
        const { data: profile } = await admin
          .from("profiles")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle();
        if (!profile) {
          failed++;
          errors.push({ user_id: uid, error: "profile not found" });
          continue;
        }

        const { data: assessment } = await admin
          .from("body_assessments")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Call generate-protocol using the admin's auth header (it requires a valid user JWT).
        // generate-protocol returns the JSON; we grab it and persist server-side as the target user's new protocol.
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-protocol`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({
            profile,
            bodyAssessment: assessment || undefined,
            bodyEmphasis: profile.body_emphasis || undefined,
            reanalysisFeedback: { progressNotes: reason },
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          failed++;
          errors.push({ user_id: uid, error: `gen ${resp.status}: ${txt.slice(0, 200)}` });
          continue;
        }
        const generated = await resp.json();
        if (!generated?.training || !generated?.diet) {
          failed++;
          errors.push({ user_id: uid, error: "invalid AI response" });
          continue;
        }

        // Mark previous active as 'superseded' and insert new active
        const { data: prev } = await admin
          .from("protocols")
          .select("id, version")
          .eq("user_id", uid)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        await admin
          .from("protocols")
          .update({ status: "superseded" })
          .eq("user_id", uid)
          .eq("status", "active");

        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + 60);

        const { error: insErr } = await admin.from("protocols").insert({
          user_id: uid,
          training: generated.training,
          diet: generated.diet,
          status: "active",
          version: (prev?.version || 1) + 1,
          start_date: today.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        });
        if (insErr) {
          failed++;
          errors.push({ user_id: uid, error: `insert: ${insErr.message}` });
          continue;
        }
        success++;
      } catch (e: any) {
        failed++;
        errors.push({ user_id: uid, error: e?.message || String(e) });
      }
      }

      await admin.from("admin_audit_log").insert({
        admin_id: user.id,
        action: "bulk_regenerate_protocols",
        metadata: { reason, total: targets.length, success, failed, errors: errors.slice(0, 20), started_at: jobStartedAt, finished_at: new Date().toISOString() },
      });
    };

    // @ts-ignore EdgeRuntime is provided by Supabase edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work());
    } else {
      // Fallback: fire-and-forget
      work().catch((e) => console.error("bulk regen background error", e));
    }

    return jsonResp({
      queued: true,
      total: targets.length,
      message: "Reajuste iniciado em background. Acompanhe pelo log de auditoria.",
    });
  } catch (e: any) {
    console.error("admin-bulk-regenerate error", e);
    return jsonResp({ error: e?.message || "Internal error" }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
