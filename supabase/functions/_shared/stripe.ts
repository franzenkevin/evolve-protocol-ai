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
  hypertrophy_new_protocol_once: 'new_protocol',
  hypertrophy_exam_analysis_once: 'exam_analysis',
  hypertrophy_hormone_60d_once: 'hormone_60d',
  hypertrophy_hormone_annual_once: 'hormone_annual',
};

export const PRICE_AMOUNT_BRL: Record<string, number> = {
  hypertrophy_monthly: 9700, // R$ 97,00
  hypertrophy_annual: 89700, // R$ 897,00
  hypertrophy_new_protocol_once: 4990, // R$ 49,90
  hypertrophy_exam_analysis_once: 9990, // R$ 99,90
  hypertrophy_hormone_60d_once: 29700, // R$ 297,00
  hypertrophy_hormone_annual_once: 89900, // R$ 899,00
};

const PRODUCT_NAME_BY_LOOKUP: Record<string, string> = {
  hypertrophy_monthly: 'EVORIA — Mensal',
  hypertrophy_annual: 'EVORIA — Anual',
  hypertrophy_new_protocol_once: 'EVORIA — Novo Protocolo (60 dias)',
  hypertrophy_exam_analysis_once: 'EVORIA — Análise de Exames',
  hypertrophy_hormone_60d_once: 'EVORIA — Análise + Protocolo Hormonal 60 dias',
  hypertrophy_hormone_annual_once: 'EVORIA — Acompanhamento Hormonal Anual',
};

const RECURRING_INTERVAL_BY_LOOKUP: Record<string, 'month' | 'year' | null> = {
  hypertrophy_monthly: 'month',
  hypertrophy_annual: 'year',
  hypertrophy_new_protocol_once: null,
  hypertrophy_exam_analysis_once: null,
  hypertrophy_hormone_60d_once: null,
  hypertrophy_hormone_annual_once: null,
};

export interface ResolvedPrice {
  id: string;
  mode: 'subscription' | 'payment';
}

/**
 * Resolve a human-readable lookup_key into the Stripe price ID + checkout mode.
 * If the price doesn't exist on Stripe, auto-creates it from the configured table.
 */
const _priceCache = new Map<string, ResolvedPrice>();
export async function resolveStripePrice(lookupKey: string): Promise<ResolvedPrice> {
  if (_priceCache.has(lookupKey)) return _priceCache.get(lookupKey)!;
  const stripe = getStripe();
  const list = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  let price: any = list.data[0];

  // Auto-create if missing and we know the config for this lookup key.
  if (!price && PRICE_AMOUNT_BRL[lookupKey] != null) {
    const productName = PRODUCT_NAME_BY_LOOKUP[lookupKey] || lookupKey;
    const interval = RECURRING_INTERVAL_BY_LOOKUP[lookupKey] ?? null;
    const product = await stripe.products.create({ name: productName });
    price = await stripe.prices.create({
      product: product.id,
      currency: 'brl',
      unit_amount: PRICE_AMOUNT_BRL[lookupKey],
      lookup_key: lookupKey,
      ...(interval ? { recurring: { interval } } : {}),
    });
    console.log(`auto-created Stripe price for ${lookupKey} → ${price.id}`);
  }

  if (!price) throw new Error(`Stripe price not found for lookup_key=${lookupKey}`);
  const resolved: ResolvedPrice = {
    id: price.id,
    mode: price.recurring ? 'subscription' : 'payment',
  };
  _priceCache.set(lookupKey, resolved);
  return resolved;
}

/** Backwards-compat shim. */
export async function resolveStripePriceId(lookupKey: string): Promise<string> {
  const r = await resolveStripePrice(lookupKey);
  return r.id;
}
