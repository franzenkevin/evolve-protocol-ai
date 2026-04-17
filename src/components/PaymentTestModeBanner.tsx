const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("test_")) return null;
  return (
    <div className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2 text-center text-xs text-warning-foreground">
      🧪 Pagamentos em modo teste — use cartão <span className="font-mono font-semibold">4242 4242 4242 4242</span> para simular.
    </div>
  );
}
