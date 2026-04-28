// Opens a Stripe Customer Portal session for the logged-in user.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getStripe } from '../_shared/stripe.ts';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);

    const { data: sub } = await service
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', u.user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return json({ error: 'No subscription found' }, 404);

    const stripe = getStripe();
    const origin = req.headers.get('origin') || '';
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/plans`,
    });

    return json({ url: portal.url });
  } catch (e) {
    console.error('customer-portal error', e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
