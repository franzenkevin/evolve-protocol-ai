// Production mode: payments are LIVE via Stripe (BRL).
// Banner is hidden by default. Set VITE_STRIPE_TEST=true to show it during dev.
export function PaymentTestModeBanner() {
  const showTest = import.meta.env.VITE_STRIPE_TEST === "true";
  if (!showTest) return null;
  return (
    <div className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2 text-center text-xs text-warning-foreground">
      🧪 Pagamentos em modo teste — use cartão{" "}
      <span className="font-mono font-semibold">4242 4242 4242 4242</span> (qualquer data futura, qualquer CVC).
    </div>
  );
}
