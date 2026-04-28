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
  // Pick the right secret based on Stripe env (sandbox vs live)
  const isSandbox = env === 'sandbox';
  const v =
    Deno.env.get('STRIPE_WEBHOOK_SECRET') ||
    (isSandbox
      ? Deno.env.get('PAYMENTS_SANDBOX_WEBHOOK_SECRET')
      : Deno.env.get('PAYMENTS_LIVE_WEBHOOK_SECRET'));
  if (!v) throw new Error('Stripe webhook secret not configured');
  return v;
}

function buildWelcomeEmail(firstName: string, actionUrl: string) {
  const safeName = firstName || 'Atleta';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Bem-vindo à Evoria Coach App</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fafafa;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#22c55e;font-size:28px;margin:0;font-weight:700;letter-spacing:-0.5px;">EVORIA COACH APP</h1>
    </div>
    <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:32px;">
      <h2 style="color:#fafafa;font-size:22px;margin:0 0 16px;font-weight:700;">Olá, ${safeName}! 🎉</h2>
      <p style="color:#a3a3a3;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Pagamento confirmado! Seja muito bem-vindo(a) à <strong style="color:#22c55e;">Evoria Coach App</strong>.
      </p>
      <p style="color:#a3a3a3;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Para acessar seu app e começar seu protocolo personalizado, clique no botão abaixo e <strong style="color:#fafafa;">crie sua senha</strong>:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${actionUrl}" style="display:inline-block;background:#22c55e;color:#0a0a0a;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">
          Criar minha senha e acessar
        </a>
      </div>
      <p style="color:#737373;font-size:13px;line-height:1.6;margin:24px 0 0;">
        Após criar sua senha, você responderá um quiz único de 5 a 8 minutos. Suas respostas montarão seu treino e dieta pelos próximos 60 dias.
      </p>
      <p style="color:#737373;font-size:13px;line-height:1.6;margin:16px 0 0;">
        ⚠️ Este link expira em 1 hora. Se expirar, é só ir em <a href="https://evoriacoach.com/login" style="color:#22c55e;">evoriacoach.com</a> e clicar em "Esqueci minha senha".
      </p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#525252;font-size:12px;margin:0;">
        Dúvidas? Responda este e-mail ou escreva para <a href="mailto:suporte@evoriacoach.com" style="color:#22c55e;">suporte@evoriacoach.com</a>
      </p>
      <p style="color:#525252;font-size:11px;margin:8px 0 0;">© Evoria Coach App · Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendWelcomeEmail(userId: string) {
  try {
    const sb = getSupabase();
    const { data: u } = await sb.auth.admin.getUserById(userId);
    const user = u?.user;
    if (!user?.email) return;

    const siteUrl = Deno.env.get('SITE_URL') || 'https://evoriacoach.com';

    // Generate recovery link (works for both new users and existing) → redirects to /criar-senha
    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: { redirectTo: `${siteUrl}/criar-senha` },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error('generateLink failed', linkErr);
      return;
    }

    const actionUrl = linkData.properties.action_link;
    const firstName = ((user.user_metadata as any)?.full_name || '').split(' ')[0] || 'Atleta';

    // Call our SMTP send-email function
    const sendUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`;
    const resp = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: user.email,
        subject: '🎉 Bem-vindo à Evoria Coach App — crie sua senha de acesso',
        html: buildWelcomeEmail(firstName, actionUrl),
      }),
    });
    if (!resp.ok) {
      console.error('send-email failed', resp.status, await resp.text());
    } else {
      console.log('welcome email sent to', user.email);
    }
  } catch (e) {
    console.warn('sendWelcomeEmail best-effort failed', e);
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
          if (userId) await sendWelcomeEmail(userId);
          // Mark lead converted
          if (buyerEmail) {
            await getSupabase()
              .from('leads')
              .update({
                status: 'converted',
                converted_user_id: userId || null,
                updated_at: new Date().toISOString(),
              })
              .eq('email', buyerEmail.toLowerCase())
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
