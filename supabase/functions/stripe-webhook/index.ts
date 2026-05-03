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

const LOGO_URL = 'https://evoriacoach.com/logo-email.png';
const SITE_URL = 'https://evoriacoach.com';

function buildWelcomeEmail(firstName: string, actionUrl: string) {
  const safeName = firstName || 'Atleta';
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Bem-vindo à Evoria Coach App</title></head>
<body style="margin:0;padding:24px 0;background:#0a0a0a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;background:#0f0f0f;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
    <!-- Header -->
    <div style="background:#000;padding:24px;text-align:center;border-bottom:1px solid #1f1f1f;">
      <a href="${SITE_URL}"><img src="${LOGO_URL}" width="140" alt="Evoria Coach" style="display:block;margin:0 auto;" /></a>
    </div>
    <!-- Content -->
    <div style="padding:32px 28px;">
      <h2 style="color:#fff;font-size:24px;margin:0 0 16px;font-weight:700;">Olá, ${safeName}! 🎉</h2>
      <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Pagamento confirmado! Bem-vindo(a) à <strong style="color:#22c55e;">Evoria Coach App</strong> — seu acesso está liberado.
      </p>
      <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Para começar, clique abaixo e <strong style="color:#fff;">crie sua senha</strong>:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${actionUrl}" style="display:inline-block;background:#22c55e;color:#0a0a0a;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          Criar minha senha e acessar
        </a>
      </div>
      <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:24px 0 0;">
        <strong style="color:#fff;">Próximos passos:</strong><br>
        1. Faça o tutorial inicial para conhecer o app.<br>
        2. Confira sua avaliação corporal completa gerada pela IA.<br>
        3. Comece seu protocolo personalizado de treino e dieta.
      </p>
      <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:24px 0 0;">
        ⚠️ Este link expira em 1 hora. Se expirar, acesse <a href="${SITE_URL}/login" style="color:#22c55e;">evoriacoach.com</a> e clique em "Esqueci minha senha".
      </p>
    </div>
    <!-- Footer -->
    <div style="padding:24px;text-align:center;background:#000;border-top:1px solid #1f1f1f;">
      <img src="${LOGO_URL}" width="100" alt="Evoria Coach" style="display:block;margin:0 auto 12px;opacity:0.85;" />
      <p style="color:#9ca3af;font-size:13px;margin:0 0 8px;line-height:1.5;">
        Evoria Coach App — seu software personalizado para te guiar ao corpo dos sonhos.
      </p>
      <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">
        Dúvidas? <a href="mailto:suporte@evoriacoach.com" style="color:#22c55e;text-decoration:none;">suporte@evoriacoach.com</a>
      </p>
      <p style="color:#6b7280;font-size:11px;margin:0;">© ${year} Evoria Coach · <a href="${SITE_URL}" style="color:#22c55e;text-decoration:none;">evoriacoach.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildExamInstructionsEmail(firstName: string, productLabel: string) {
  const safeName = firstName || 'Atleta';
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Próximos passos — ${productLabel}</title></head>
<body style="margin:0;padding:24px 0;background:#0a0a0a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;background:#0f0f0f;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
    <div style="background:#000;padding:24px;text-align:center;border-bottom:1px solid #1f1f1f;">
      <a href="${SITE_URL}"><img src="${LOGO_URL}" width="140" alt="Evoria Coach" style="display:block;margin:0 auto;" /></a>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="color:#fff;font-size:22px;margin:0 0 16px;font-weight:700;">Olá, ${safeName}! ✅</h2>
      <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Pagamento confirmado para <strong style="color:#22c55e;">${productLabel}</strong>. Obrigado pela confiança!
      </p>
      <p style="color:#d1d5db;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong style="color:#fff;">Próximos passos:</strong>
      </p>
      <ol style="color:#d1d5db;font-size:14px;line-height:1.7;margin:0 0 20px;padding-left:20px;">
        <li>Realize os exames listados no app (em <em>Exames &amp; Protocolo</em>) num laboratório de sua preferência.</li>
        <li>Reúna todos os resultados em formato <strong style="color:#fff;">PDF</strong>.</li>
        <li>Envie os PDFs para o e-mail <a href="mailto:suporte@evoriacoach.com" style="color:#22c55e;">suporte@evoriacoach.com</a> com o assunto: <em>"Exames — ${safeName}"</em>.</li>
      </ol>
      <div style="background:#111;border:1px solid #22c55e33;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
        <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0;">
          Assim que recebermos seus exames, nossa equipe fará a análise e o gestor responsável entrará em contato para dar continuidade ao protocolo.
        </p>
      </div>
      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
        Prazo médio de retorno: <strong style="color:#fff;">até 5 dias úteis</strong> após o recebimento dos exames.
      </p>
    </div>
    <div style="padding:24px;text-align:center;background:#000;border-top:1px solid #1f1f1f;">
      <img src="${LOGO_URL}" width="100" alt="Evoria Coach" style="display:block;margin:0 auto 12px;opacity:0.85;" />
      <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">
        Dúvidas? <a href="mailto:suporte@evoriacoach.com" style="color:#22c55e;text-decoration:none;">suporte@evoriacoach.com</a>
      </p>
      <p style="color:#6b7280;font-size:11px;margin:0;">© ${year} Evoria Coach · <a href="${SITE_URL}" style="color:#22c55e;text-decoration:none;">evoriacoach.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

const EXAM_PRODUCT_LABELS: Record<string, string> = {
  hypertrophy_exam_analysis_once: 'Análise de Exames',
  hypertrophy_hormone_60d_once: 'Análise + Protocolo Hormonal (60 dias)',
  hypertrophy_hormone_annual_once: 'Acompanhamento Hormonal Anual',
};

async function sendExamInstructionsEmail(
  recipientEmail: string,
  fallbackName: string | null,
  priceId: string,
) {
  try {
    const productLabel = EXAM_PRODUCT_LABELS[priceId] || 'Análise de Exames';
    const firstName = (fallbackName || '').split(' ')[0] || 'Atleta';
    const sendUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`;
    const resp = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        bcc: 'suporte@evoriacoach.com',
        subject: `📋 ${productLabel} — próximos passos`,
        html: buildExamInstructionsEmail(firstName, productLabel),
      }),
    });
    if (!resp.ok) {
      console.error('exam-instructions email failed', resp.status, await resp.text());
    } else {
      console.log('exam instructions email sent to', recipientEmail);
    }
  } catch (e) {
    console.warn('sendExamInstructionsEmail best-effort failed', e);
  }
}

async function sendWelcomeEmail(userId: string, fallbackName?: string | null) {
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
    const fullName = (user.user_metadata as any)?.full_name || fallbackName || '';
    const firstName = (fullName || '').split(' ')[0] || 'Atleta';

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
        const customFullName = session.custom_fields?.find((f: any) => f.key === 'full_name')?.text?.value || null;
        const buyerName = customFullName || session.customer_details?.name || null;
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
              user_metadata: { source: 'guest_checkout', full_name: buyerName || undefined },
            });
            if (cErr) {
              console.error('post-payment createUser failed', cErr);
            } else if (created.user) {
              userId = created.user.id;
            }
          }
          // Save name to profile + auth metadata if we have it
          if (userId && buyerName) {
            try {
              await sb.auth.admin.updateUserById(userId, {
                user_metadata: { full_name: buyerName },
              });
              await sb.from('profiles').upsert(
                { user_id: userId, full_name: buyerName },
                { onConflict: 'user_id' },
              );
            } catch (e) {
              console.warn('failed to save buyer name', e);
            }
          }
          await sb.from('leads').upsert(
            { email, name: buyerName, source: 'paywall_guest', status: 'converted', converted_user_id: userId || null },
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
          if (userId) await sendWelcomeEmail(userId, buyerName);
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

        // One-time payments (exames, hormonal, novo protocolo) — não geram assinatura
        if (session.mode === 'payment') {
          const purchasedPriceId = (session.metadata?.priceId as string) || '';
          if (buyerEmail && EXAM_PRODUCT_LABELS[purchasedPriceId]) {
            await sendExamInstructionsEmail(buyerEmail, buyerName, purchasedPriceId);
          } else if (userId) {
            // Outros one-time (ex.: novo protocolo) — welcome simples
            await sendWelcomeEmail(userId, buyerName);
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
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        // Renewal confirmed → refresh subscription period
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sub);
        }
        break;
      }
      case 'invoice.payment_failed': {
        // Payment failed → mark past_due so app can prompt the user
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          await getSupabase()
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subId);
        }
        break;
      }
      case 'charge.refunded': {
        // Full or partial refund issued
        const charge = event.data.object as Stripe.Charge;
        const isFullRefund = charge.amount_refunded >= charge.amount;
        const customerId = typeof charge.customer === 'string'
          ? charge.customer
          : charge.customer?.id;
        if (customerId && isFullRefund) {
          await getSupabase()
            .from('subscriptions')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('stripe_customer_id', customerId);
        }
        console.log('charge refunded', { charge: charge.id, full: isFullRefund });
        break;
      }
      case 'charge.dispute.created': {
        // Chargeback opened by customer's bank
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          const customerId = typeof charge.customer === 'string'
            ? charge.customer
            : charge.customer?.id;
          if (customerId) {
            await getSupabase()
              .from('subscriptions')
              .update({ status: 'disputed', updated_at: new Date().toISOString() })
              .eq('stripe_customer_id', customerId);
          }
        } catch (e) {
          console.error('dispute lookup failed', e);
        }
        console.warn('🚨 chargeback opened', { dispute: dispute.id, reason: dispute.reason, amount: dispute.amount });
        break;
      }
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log('dispute closed', { dispute: dispute.id, status: dispute.status });
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
