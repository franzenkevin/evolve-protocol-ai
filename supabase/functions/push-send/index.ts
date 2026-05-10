import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Web Push implementation using Web Crypto API (no npm dependency needed)
const VAPID_PUBLIC_KEY = "BMmp6DMPssWyf3THCuLaEZqyJKER16tunmHZtiwA2_5RjzPqmyQikaSJb3mz3PvK9BfCX1iWjmAIWF_E3ZxQyZI";

function base64UrlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPrivateKey: string
) {
  // Create JWT for VAPID
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 3600,
    sub: "mailto:noreply@hypertrophy.app",
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import VAPID private key
  const privKeyBytes = base64UrlDecode(vapidPrivateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    await convertEcPrivateKeyToPkcs8(privKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s
  const rawSig = derToRaw(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${base64UrlEncode(rawSig.buffer)}`;

  const vapidPublicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);

  // Encrypt payload using Web Push encryption (simplified — send as plaintext for now)
  const response = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${base64UrlEncode(vapidPublicKeyBytes.buffer)}`,
      TTL: "3600",
      "Content-Type": "application/json",
      Urgency: "normal",
    },
    body: payload,
  });

  return response;
}

// Convert raw EC private key to PKCS8 format
async function convertEcPrivateKeyToPkcs8(rawKey: Uint8Array): Promise<ArrayBuffer> {
  // PKCS8 wrapper for P-256 private key
  const prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const suffix = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);

  const pubKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY);
  const result = new Uint8Array(prefix.length + rawKey.length + suffix.length + pubKeyBytes.length);
  result.set(prefix, 0);
  result.set(rawKey, prefix.length);
  result.set(suffix, prefix.length + rawKey.length);
  result.set(pubKeyBytes, prefix.length + rawKey.length + suffix.length);
  return result.buffer;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw
  if (der.length === 64) return der;
  // Parse DER: SEQUENCE { INTEGER r, INTEGER s }
  let offset = 2; // skip SEQUENCE tag + length
  if (der[1] & 0x80) offset += (der[1] & 0x7f);
  
  const rLen = der[offset + 1];
  const r = der.slice(offset + 2, offset + 2 + rLen);
  offset += 2 + rLen;
  const sLen = der[offset + 1];
  const s = der.slice(offset + 2, offset + 2 + sLen);

  const raw = new Uint8Array(64);
  raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  return raw;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!VAPID_PRIVATE_KEY) throw new Error("VAPID_PRIVATE_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional direct-send mode: { userId, title, body, url } — service-role only
    let directBody: { userId?: string; title?: string; body?: string; url?: string } | null = null;
    if (req.method === "POST") {
      try { directBody = await req.json(); } catch { /* no body */ }
    }
    if (directBody?.userId && directBody.title && directBody.body) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: userSubs, error: subErr } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", directBody.userId);
      if (subErr) throw subErr;

      let sentDirect = 0;
      for (const sub of userSubs || []) {
        try {
          const payload = JSON.stringify({
            title: directBody.title,
            body: directBody.body,
            data: { url: directBody.url || "/dashboard" },
          });
          await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            VAPID_PRIVATE_KEY
          );
          sentDirect++;
        } catch (e) {
          console.error("Direct push failed:", e);
          if (e instanceof Error && e.message.includes("410")) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
      return new Response(JSON.stringify({ sent: sentDirect, mode: "direct" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current hour in BRT (UTC-3)
    const now = new Date();
    const brtHour = (now.getUTCHours() - 3 + 24) % 24;
    
    // Map training times to reminder hours (30min before)
    const timeMap: Record<string, number[]> = {
      "Manhã (antes das 10h)": [6, 7, 8, 9],
      "Meio-dia (10h-14h)": [9, 10, 11, 12, 13],
      "Tarde (14h-18h)": [13, 14, 15, 16, 17],
      "Noite (após 18h)": [17, 18, 19, 20],
    };

    // Find which training times match current hour
    const matchingTimes = Object.entries(timeMap)
      .filter(([, hours]) => hours.includes(brtHour))
      .map(([time]) => time);

    if (matchingTimes.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no matching time" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscriptions for users who train at this time
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("training_time", matchingTimes);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const sub of subs) {
      try {
        const payload = JSON.stringify({
          title: "🏋️ Hora do treino!",
          body: "Seu treino está te esperando. Bora evoluir! 💪",
        });
        await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          VAPID_PRIVATE_KEY
        );
        sent++;
      } catch (e) {
        console.error("Push failed for", sub.endpoint, e);
        // If subscription expired (410), remove it
        if (e instanceof Error && e.message.includes("410")) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("push-send error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
