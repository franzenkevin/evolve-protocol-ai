import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Loader2, Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 30000;

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription, refetch } = useSubscription();
  const qc = useQueryClient();
  const [waiting, setWaiting] = useState(true);

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || "Atleta").split(" ")[0];

  const isActive =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  // Poll until webhook confirms subscription (max 30s)
  useEffect(() => {
    if (isActive) {
      setWaiting(false);
      return;
    }
    const start = Date.now();
    const id = setInterval(async () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      await refetch();
      if (Date.now() - start > POLL_MAX_MS) {
        clearInterval(id);
        setWaiting(false);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActive, qc, refetch]);

  const next = () => {
    if (profile?.onboarding_complete) navigate("/dashboard", { replace: true });
    else navigate("/welcome", { replace: true });
  };

  const features = [
    { icon: Dumbbell, label: "Treino personalizado pela metodologia" },
    { icon: UtensilsCrossed, label: "Dieta calculada com seus alimentos" },
    { icon: TrendingUp, label: "Revisão automática a cada 60 dias" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col animate-fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Hypertrophy" className="w-14 h-14 mb-4" />
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Pagamento confirmado, <span className="text-gradient">{firstName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Bem-vindo ao Hypertrophy. Seu acesso completo está liberado.
          </p>
        </div>

        <Card className="p-5 mb-4 card-gradient border-border space-y-3">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-sm text-foreground pt-1.5">{label}</p>
            </div>
          ))}
        </Card>

        {waiting && !isActive ? (
          <Card className="p-4 mb-4 border-primary/30 bg-primary/5 flex items-center gap-3">
            <Loader2 size={18} className="text-primary animate-spin shrink-0" />
            <p className="text-xs text-muted-foreground">
              Confirmando sua assinatura no servidor... isso pode levar alguns segundos.
            </p>
          </Card>
        ) : null}

        <Button
          size="lg"
          className="w-full glow gap-2 h-14 text-base"
          onClick={next}
          disabled={waiting && !isActive}
        >
          {profile?.onboarding_complete ? "Ir para o app" : "Iniciar meu primeiro quiz"}
          <ArrowRight size={18} />
        </Button>

        {!waiting && !isActive && (
          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Não recebeu confirmação? Atualize a página em alguns minutos ou contate o suporte.
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
