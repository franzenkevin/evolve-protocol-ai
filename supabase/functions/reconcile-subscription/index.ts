// Fallback: se o webhook do Paddle não chegou (ex: 2 endpoints conflitantes,
// gateway intermediário não repassa), o frontend pode chamar esta função
// após o checkout para forçar a sincronização da assinatura mais recente do usuário.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const PRICE_TO_PLAN_CODE: Record<string, string> = {
  hypertrophy_monthly: 'monthly',
  hypertrophy_annual: 'annual',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with the user's JWT — only to identify the caller.
    const supabaseUser = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Client with pure service role — bypasses RLS for the upsert.
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'Invalid user' }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const env: PaddleEnv = body?.environment === 'live' ? 'live' : 'sandbox';

    // Buscar todas as subs do Paddle e filtrar por customData.userId
    // (Paddle não tem filtro nativo por custom_data, então paginamos as ativas)
    const sub = await findUserSubscription(env, userId);
    if (!sub) {
      return json({
        synced: false,
        message: 'Nenhuma assinatura encontrada no provedor de pagamento.',
      });
    }

    const item = sub.items?.[0];
    const priceExt =
      item?.price?.import_meta?.external_id || item?.price?.id;
    const productExt =
      item?.product?.import_meta?.external_id ||
      item?.product?.id ||
      'hypertrophy_plan';
    const planCode = PRICE_TO_PLAN_CODE[priceExt] || 'monthly';

    const { error: upsertErr } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        paddle_subscription_id: sub.id,
        paddle_customer_id: sub.customer_id,
        product_id: productExt,
        price_id: priceExt,
        plan_type: planCode,
        status: sub.status,
        current_period_start: sub.current_billing_period?.starts_at,
        current_period_end: sub.current_billing_period?.ends_at,
        next_billing_date: sub.current_billing_period?.ends_at
          ? new Date(sub.current_billing_period.ends_at)
              .toISOString()
              .split('T')[0]
          : null,
        cancel_at_period_end: sub.scheduled_change?.action === 'cancel',
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (upsertErr) {
      console.error('upsert error:', upsertErr);
      return json({ error: 'DB error', details: upsertErr.message }, 500);
    }

    // Marcar lead convertido (best-effort)
    if (userData.user.email) {
      await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userData.user.email)
        .neq('status', 'converted');
    }

    return json({
      synced: true,
      subscription_id: sub.id,
      status: sub.status,
      plan: planCode,
    });
  } catch (e) {
    console.error('reconcile error:', e);
    return json(
      { error: 'Reconcile failed', details: String((e as Error).message) },
      500
    );
  }
});

async function findUserSubscription(env: PaddleEnv, userId: string) {
  // Paginação simples — busca subs recentes (ativas, trialing, past_due) e filtra
  const statuses = ['active', 'trialing', 'past_due'];
  for (const status of statuses) {
    let after: string | undefined = undefined;
    for (let page = 0; page < 5; page++) {
      const qs = new URLSearchParams({ status, per_page: '50' });
      if (after) qs.set('after', after);
      const res = await gatewayFetch(env, `/subscriptions?${qs.toString()}`);
      if (!res.ok) {
        console.error('paddle fetch failed:', await res.text());
        break;
      }
      const data = await res.json();
      const match = (data.data || []).find(
        (s: any) => s.custom_data?.userId === userId
      );
      if (match) return match;
      if (!data.meta?.pagination?.has_more) break;
      const next = data.meta?.pagination?.next as string | undefined;
      if (!next) break;
      const u = new URL(next);
      after = u.searchParams.get('after') || undefined;
      if (!after) break;
    }
  }
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
