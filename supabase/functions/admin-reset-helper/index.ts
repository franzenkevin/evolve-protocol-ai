// TEMPORARY admin helper — delete after use.
// Resets a hardcoded admin user's password and removes all MFA factors.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_EMAIL = "adminkevinfranzen@hypertrophy.app";
const NEW_PASSWORD = "AdminTest@2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find user
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: corsHeaders });
  const user = list.users.find((u) => u.email === TARGET_EMAIL);
  if (!user) return new Response(JSON.stringify({ error: "user not found" }), { status: 404, headers: corsHeaders });

  // Reset password
  const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, { password: NEW_PASSWORD });
  if (pwErr) return new Response(JSON.stringify({ error: pwErr.message }), { status: 500, headers: corsHeaders });

  // List + delete MFA factors
  const { data: factorsData, error: fErr } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  const factors = factorsData?.factors ?? [];
  const deleted: string[] = [];
  for (const f of factors) {
    const { error: dErr } = await admin.auth.admin.mfa.deleteFactor({ userId: user.id, id: f.id });
    if (!dErr) deleted.push(f.id);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user_id: user.id,
      email: user.email,
      password_reset: true,
      factors_found: factors.length,
      factors_deleted: deleted.length,
      list_factors_error: fErr?.message ?? null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
