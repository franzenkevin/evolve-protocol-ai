// Admin-only one-shot seeder: creates the Hypertrophy products, prices and
// promo coupons on the Stripe account associated with STRIPE_SECRET_KEY.
// Idempotent: skips items that already exist (matched by lookup_key / code).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, getStripeEnv } from '../_shared/stripe.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const PRODUCT_DESCRIPTION = 'Evoria Coach App - seu software personalizado para te guiar ao corpo dos sonhos!';

async function ensurePrice(opts: {
  productName: string;
  productMetadataKey: string;
  lookupKey: string;
  amount: number;
  recurring?: 'month' | 'year';
}) {
  const stripe = getStripe();
  // 1) Check existing price by lookup_key
  const existing = await stripe.prices.list({ lookup_keys: [opts.lookupKey], limit: 1, expand: ['data.product'] });
  let priceStatus: 'exists' | 'created' = 'exists';
  let priceId: string | null = existing.data[0]?.id ?? null;
  let productId: string | null = null;

  if (existing.data[0]) {
    const prod: any = existing.data[0].product;
    productId = typeof prod === 'string' ? prod : prod?.id ?? null;
  }

  // 2) Find or create product
  if (!productId) {
    const products = await stripe.products.search({
      query: `metadata['external_id']:'${opts.productMetadataKey}'`,
      limit: 1,
    });
    if (products.data[0]) productId = products.data[0].id;
  }
  if (!productId) {
    const p = await stripe.products.create({
      name: opts.productName,
      description: PRODUCT_DESCRIPTION,
      metadata: { external_id: opts.productMetadataKey },
    });
    productId = p.id;
  } else {
    // Always sync name + description
    await stripe.products.update(productId, {
      name: opts.productName,
      description: PRODUCT_DESCRIPTION,
    });
  }

  // 3) Create price if missing
  if (!priceId) {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: opts.amount,
      currency: 'brl',
      lookup_key: opts.lookupKey,
      nickname: opts.lookupKey,
      ...(opts.recurring ? { recurring: { interval: opts.recurring } } : {}),
    });
    priceId = price.id;
    priceStatus = 'created';
  }

  return { lookup_key: opts.lookupKey, status: priceStatus, id: priceId, product: productId };
}

async function ensurePromo(code: string, percentOff: number, name: string) {
  const stripe = getStripe();
  // Look up active promotion codes with this code
  const existing = await stripe.promotionCodes.list({ code, active: true, limit: 10 });
  for (const pc of existing.data) {
    const couponId = typeof pc.coupon === 'string'
      ? pc.coupon
      : pc.coupon?.id ?? pc.promotion?.coupon;
    const coupon = couponId ? await stripe.coupons.retrieve(couponId) : null;
    if (coupon && Math.abs((coupon.percent_off ?? 0) - percentOff) < 0.001) {
      return { code, status: 'exists', id: pc.id, percent_off: coupon.percent_off };
    }
    // Divergent percent_off — deactivate so we can recreate with the new value
    await stripe.promotionCodes.update(pc.id, { active: false });
  }

  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name,
  });
  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id },
    code,
    active: true,
  });
  return { code, status: 'created', id: promo.id, coupon_id: coupon.id, percent_off: percentOff };
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
      .from('user_roles')
      .select('role')
      .eq('user_id', u.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden — admin only' }, 403);

    const env = getStripeEnv();

    const results = {
      environment: env,
      prices: [] as any[],
      promos: [] as any[],
    };

    results.prices.push(await ensurePrice({
      productName: 'Evoria Coach App — Mensal',
      productMetadataKey: 'hypertrophy_plan_monthly',
      lookupKey: 'hypertrophy_monthly',
      amount: 9700,
      recurring: 'month',
    }));
    results.prices.push(await ensurePrice({
      productName: 'Evoria Coach App — Anual',
      productMetadataKey: 'hypertrophy_plan_annual',
      lookupKey: 'hypertrophy_annual',
      amount: 89700,
      recurring: 'year',
    }));
    results.prices.push(await ensurePrice({
      productName: 'Evoria Coach App — Novo Protocolo (60 dias)',
      productMetadataKey: 'hypertrophy_new_protocol',
      lookupKey: 'hypertrophy_new_protocol_once',
      amount: 4990,
    }));
    results.prices.push(await ensurePrice({
      productName: 'Evoria Coach App — Análise de Exames',
      productMetadataKey: 'hypertrophy_exam_analysis',
      lookupKey: 'hypertrophy_exam_analysis_once',
      amount: 9990,
    }));

    // Launch coupons referenced by SectionPricing
    results.promos.push(await ensurePromo('LANCAMENTO', 69.2, 'Lançamento mensal — 69,2% off'));
    results.promos.push(await ensurePromo('LANCAMENTOANUAL', 33.2, 'Lançamento anual — 33,2% off'));

    return json({ ok: true, ...results });
  } catch (e) {
    console.error('stripe-seed error', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
