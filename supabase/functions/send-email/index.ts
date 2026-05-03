// Sends emails via Hostinger SMTP using nodemailer.
// Used for transactional emails (welcome, password setup, notifications).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import nodemailer from 'npm:nodemailer@6.9.16';
import { z } from 'npm:zod@3.23.8';

const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;
const SMTP_USER = Deno.env.get('HOSTINGER_SMTP_USER')!;
const SMTP_PASSWORD = Deno.env.get('HOSTINGER_SMTP_PASSWORD')!;
const FROM_NAME = 'Evoria Coach App';

const BodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  html: z.string().min(1),
  text: z.string().optional(),
  replyTo: z.string().email().optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
});

let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return _transporter;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: require valid JWT (called from other edge functions with service role, or from client)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const isServiceRole = token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!isServiceRole) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
      if (claimsErr || !claims?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { to, subject, html, text, replyTo, bcc } = parsed.data;
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to,
      ...(bcc ? { bcc } : {}),
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
      replyTo: replyTo || SMTP_USER,
    });

    console.log('email sent', { to, subject, messageId: info.messageId });

    return new Response(JSON.stringify({ ok: true, messageId: info.messageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-email error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
