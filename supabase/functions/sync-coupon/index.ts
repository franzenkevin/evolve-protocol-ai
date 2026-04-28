// Sync a coupon (from public.coupons) to Stripe as a Coupon + PromotionCode.
// Called by admin actions when creating, updating or archiving a coupon.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Body {
  action: 'upsert' | 'archive';
  code: string;
  description?: string | null;
  discount_percent?: number;
  valid_until?: string | null;
  max_uses?: number | null;
  active?: boolean;
}

async function findPromotionByCode(code: string) {
  const stripe = getStripe();
  const list = await stripe.promotionCodes.list({ code, limit: 1 });
  return list.data[0] || null;
}

async function upsertCoupon(body: Body) {
  const stripe = getStripe();
  const code = body.code.toUpperCase();
  const existing = await findPromotionByCode(code);

  if (existing) {
    // Toggle active state
    if (body.active === false) {
      await stripe.promotionCodes.update(existing.id, { active: false });
      return { id: existing.id, action: 'deactivated' };
    }
    await stripe.promotionCodes.update(existing.id, { active: true });
    return { id: existing.id, action: 'reactivated' };
  }

  // Create coupon + promotion code
  const coupon = await stripe.coupons.create({
    percent_off: body.discount_percent ?? 0,
    duration: 'once',
    name: body.description || `Cupom ${code}`,
    max_redemptions: body.max_uses ?? undefined,
    redeem_by: body.valid_until ? Math.floor(new Date(body.valid_until).getTime() / 1000) : undefined,
  });
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    active: body.active !== false,
  });
  return { id: promo.id, coupon_id: coupon.id, action: 'created' };
}

async function archiveCoupon(code: string) {
  const stripe = getStripe();
  const existing = await findPromotionByCode(code.toUpperCase());
  if (!existing) return { action: 'not_found' };
  if (!existing.active) return { id: existing.id, action: 'already_inactive' };
  await stripe.promotionCodes.update(existing.id, { active: false });
  return { id: existing.id, action: 'archived' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleRow } = await service
      .from('user_roles')
      .select('role')
      .eq('user_id', u.user.id)
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

    const result =
      body.action === 'archive' ? await archiveCoupon(body.code) : await upsertCoupon(body);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[sync-coupon] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
