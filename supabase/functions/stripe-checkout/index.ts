// Creates a Stripe Checkout Session for either a logged-in user or a guest.
// For guests: provisions an auth user silently (so post-payment we can magic-link them).
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
  priceId: string;            // human-readable lookup_key
  successUrl?: string;
  cancelUrl?: string;
  couponCode?: string;        // promotion_code "code" (e.g. LANCAMENTO)
  referralCode?: string;
  guestEmail?: string;        // when not logged in
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as Body;
    if (!body.priceId) return json({ error: 'priceId required' }, 400);

    // Identify user (optional — guest checkout supported)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const auth = req.headers.get('Authorization');
    if (auth) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: auth } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user) {
        userId = u.user.id;
        userEmail = u.user.email ?? null;
      }
    }

    // Guest flow: provision auth user from email
    if (!userId) {
      const email = body.guestEmail?.trim().toLowerCase();
      if (!email) return json({ error: 'Email required for guest checkout' }, 400);

      // Check if user already exists
      const { data: existingList } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = existingList?.users?.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        userId = existing.id;
        userEmail = email;
      } else {
        const { data: created, error: createErr } = await service.auth.admin.createUser({
          email,
          email_confirm: false,
          user_metadata: { source: 'guest_checkout' },
        });
        if (createErr || !created.user) {
          console.error('createUser failed', createErr);
          return json({ error: 'Could not create account' }, 500);
        }
        userId = created.user.id;
        userEmail = email;

        // Best-effort lead record
        await service.from('leads').upsert(
          { email, name: null, source: 'paywall_guest', status: 'new' },
          { onConflict: 'email', ignoreDuplicates: true },
        );
      }
    }

    const stripe = getStripe();
    const stripePriceId = await resolveStripePriceId(body.priceId);
    const planCode = PLAN_CODE_FROM_LOOKUP[body.priceId] || 'monthly';
    const env = getStripeEnv();

    // Resolve promo code if provided (Stripe needs the promotion_code object id)
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
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
      body.successUrl || `${origin}/checkout/success?plan=${planCode}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${origin}/plans?canceled=1`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
        ? successUrl
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      locale: 'pt-BR',
      metadata: {
        userId: userId!,
        priceId: body.priceId,
        planCode,
        environment: env,
        ...(body.referralCode ? { referralCode: body.referralCode } : {}),
        ...(body.couponCode ? { couponCode: body.couponCode } : {}),
      },
      subscription_data: {
        metadata: {
          userId: userId!,
          priceId: body.priceId,
          planCode,
          environment: env,
          ...(body.referralCode ? { referralCode: body.referralCode } : {}),
        },
      },
    };

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

// Type-only import to satisfy Stripe namespace usage above without runtime cost
import type Stripe from 'npm:stripe@17.5.0';
