import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Tag } from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    code: "monthly" as const,
    priceId: "hypertrophy_monthly" as const,
    name: "Mensal",
    price: "R$ 97",
    period: "/mês",
    badge: null,
    desc: "Cancele a qualquer momento",
  },
  {
    code: "annual" as const,
    priceId: "hypertrophy_annual" as const,
    name: "Anual",
    price: "R$ 997",
    period: "/ano",
    badge: "ECONOMIZE 14%",
    desc: "Equivale a R$ 83/mês",
  },
];

const FEATURES = [
  "Protocolo personalizado de treino e dieta",
  "Recálculo a cada 60 dias com base no seu progresso",
  "Coach IA 24/7 (Hypertrophy AI)",
  "Journal científico semanal",
  "Ranking, ligas e comunidade",
  "Suporte prioritário",
];

export default function Plans() {
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { data: subscription, refetch: refetchSub } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);

  const isActive =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date());

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error || !data?.url) throw error || new Error("URL não retornada");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setPortalLoading(false);
    }
  };

  const reconcile = async () => {
    setReconcileLoading(true);
    try {
      const env =
        (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith(
          "test_"
        )
          ? "sandbox"
          : "live";
      const { data, error } = await supabase.functions.invoke(
        "reconcile-subscription",
        { body: { environment: env } }
      );
      if (error) throw error;
      if (data?.synced) {
        toast.success("Assinatura sincronizada! Acesso liberado.");
        await refetchSub();
      } else {
        toast.info(
          data?.message || "Nenhuma assinatura ativa encontrada no provedor."
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível sincronizar agora. Tente novamente.");
    } finally {
      setReconcileLoading(false);
    }
  };

  return (
    <AppLayout>
      <PaymentTestModeBanner />
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24 animate-fade-in">
        <div className="pt-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Planos</h1>
          <p className="text-sm text-muted-foreground">
            Acesso completo ao Hypertrophy. Escolha o ciclo que faz sentido pra você.
          </p>
        </div>

        {isActive && (
          <Card className="p-4 card-gradient border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">Plano atual</p>
                <p className="text-base font-semibold text-foreground capitalize">
                  {subscription.plan_type === "annual" ? "Anual" : "Mensal"}
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Ativo</Badge>
            </div>
            {subscription.current_period_end && (
              <p className="text-xs text-muted-foreground mb-3">
                {subscription.cancel_at_period_end ? "Acesso até " : "Próxima cobrança: "}
                {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={openPortal}
              disabled={portalLoading}
            >
              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerenciar assinatura"}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Mudanças de plano se aplicam na próxima renovação.
            </p>
          </Card>
        )}

        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-2">O que está incluso</h3>
          <ul className="space-y-1.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check size={14} className="text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          {PLANS.map((p) => {
            const isCurrent = isActive && subscription?.plan_type === p.code;
            return (
              <Card
                key={p.code}
                className={`p-4 card-gradient ${
                  p.code === "annual" ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  {p.badge && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                      {p.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-3">
                  {p.price}
                  <span className="text-sm font-normal text-muted-foreground">{p.period}</span>
                </p>
                <Button
                  className="w-full glow"
                  disabled={checkoutLoading || isCurrent}
                  onClick={() => openCheckout({ priceId: p.priceId })}
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Plano atual"
                  ) : isActive ? (
                    "Trocar na próxima renovação"
                  ) : (
                    `Assinar ${p.name}`
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {!isActive && (
          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Já pagou e o acesso não liberou?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={reconcile}
              disabled={reconcileLoading}
              className="text-xs"
            >
              {reconcileLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Sincronizar minha assinatura"
              )}
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Pagamento processado com segurança. Aceita cartão de crédito e PIX (quando disponível na sua região).
        </p>
      </div>
    </AppLayout>
  );
}
