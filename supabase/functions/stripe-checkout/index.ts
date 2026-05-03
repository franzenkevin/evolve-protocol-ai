// Creates a Stripe Checkout Session. Email is collected by Stripe.
// User account is provisioned by the webhook AFTER successful payment.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, resolveStripePrice, getStripeEnv, PLAN_CODE_FROM_LOOKUP } from '../_shared/stripe.ts';

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
    const resolvedPrice = await resolveStripePrice(body.priceId);
    const stripePriceId = resolvedPrice.id;
    const checkoutMode = resolvedPrice.mode; // 'subscription' or 'payment'
    const planCode = PLAN_CODE_FROM_LOOKUP[body.priceId] || 'monthly';
    const env = getStripeEnv();

    // Resolve promo/coupon code: priority is manual couponCode, then referralCode (auto-created if missing).
    let discounts: any[] | undefined;

    async function resolvePromotionCode(code: string): Promise<string | null> {
      try {
        const list = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
        return list.data[0]?.id ?? null;
      } catch (e) {
        console.warn('promotion_code lookup failed', e);
        return null;
      }
    }

    if (body.couponCode) {
      const promoId = await resolvePromotionCode(body.couponCode);
      if (promoId) discounts = [{ promotion_code: promoId }];
      else console.warn(`couponCode "${body.couponCode}" not found in Stripe — checkout will proceed without discount`);
    } else if (body.referralCode) {
      // Validate referral exists in our DB
      const serviceClient = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      const { data: ref } = await serviceClient
        .from('referrals')
        .select('referral_code, user_id')
        .eq('referral_code', body.referralCode.toUpperCase())
        .maybeSingle();

      if (ref) {
        const refCode = ref.referral_code;
        // Try to find existing promotion_code with same code; create if missing
        let promoId = await resolvePromotionCode(refCode);
        if (!promoId) {
          try {
            const coupon = await stripe.coupons.create({
              percent_off: 10,
              duration: 'once',
              name: `Indicação ${refCode}`,
              metadata: { type: 'referral', referrer_user_id: ref.user_id },
            });
            const promo = await stripe.promotionCodes.create({
              coupon: coupon.id,
              code: refCode,
              active: true,
              metadata: { type: 'referral', referrer_user_id: ref.user_id },
            });
            promoId = promo.id;
            console.log(`auto-created referral promotion_code in Stripe: ${refCode}`);
          } catch (e) {
            console.error('failed to auto-create referral promotion_code', e);
          }
        }
        if (promoId) discounts = [{ promotion_code: promoId }];
      } else {
        console.warn(`referralCode "${body.referralCode}" not found in DB`);
      }
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
    const successUrl =
      body.successUrl || `${origin}/checkout/success?plan=${planCode}`;
    const cancelUrl = body.cancelUrl || `${origin}/plans?canceled=1`;

    const sharedMetadata = {
      ...(userId ? { userId } : {}),
      priceId: body.priceId,
      planCode,
      environment: env,
      ...(body.referralCode ? { referralCode: body.referralCode } : {}),
      ...(body.couponCode ? { couponCode: body.couponCode } : {}),
    };

    const isAnnual = planCode === 'annual';

    // Métodos de pagamento:
    // - Mensal (subscription): cartão (inclui Apple Pay / Google Pay automaticamente via wallets do navegador)
    // - One-time (anual, exames, hormonal): cartão + Pix + wallets (Apple/Google Pay)
    const paymentMethodTypes: string[] = ['card'];
    if (checkoutMode === 'payment') {
      paymentMethodTypes.push('pix');
    }

    const sessionParams: any = {
      mode: checkoutMode,
      payment_method_types: paymentMethodTypes,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl.includes('{CHECKOUT_SESSION_ID}')
        ? successUrl
        : `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      locale: 'pt-BR',
      metadata: sharedMetadata,
      // Coleta dados fiscais para emissão de nota (CPF/CNPJ via tax_id, endereço completo, nome)
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      tax_id_collection: { enabled: true },
      custom_fields: [
        {
          key: 'cpf',
          label: { type: 'custom', custom: 'CPF (para emissão de nota fiscal)' },
          type: 'text',
          text: { minimum_length: 11, maximum_length: 18 },
          optional: false,
        },
        {
          key: 'confirm_email',
          label: { type: 'custom', custom: 'Confirme seu e-mail' },
          type: 'text',
          optional: false,
        },
      ],
    };

    if (checkoutMode === 'subscription') {
      sessionParams.subscription_data = { metadata: sharedMetadata };
    } else {
      // Pagamento único: metadata + parcelamento sem juros até 12x para todos os one-time.
      sessionParams.payment_intent_data = { metadata: sharedMetadata };
      sessionParams.payment_method_options = {
        card: {
          installments: { enabled: true },
        },
      };
    }

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
