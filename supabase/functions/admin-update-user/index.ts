// Admin endpoint to edit users: profile fields, subscription, roles.
// Uses service role and verifies caller is admin via has_role().
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing auth" }, 401);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);

  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verify admin
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "Forbidden" }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, target_user_id, payload } = body ?? {};
  if (!action || !target_user_id) return json({ error: "Missing fields" }, 400);

  // Audit helper
  const audit = async (act: string, meta: Record<string, unknown> = {}) => {
    await admin.from("admin_audit_log").insert({
      admin_id: callerId,
      action: act,
      target_user_id,
      metadata: meta,
    });
  };

  try {
    switch (action) {
      case "update_profile": {
        const allowed = [
          "full_name",
          "age",
          "sex",
          "weight",
          "height",
          "goal",
          "activity_level",
          "training_days",
          "experience",
          "gym_type",
          "injuries",
          "allergies",
          "sleep_hours",
          "stress_level",
          "onboarding_complete",
        ];
        const update: Record<string, unknown> = {};
        for (const k of allowed) if (k in (payload ?? {})) update[k] = payload[k];
        if (!Object.keys(update).length) return json({ error: "No fields" }, 400);

        const { error } = await admin
          .from("profiles")
          .update(update)
          .eq("user_id", target_user_id);
        if (error) throw error;
        await audit("admin_update_profile", { fields: Object.keys(update) });
        return json({ ok: true });
      }

      case "upsert_subscription": {
        // Manual grant / extension
        const update = {
          user_id: target_user_id,
          plan_type: payload?.plan_type ?? "monthly",
          status: payload?.status ?? "active",
          current_period_end: payload?.current_period_end ?? null,
          next_billing_date: payload?.next_billing_date ?? null,
          environment: payload?.environment ?? "live",
          cancel_at_period_end: payload?.cancel_at_period_end ?? false,
        };
        // Try update first
        const { data: existing } = await admin
          .from("subscriptions")
          .select("id")
          .eq("user_id", target_user_id)
          .maybeSingle();
        if (existing) {
          const { error } = await admin
            .from("subscriptions")
            .update(update)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await admin.from("subscriptions").insert(update);
          if (error) throw error;
        }
        await audit("admin_upsert_subscription", update);
        return json({ ok: true });
      }

      case "cancel_subscription": {
        const { error } = await admin
          .from("subscriptions")
          .update({ status: "canceled", cancel_at_period_end: true })
          .eq("user_id", target_user_id);
        if (error) throw error;
        await audit("admin_cancel_subscription");
        return json({ ok: true });
      }

      case "set_role": {
        const role = payload?.role;
        if (!["admin", "user"].includes(role)) return json({ error: "Bad role" }, 400);
        if (target_user_id === callerId && role !== "admin")
          return json({ error: "Cannot demote self" }, 400);

        // Wipe existing roles, add new one
        await admin.from("user_roles").delete().eq("user_id", target_user_id);
        const { error } = await admin
          .from("user_roles")
          .insert({ user_id: target_user_id, role });
        if (error) throw error;
        await audit("admin_set_role", { role });
        return json({ ok: true });
      }

      case "delete_user": {
        if (target_user_id === callerId)
          return json({ error: "Cannot delete self" }, 400);
        const { error } = await admin.auth.admin.deleteUser(target_user_id);
        if (error) throw error;
        await audit("admin_delete_user");
        return json({ ok: true });
      }

      case "update_email": {
        const newEmail: string | undefined = payload?.email?.trim().toLowerCase();
        if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
          return json({ error: "Email inválido" }, 400);
        }
        // email_confirm:true -> troca direta sem precisar de confirmação do usuário
        const { error } = await admin.auth.admin.updateUserById(target_user_id, {
          email: newEmail,
          email_confirm: true,
        });
        if (error) throw error;
        await audit("admin_update_email", { new_email: newEmail });
        return json({ ok: true });
      }

      case "update_password": {
        const newPassword: string | undefined = payload?.password;
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
          return json({ error: "Senha deve ter pelo menos 6 caracteres" }, 400);
        }
        if (newPassword.length > 128) {
          return json({ error: "Senha muito longa" }, 400);
        }
        const { error } = await admin.auth.admin.updateUserById(target_user_id, {
          password: newPassword,
        });
        if (error) throw error;
        await audit("admin_update_password", {});
        return json({ ok: true });
      }

      case "grant_protocol_regen": {
        // Concede crédito de regeneração antecipada (admin manual, sem cobrança)
        const { error } = await admin.from("protocol_regenerations").insert({
          user_id: target_user_id,
          status: "granted",
          amount_brl: 0,
        });
        if (error) throw error;
        await audit("admin_grant_protocol_regen");
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-update-user error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
