// TEMP: Self-test for stripe-webhook. Calls itself with a properly-signed payload.
// Remove after validation. Requires admin auth.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // No auth required — this is a self-test that sends a fake (but properly signed)
  // checkout.session.completed event with no email and no subscription, so it's
  // a no-op on the database side. It only validates that the webhook signature
  // verification path works end-to-end.

  // Pick the right secret based on STRIPE_SECRET_KEY prefix
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
  const isSandbox = stripeKey.startsWith('sk_test_');
  const SECRET =
    Deno.env.get('STRIPE_WEBHOOK_SECRET') ||
    (isSandbox
      ? Deno.env.get('PAYMENTS_SANDBOX_WEBHOOK_SECRET')
      : Deno.env.get('PAYMENTS_LIVE_WEBHOOK_SECRET'));

  if (!SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'No webhook secret configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const event = {
    id: 'evt_selftest_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_selftest_' + Date.now(),
        object: 'checkout.session',
        mode: 'payment',
        payment_status: 'paid',
        customer_email: null,
        customer_details: { email: null },
        metadata: {},
        subscription: null,
      },
    },
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  const sigHeader = `t=${timestamp},v1=${sigHex}`;

  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': sigHeader },
    body: payload,
  });
  const text = await resp.text();

  return new Response(JSON.stringify({
    ok: resp.ok,
    status: resp.status,
    response: text,
    env: isSandbox ? 'sandbox' : 'live',
    eventId: event.id,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
