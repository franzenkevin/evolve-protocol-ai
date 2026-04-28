// Detects test mode from Stripe publishable key prefix.
// Note: we currently use the secret key on backend only; this banner shows in preview always.
// Replace logic when a publishable key is available client-side.
export function PaymentTestModeBanner() {
  // In Lovable preview, payments are test by default. The badge stays visible
  // until live keys are configured (set VITE_STRIPE_LIVE=true to hide).
  const hideInLive = import.meta.env.VITE_STRIPE_LIVE === "true";
  if (hideInLive) return null;
  return (
    <div className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2 text-center text-xs text-warning-foreground">
      🧪 Pagamentos em modo teste — use cartão{" "}
      <span className="font-mono font-semibold">4242 4242 4242 4242</span> (qualquer data futura, qualquer CVC).
    </div>
  );
}
