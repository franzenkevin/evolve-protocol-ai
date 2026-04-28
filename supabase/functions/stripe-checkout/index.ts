// Creates a Stripe Checkout Session. Email is collected by Stripe.
// User account is provisioned by the webhook AFTER successful payment.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, resolveStripePriceId, getStripeEnv, PLAN_CODE_FROM_LOOKUP } from '../_shared/stripe.ts';

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

interface Body {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  couponCode?: string;
  referralCode?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const body = (await req.json()) as Body;
    if (!body.priceId) return json({ error: 'priceId required' }, 400);

    // Optional: identify logged-in user (so we can attach to existing account)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const auth = req.headers.get('Authorization');
    if (auth) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: auth } },
        });
        const { data: u } = await userClient.auth.getUser();
        if (u?.user) {
          userId = u.user.id;
          userEmail = u.user.email ?? null;
        }
      } catch (e) {
        console.warn('auth lookup failed (continuing as guest)', e);
      }
    }

    const stripe = getStripe();
    const stripePriceId = await resolveStripePriceId(body.priceId);
    const planCode = PLAN_CODE_FROM_LOOKUP[body.priceId] || 'monthly';
    const env = getStripeEnv();

    // Resolve promo code if provided
    let discounts: any[] | undefined;
    if (body.couponCode) {
      try {
        const promos = await stripe.promotionCodes.list({
          code: body.couponCode,
          active: true,
          limit: 1,
        });
        const promo = promos.data[0];
        if (promo) discounts = [{ promotion_code: promo.id }];
      } catch (e) {
        console.warn('promotion_code lookup failed', e);
      }
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
    const successUrl =
      body.successUrl || `${origin}/checkout/success?plan=${planCode}`;
    const cancelUrl = body.cancelUrl || `${origin}/plans?canceled=1`;

    const sessionParams: any = {
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
        ? successUrl
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      locale: 'pt-BR',
      metadata: {
        ...(userId ? { userId } : {}),
        priceId: body.priceId,
        planCode,
        environment: env,
        ...(body.referralCode ? { referralCode: body.referralCode } : {}),
        ...(body.couponCode ? { couponCode: body.couponCode } : {}),
      },
      subscription_data: {
        metadata: {
          ...(userId ? { userId } : {}),
          priceId: body.priceId,
          planCode,
          environment: env,
          ...(body.referralCode ? { referralCode: body.referralCode } : {}),
        },
      },
    };

    // If logged in, prefill email; otherwise let Stripe collect it
    if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    if (discounts) {
      sessionParams.discounts = discounts;
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('stripe-checkout error', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
