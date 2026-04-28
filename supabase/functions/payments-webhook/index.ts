import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const PRICE_TO_PLAN_CODE: Record<string, string> = {
  hypertrophy_monthly: 'monthly',
  hypertrophy_annual: 'annual',
};

const ONE_TIME_PRICES = new Set([
  'hypertrophy_new_protocol_once',
  'hypertrophy_exam_analysis_once',
  'hypertrophy_hormone_60d_once',
  'hypertrophy_hormone_annual_once',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('[paddle webhook]', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id);
        await handleTransactionCompleted(event.data, env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData — cannot link subscription');
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product?.importMeta?.externalId || item.product?.id || 'hypertrophy_plan';
  const planCode = PRICE_TO_PLAN_CODE[priceId] || 'monthly';

  // Upsert subscription row
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    plan_type: planCode,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    next_billing_date: currentBillingPeriod?.endsAt
      ? new Date(currentBillingPeriod.endsAt).toISOString().split('T')[0]
      : null,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });

  // Business logic on first purchase
  // 1) Mark lead as converted (if exists)
  const { data: userInfo } = await supabase.auth.admin.getUserById(userId);
  const email = userInfo?.user?.email;
  if (email) {
    await supabase.from('leads')
      .update({ status: 'converted', converted_user_id: userId, updated_at: new Date().toISOString() })
      .eq('email', email)
      .neq('status', 'converted');
  }

  // 2) Referral commission (20% one-time)
  if (customData?.referralCode) {
    const { data: ref } = await supabase
      .from('referrals')
      .select('id, user_id, cashback_amount')
      .eq('referral_code', customData.referralCode)
      .maybeSingle();
    if (ref && ref.user_id !== userId) {
      const planPriceMap: Record<string, number> = { monthly: 97, annual: 997 };
      const cashback = Math.round((planPriceMap[planCode] || 0) * 0.2 * 100) / 100;
      await supabase.from('referrals').update({
        referred_user_id: userId,
        status: 'converted',
        cashback_amount: cashback,
        updated_at: new Date().toISOString(),
      }).eq('id', ref.id);
    }
  }

  // 3) Welcome push notification (fire-and-forget)
  try {
    const fnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-send`;
    fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userId,
        title: '🎉 Bem-vindo ao Hypertrophy!',
        body: 'Seu acesso está liberado. Bora montar seu primeiro protocolo!',
        url: '/welcome',
      }),
    }).catch((e) => console.error('welcome push dispatch failed:', e));
  } catch (e) {
    console.error('welcome push error:', e);
  }

  // 4) Magic link para guest checkout (cliente pagou sem ter conta criada antes)
  try {
    const isGuest = userInfo?.user?.user_metadata?.source === 'guest_checkout';
    if (isGuest && email) {
      const siteUrl = Deno.env.get('SITE_URL') || 'https://evolve-protocol-ai.lovable.app';
      const { error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/welcome?checkout=success` },
      });
      if (linkErr) console.error('magic link generation failed:', linkErr);
      else console.log(`✅ magic link enviado para ${email}`);
    }
  } catch (e) {
    console.error('magic link error:', e);
  }

  console.log(`✅ subscription ${id} ativada para user ${userId} (${planCode})`);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, items, currentBillingPeriod, scheduledChange } = data;
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId || item?.price?.id;
  const planCode = priceId ? PRICE_TO_PLAN_CODE[priceId] : undefined;

  const patch: Record<string, unknown> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    next_billing_date: currentBillingPeriod?.endsAt
      ? new Date(currentBillingPeriod.endsAt).toISOString().split('T')[0]
      : null,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };
  if (priceId) patch.price_id = priceId;
  if (planCode) patch.plan_type = planCode;

  await supabase.from('subscriptions')
    .update(patch)
    .eq('paddle_subscription_id', id)
    .eq('environment', env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Cancellation: keep access until current_period_end (already stored)
  await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  // Trata compras one-time (não-assinaturas): regen de protocolo, exames, etc.
  // Subscriptions são tratadas em SubscriptionCreated/Updated.
  if (data.subscriptionId) return; // já é uma assinatura

  const userId = data.customData?.userId;
  if (!userId) {
    console.log('No userId in transaction customData — ignorando');
    return;
  }
  const items = data.items || [];
  for (const item of items) {
    const priceExternalId =
      item.price?.importMeta?.externalId || item.price?.customData?.externalId;
    if (!priceExternalId || !ONE_TIME_PRICES.has(priceExternalId)) continue;

    if (priceExternalId === 'hypertrophy_new_protocol_once') {
      await supabase.from('protocol_regenerations').insert({
        user_id: userId,
        paddle_transaction_id: data.id,
        amount_brl: 19.9,
        status: 'paid',
      });
      console.log(`✅ regen credit ${data.id} → user ${userId}`);
    }

    // exames/hormonal: só registra log + push (sem regra de uso ainda)
    if (priceExternalId.startsWith('hypertrophy_exam') || priceExternalId.startsWith('hypertrophy_hormone')) {
      try {
        const fnUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-send`;
        fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            userId,
            title: '✅ Pagamento confirmado',
            body: 'Em até 48h enviaremos a análise dos seus exames por e-mail.',
            url: '/exams',
          }),
        }).catch(() => {});
      } catch {}
    }
  }
}
