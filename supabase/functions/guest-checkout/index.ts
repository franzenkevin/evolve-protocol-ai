// Cria/recupera usuário a partir de e-mail (sem senha) para checkout antes do login.
// Retorna userId pra ser passado no customData do Paddle, vinculando assinatura à conta.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email: rawEmail } = await req.json();
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userId: string | null = null;

    // Tenta criar; se já existir, busca via listUsers (paginação)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { source: 'guest_checkout' },
    });

    if (created?.user?.id) {
      userId = created.user.id;
    } else if (createErr && createErr.message?.toLowerCase().includes('already')) {
      // Busca o usuário existente paginando
      let page = 1;
      while (page <= 10 && !userId) {
        const { data: all } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        const found = all?.users?.find((u: any) => u.email?.toLowerCase() === email);
        if (found) userId = found.id;
        if (!all?.users || all.users.length < 200) break;
        page++;
      }
    } else if (createErr) {
      throw createErr;
    }

    if (!userId) throw new Error('could not create or find user');

    // Salva como lead (best-effort)
    try {
      await supabase.from('leads').upsert(
        { email, status: 'guest_checkout', updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    } catch (e) {
      console.warn('lead upsert failed:', e);
    }

    return new Response(JSON.stringify({ userId, email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('guest-checkout error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
