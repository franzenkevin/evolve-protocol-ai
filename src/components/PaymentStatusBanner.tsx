import { AlertTriangle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const PaymentStatusBanner = () => {
  const { data: sub } = useSubscription();
  if (!sub) return null;

  const status = sub.status;
  if (status !== "past_due" && status !== "disputed" && status !== "refunded") {
    return null;
  }

  const config = {
    past_due: {
      icon: CreditCard,
      title: "Pagamento pendente",
      message:
        "Não conseguimos processar sua última cobrança. Atualize seu método de pagamento para manter o acesso.",
      cta: "Atualizar pagamento",
      href: "/plans",
      tone: "bg-amber-500/15 border-amber-500/40 text-amber-200",
    },
    disputed: {
      icon: AlertTriangle,
      title: "Cobrança em disputa",
      message:
        "Identificamos um chargeback aberto na sua conta. Entre em contato com o suporte para regularizar.",
      cta: "Falar com suporte",
      href: "/support",
      tone: "bg-red-500/15 border-red-500/40 text-red-200",
    },
    refunded: {
      icon: AlertTriangle,
      title: "Assinatura reembolsada",
      message:
        "Sua assinatura foi reembolsada. Para voltar a usar a Evoria, escolha um plano novamente.",
      cta: "Ver planos",
      href: "/plans",
      tone: "bg-muted border-border text-muted-foreground",
    },
  }[status as "past_due" | "disputed" | "refunded"];

  const Icon = config.icon;

  return (
    <div className={`mx-4 mt-3 rounded-xl border p-3 flex gap-3 items-start ${config.tone}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 text-xs">
        <p className="font-semibold mb-0.5">{config.title}</p>
        <p className="opacity-90 leading-relaxed">{config.message}</p>
        <Link
          to={config.href}
          className="inline-block mt-2 font-semibold underline underline-offset-2"
        >
          {config.cta} →
        </Link>
      </div>
    </div>
  );
};

export default PaymentStatusBanner;
