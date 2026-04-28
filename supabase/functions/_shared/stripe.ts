// Shared Stripe utility (BYOK) — uses STRIPE_SECRET_KEY env var.
// The key prefix (sk_test_ vs sk_live_) determines the environment automatically.
import Stripe from 'npm:stripe@17.5.0';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  _stripe = new Stripe(key, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });
  return _stripe;
}

export type StripeEnv = 'sandbox' | 'live';

export function getStripeEnv(): StripeEnv {
  const key = Deno.env.get('STRIPE_SECRET_KEY') || '';
  return key.startsWith('sk_test_') ? 'sandbox' : 'live';
}

// Map our human-readable price IDs to plan codes.
// Stripe price IDs are stored in lookup_key on Stripe (we set lookup_key = priceId).
export const PLAN_CODE_FROM_LOOKUP: Record<string, string> = {
  hypertrophy_monthly: 'monthly',
  hypertrophy_annual: 'annual',
};

export const PRICE_AMOUNT_BRL: Record<string, number> = {
  hypertrophy_monthly: 9700, // R$ 97,00 in cents
  hypertrophy_annual: 89700, // R$ 897,00 in cents
};

/**
 * Resolve a human-readable lookup_key (e.g. "hypertrophy_monthly") into the
 * Stripe internal price ID (price_xxx). Caches results in-memory per cold start.
 */
const _priceCache = new Map<string, string>();
export async function resolveStripePriceId(lookupKey: string): Promise<string> {
  if (_priceCache.has(lookupKey)) return _priceCache.get(lookupKey)!;
  const stripe = getStripe();
  const list = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const price = list.data[0];
  if (!price) throw new Error(`Stripe price not found for lookup_key=${lookupKey}`);
  _priceCache.set(lookupKey, price.id);
  return price.id;
}
