// Stripe webhook handler — verifies signature, then upserts subscriptions.
// Also sends magic link to guest-checkout users on first payment.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, getStripeEnv, PLAN_CODE_FROM_LOOKUP } from '../_shared/stripe.ts';
import type Stripe from 'npm:stripe@17.5.0';

const env = getStripeEnv();

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }
  return _supabase;
}

function getWebhookSecret(): string {
  const v = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!v) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  return v;
}

async function maybeSendMagicLink(userId: string) {
  try {
    const sb = getSupabase();
    const { data: u } = await sb.auth.admin.getUserById(userId);
    const user = u?.user;
    if (!user?.email) return;
    const isGuest = (user.user_metadata as any)?.source === 'guest_checkout';
    const alreadyConfirmed = !!user.email_confirmed_at;
    if (!isGuest && alreadyConfirmed) return;

    await sb.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo: `${Deno.env.get('SITE_URL') || ''}/welcome` },
    });
    // Stripe will email the receipt; Supabase sends the magic link automatically when generateLink is called with email service configured.
  } catch (e) {
    console.warn('magic link best-effort failed', e);
  }
}

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription, sessionId?: string) {
  const stripe = getStripe();
  const userId = (sub.metadata?.userId as string) || null;
  if (!userId) {
    console.warn('subscription has no userId metadata, skipping', sub.id);
    return;
  }

  const item = sub.items.data[0];
  const lookupKey = item?.price?.lookup_key || (sub.metadata?.priceId as string) || '';
  const planCode = PLAN_CODE_FROM_LOOKUP[lookupKey] || (sub.metadata?.planCode as string) || 'monthly';
  const productId =
    typeof item?.price?.product === 'string'
      ? item.price.product
      : (item?.price?.product as Stripe.Product | undefined)?.id || 'hypertrophy_plan';

  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null;

  const sb = getSupabase();
  const { error } = await sb.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_session_id: sessionId || null,
      product_id: productId,
      price_id: lookupKey,
      plan_type: planCode,
      status: sub.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      next_billing_date: periodEnd ? periodEnd.split('T')[0] : null,
      cancel_at_period_end: !!sub.cancel_at_period_end,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
  if (error) console.error('upsert subscription failed', error);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  if (!sig) return new Response('Missing signature', { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, getWebhookSecret());
  } catch (e) {
    console.error('signature verification failed', e);
    return new Response(`Webhook Error: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.userId as string | undefined;

        // Provision user account from Stripe-collected email if not yet linked
        const buyerEmail =
          session.customer_details?.email || session.customer_email || null;
        if (!userId && buyerEmail) {
          const sb = getSupabase();
          const email = buyerEmail.toLowerCase();
          const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
          const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email);
          if (existing) {
            userId = existing.id;
          } else {
            const { data: created, error: cErr } = await sb.auth.admin.createUser({
              email,
              email_confirm: false,
              user_metadata: { source: 'guest_checkout' },
            });
            if (cErr) {
              console.error('post-payment createUser failed', cErr);
            } else if (created.user) {
              userId = created.user.id;
            }
          }
          await sb.from('leads').upsert(
            { email, name: null, source: 'paywall_guest', status: 'converted', converted_user_id: userId || null },
            { onConflict: 'email' },
          );
        }

        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          // Inject userId into subscription metadata if it's missing
          if (!sub.metadata?.userId && userId) {
            sub.metadata = { ...sub.metadata, userId, ...session.metadata };
            try {
              await stripe.subscriptions.update(subId, { metadata: sub.metadata });
            } catch (e) {
              console.warn('failed to update sub metadata', e);
            }
          }
          await upsertSubscriptionFromStripe(sub, session.id);
          if (userId) await maybeSendMagicLink(userId);
          // Mark lead converted
          if (session.customer_email) {
            await getSupabase()
              .from('leads')
              .update({
                status: 'converted',
                converted_user_id: userId || null,
                updated_at: new Date().toISOString(),
              })
              .eq('email', session.customer_email)
              .neq('status', 'converted');
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await getSupabase()
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      default:
        // Ignore other events for now
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('webhook handler error', e);
    return new Response('Webhook handler failed', { status: 500 });
  }
});
