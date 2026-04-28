// Admin-only diagnostic: lists current promotion codes for LANCAMENTO codes.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, getStripeEnv } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Unauthorized' }, 401);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: roleRow } = await service
      .from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden' }, 403);

    const stripe = getStripe();
    const out: Record<string, unknown> = { environment: getStripeEnv() };
    for (const code of ['LANCAMENTO', 'LANCAMENTOANUAL']) {
      const list = await stripe.promotionCodes.list({ code, limit: 10 });
      out[code] = await Promise.all(list.data.map(async (pc) => {
        const coupon = typeof pc.coupon === 'string'
          ? await stripe.coupons.retrieve(pc.coupon)
          : pc.coupon;
        return {
          promo_id: pc.id,
          code: pc.code,
          active: pc.active,
          created: new Date(pc.created * 1000).toISOString(),
          coupon_id: coupon?.id,
          percent_off: coupon?.percent_off,
          coupon_name: coupon?.name,
        };
      }));
    }
    return json(out);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
