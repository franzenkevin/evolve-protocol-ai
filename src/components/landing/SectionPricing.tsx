import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

const MONTHLY_BULLETS = [
  "Protocolo completo gerado pelo sistema",
  "Programa de treino semana a semana",
  "Organização de refeições personalizada",
  "Análise por foto IA",
  "Acompanhamento de progresso",
  "Chatbot com a metodologia",
  "7 dias de garantia total",
];

const ANNUAL_BULLETS = [
  ...MONTHLY_BULLETS,
  "Acesso prioritário a novas funcionalidades",
];

export const SectionPricing = () => {
  const { openCheckout, loading } = useStripeCheckout();
  const [activePlan, setActivePlan] = useState<"monthly" | "annual" | null>(null);

  const handleCheckout = async (
    plan: "monthly" | "annual",
    priceId: string,
    couponCode: string,
  ) => {
    setActivePlan(plan);
    try {
      await openCheckout({
        priceId,
        couponCode,
        successUrl: `${window.location.origin}/checkout/success?plan=${plan}`,
      });
    } finally {
      setActivePlan(null);
    }
  };

  const isMonthlyLoading = loading && activePlan === "monthly";
  const isAnnualLoading = loading && activePlan === "annual";

  return (
    <section className="py-20 border-t border-border">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">
            Investimento
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Quanto custa ter um protocolo real?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Menos que uma sessão de personal. Sem agenda, sem deslocamento, disponível 24h.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* MENSAL */}
          <Card className="relative p-6 md:p-8 card-gradient border-border flex flex-col">
            <div className="inline-flex self-start items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-primary mb-4 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5">
              <Sparkles size={10} /> Lançamento
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-3">Mensal</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-base text-muted-foreground line-through">R$97</span>
              <span className="text-4xl font-heading font-bold text-foreground">R$29,90</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              no primeiro mês, depois R$97/mês
            </p>

            <ul className="space-y-2.5 mb-6 flex-1">
              {MONTHLY_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {!user && (
              <Input
                type="email"
                placeholder="seu@email.com"
                value={emailMonthly}
                onChange={(e) => setEmailMonthly(e.target.value)}
                className="mb-3 h-12"
                disabled={isMonthlyLoading}
              />
            )}
            <Button
              size="lg"
              className="w-full gap-2 h-12 text-base"
              disabled={isMonthlyLoading || loading}
              onClick={() =>
                handleCheckout("monthly", "hypertrophy_monthly", "LANCAMENTO", emailMonthly)
              }
            >
              {isMonthlyLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Começar por R$29,90 <ArrowRight size={18} />
                </>
              )}
            </Button>
          </Card>

          {/* ANUAL — destaque */}
          <Card className="relative p-6 md:p-8 card-gradient border-2 border-primary flex flex-col glow">
            <div className="inline-flex self-start items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-primary-foreground mb-4 px-2.5 py-1 rounded-full bg-primary">
              <Sparkles size={10} /> Melhor valor
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-3">Anual</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-base text-muted-foreground line-through">R$897</span>
              <span className="text-4xl font-heading font-bold text-foreground">R$599</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              pagamento único — economia de R$298
            </p>

            <ul className="space-y-2.5 mb-6 flex-1">
              {ANNUAL_BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {!user && (
              <Input
                type="email"
                placeholder="seu@email.com"
                value={emailAnnual}
                onChange={(e) => setEmailAnnual(e.target.value)}
                className="mb-3 h-12"
                disabled={isAnnualLoading}
              />
            )}
            <Button
              size="lg"
              className="w-full gap-2 h-12 text-base glow"
              disabled={isAnnualLoading || loading}
              onClick={() =>
                handleCheckout("annual", "hypertrophy_annual", "LANCAMENTOANUAL", emailAnnual)
              }
            >
              {isAnnualLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Começar por R$599 <ArrowRight size={18} />
                </>
              )}
            </Button>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Por dia: <strong className="text-foreground">menos de R$1</strong>. Por mês:{" "}
          <strong className="text-foreground">menos que uma pizza</strong>. Por resultado:{" "}
          <strong className="text-foreground">você decide.</strong>
        </p>
      </div>
    </section>
  );
};
