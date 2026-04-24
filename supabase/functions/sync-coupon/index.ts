// Sync a coupon (from public.coupons) to Paddle as a Discount in BOTH environments.
// Called by admin actions when creating, updating or deleting a coupon.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'upsert' | 'archive';

interface Body {
  action: Action;
  code: string;
  description?: string | null;
  discount_percent?: number;
  valid_until?: string | null;
  max_uses?: number | null;
  active?: boolean;
}

const ENVS: PaddleEnv[] = ['sandbox', 'live'];

async function findDiscountByCode(env: PaddleEnv, code: string) {
  const res = await gatewayFetch(env, `/discounts?code=${encodeURIComponent(code)}&status=active,archived`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] ?? null;
}

async function upsertDiscount(env: PaddleEnv, body: Body) {
  const code = body.code.toUpperCase();
  const existing = await findDiscountByCode(env, code);

  const payload: Record<string, unknown> = {
    description: body.description || `Cupom ${code}`,
    type: 'percentage',
    amount: String(body.discount_percent ?? 0),
    code,
    enabled_for_checkout: body.active !== false,
    recur: false,
  };
  if (body.max_uses) payload.usage_limit = body.max_uses;
  if (body.valid_until) payload.expires_at = new Date(body.valid_until).toISOString();

  if (existing) {
    // PATCH — Paddle doesn't allow changing 'code' on update; remove it
    const { code: _drop, ...patch } = payload;
    if (body.active === false) (patch as any).status = 'archived';
    else (patch as any).status = 'active';
    const res = await gatewayFetch(env, `/discounts/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Paddle PATCH failed (${env}): ${res.status} ${txt}`);
    }
    return { env, id: existing.id, action: 'updated' };
  }

  const res = await gatewayFetch(env, `/discounts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Paddle POST failed (${env}): ${res.status} ${txt}`);
  }
  const json = await res.json();
  return { env, id: json.data?.id, action: 'created' };
}

async function archiveDiscount(env: PaddleEnv, code: string) {
  const existing = await findDiscountByCode(env, code);
  if (!existing) return { env, action: 'not_found' };
  if (existing.status === 'archived') return { env, id: existing.id, action: 'already_archived' };
  const res = await gatewayFetch(env, `/discounts/${existing.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'archived' }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Paddle archive failed (${env}): ${res.status} ${txt}`);
  }
  return { env, id: existing.id, action: 'archived' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Authn: must be a logged-in admin
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleRow } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return new Response('Forbidden', { status: 403, headers: corsHeaders });

    const body = (await req.json()) as Body;
    if (!body.action || !body.code) {
      return new Response(JSON.stringify({ error: 'Missing action or code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];
    for (const env of ENVS) {
      try {
        if (body.action === 'archive') {
          results.push(await archiveDiscount(env, body.code.toUpperCase()));
        } else {
          results.push(await upsertDiscount(env, body));
        }
      } catch (e) {
        console.error(`[sync-coupon] ${env} error`, e);
        results.push({ env, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[sync-coupon] fatal', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
