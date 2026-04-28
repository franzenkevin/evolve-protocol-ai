// Fallback for when the Stripe webhook didn't reach us (rare, but possible during setup).
// Looks up the user's most recent subscription on Stripe via metadata.userId and upserts it.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe, getStripeEnv, PLAN_CODE_FROM_LOOKUP } from '../_shared/stripe.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

    const { data: u, error: uerr } = await supabaseUser.auth.getUser();
    if (uerr || !u.user) return json({ error: 'Invalid user' }, 401);
    const userId = u.user.id;
    const env = getStripeEnv();

    const stripe = getStripe();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (session.metadata?.userId && session.metadata.userId !== userId) {
        return json({ error: 'Session does not belong to authenticated user' }, 403);
      }

      const sessionSub = session.subscription;
      if (session.mode === 'subscription' && sessionSub) {
        const sub = typeof sessionSub === 'string'
          ? await stripe.subscriptions.retrieve(sessionSub)
          : sessionSub;

        const item = sub.items.data[0];
        const lookupKey = item?.price?.lookup_key || (sub.metadata?.priceId as string) || '';
        const planCode = PLAN_CODE_FROM_LOOKUP[lookupKey] || 'monthly';
        const productId =
          typeof item?.price?.product === 'string' ? item.price.product : 'hypertrophy_plan';
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null;

        const { error: upsertFromSessionErr } = await service.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            stripe_session_id: session.id,
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

        if (upsertFromSessionErr) {
          return json({ error: 'DB error', details: upsertFromSessionErr.message }, 500);
        }

        return json({ synced: true, subscription_id: sub.id, status: sub.status, plan: planCode });
      }
    }

    // Search subscriptions by metadata.userId
    const search = await stripe.subscriptions.search({
      query: `metadata['userId']:'${userId}' AND status:'active'`,
      limit: 1,
    });
    let sub = search.data[0];
    if (!sub) {
      const search2 = await stripe.subscriptions.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      sub = search2.data[0];
    }

    if (!sub) {
      return json({ synced: false, message: 'Nenhuma assinatura encontrada no provedor.' });
    }

    const item = sub.items.data[0];
    const lookupKey = item?.price?.lookup_key || (sub.metadata?.priceId as string) || '';
    const planCode = PLAN_CODE_FROM_LOOKUP[lookupKey] || 'monthly';
    const productId =
      typeof item?.price?.product === 'string' ? item.price.product : 'hypertrophy_plan';

    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    const periodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : null;

    const { error: upsertErr } = await service.from('subscriptions').upsert(
      {
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
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

    if (upsertErr) return json({ error: 'DB error', details: upsertErr.message }, 500);

    if (u.user.email) {
      await service
        .from('leads')
        .update({
          status: 'converted',
          converted_user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('email', u.user.email)
        .neq('status', 'converted');
    }

    return json({ synced: true, subscription_id: sub.id, status: sub.status, plan: planCode });
  } catch (e) {
    console.error('reconcile error', e);
    return json({ error: 'Reconcile failed', details: String((e as Error).message) }, 500);
  }
});
