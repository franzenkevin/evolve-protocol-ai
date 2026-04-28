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
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Procura usuário existente
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    let userId: string | null = null;
    // listUsers não filtra por email — fazer lookup direto
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1)
      .maybeSingle();

    // Tenta achar via auth.users por email
    const { data: byEmail, error: byEmailErr } = await supabase.rpc('get_user_id_by_email', { _email: email }).maybeSingle?.() ?? { data: null, error: null };

    if (byEmail?.user_id) {
      userId = byEmail.user_id as string;
    } else {
      // Cria usuário sem senha (auto-confirma email pra que magic link funcione no retorno)
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { source: 'guest_checkout' },
      });
      if (createErr) {
        // Se já existir, tenta buscar
        if (createErr.message?.toLowerCase().includes('already')) {
          // Lista todos e filtra (fallback)
          const { data: all } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
          const found = all?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
          if (found) userId = found.id;
        } else {
          throw createErr;
        }
      } else {
        userId = created.user!.id;
      }
    }

    if (!userId) throw new Error('could not create or find user');

    // Salva como lead (se não existir)
    await supabase.from('leads').upsert(
      { email, status: 'guest_checkout', updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    );

    return new Response(JSON.stringify({ userId }), {
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
