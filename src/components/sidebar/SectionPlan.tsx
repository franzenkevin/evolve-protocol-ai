import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { CreditCard, Calendar, Crown, Loader2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SectionPlan = () => {
  const { data: sub } = useSubscription();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const openPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("URL não retornada");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível abrir o portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  const planLabel = sub?.plan_type === "annual" ? "Anual" : "Mensal";
  const statusLabel = sub?.status === "active" ? "Ativo" : sub?.status || "Sem plano";

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Plano</h3>
      <Card className="p-3 card-gradient border-border space-y-3">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-primary" />
          <span className="text-sm text-foreground font-medium">{sub ? `Plano ${planLabel}` : "Sem plano ativo"}</span>
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${sub?.status === "active" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
            {statusLabel}
          </span>
        </div>

        {sub && (
          <>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={12} />
                <span>Início: {new Date(sub.start_date).toLocaleDateString("pt-BR")}</span>
              </div>
              {sub.next_billing_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={12} />
                  <span>Próxima cobrança: {new Date(sub.next_billing_date).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
            </div>

            {sub.payment_brand && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-2">
                <CreditCard size={12} />
                <span>{sub.payment_brand} •••• {sub.payment_last4}</span>
              </div>
            )}
          </>
        )}
      </Card>

      {sub && ["active", "trialing", "past_due"].includes(sub.status || "") && (
        <button
          type="button"
          onClick={openPortal}
          disabled={loadingPortal}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors px-1 py-1 disabled:opacity-50"
        >
          {loadingPortal ? <Loader2 size={11} className="animate-spin" /> : <Settings size={11} />}
          <span>Gerenciar assinatura</span>
        </button>
      )}
    </div>
  );
};

export default SectionPlan;
