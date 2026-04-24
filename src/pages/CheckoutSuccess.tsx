import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, Loader2, Dumbbell, UtensilsCrossed, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useActiveProtocol, useCreateProtocol } from "@/hooks/useProtocol";
import { generateProtocol } from "@/lib/generateProtocol";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 45000;
const RECONCILE_AFTER_MS = 8000;

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription, refetch } = useSubscription();
  const { data: protocol, refetch: refetchProtocol } = useActiveProtocol();
  const createProtocol = useCreateProtocol();
  const qc = useQueryClient();
  const [waitingPayment, setWaitingPayment] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const [genStage, setGenStage] = useState("");
  const generationStarted = useRef(false);

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || "Atleta").split(" ")[0];

  const isActive =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  // Poll para webhook de pagamento
  useEffect(() => {
    if (isActive) {
      setWaitingPayment(false);
      return;
    }
    const start = Date.now();
    let reconcileFired = false;

    const tick = async () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      await refetch();

      if (!reconcileFired && Date.now() - start > RECONCILE_AFTER_MS) {
        reconcileFired = true;
        const env =
          (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith("test_")
            ? "sandbox"
            : "live";
        supabase.functions
          .invoke("reconcile-subscription", { body: { environment: env } })
          .then(() => {
            qc.invalidateQueries({ queryKey: ["subscription"] });
            refetch();
          })
          .catch((e) => console.warn("reconcile invoke error:", e));
      }

      if (Date.now() - start > POLL_MAX_MS) {
        clearInterval(id);
        setWaitingPayment(false);
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActive, qc, refetch]);

  // Timer visual durante geração
  useEffect(() => {
    if (!generating) return;
    setGenElapsed(0);
    setGenStage("👨‍⚕️ Médico nutrólogo lendo seu perfil e avaliação corporal...");
    const stages: { at: number; label: string }[] = [
      { at: 12, label: "👨‍⚕️ Verificando lesões, intolerâncias e contraindicações..." },
      { at: 28, label: "🏋️ Treinador escolhendo a divisão e os exercícios..." },
      { at: 50, label: "🏋️ Priorizando seus pontos fracos no volume de treino..." },
      { at: 75, label: "🥗 Nutricionista calculando macros e montando refeições..." },
      { at: 105, label: "🥗 Calibrando refeições livres ao seu objetivo..." },
      { at: 135, label: "🤝 Comitê validando treino + dieta juntos..." },
      { at: 165, label: "✨ Finalizando seu protocolo personalizado..." },
    ];
    const t0 = Date.now();
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      setGenElapsed(sec);
      const cur = [...stages].reverse().find((s) => sec >= s.at);
      if (cur) setGenStage(cur.label);
    }, 1000);
    return () => clearInterval(id);
  }, [generating]);

  // Dispara geração após pagamento confirmado, se ainda não tem protocolo
  useEffect(() => {
    if (!isActive || !user || !profile?.onboarding_complete) return;
    if (protocol) return;
    if (generationStarted.current) return;
    generationStarted.current = true;

    (async () => {
      setGenerating(true);
      try {
        // Buscar avaliação corporal mais recente + confirmações no draft
        const [{ data: bodyAssessment }, { data: draft }] = await Promise.all([
          supabase
            .from("body_assessments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("onboarding_drafts")
            .select("data")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        const confirmations = (draft?.data as any)?.confirmations ?? null;

        let result: { training: any; diet: any };
        try {
          const { data: aiResult, error: aiError } = await supabase.functions.invoke(
            "generate-protocol",
            {
              body: {
                profile,
                bodyAssessment,
                bodyEmphasis: profile?.body_emphasis,
                confirmations,
              },
            },
          );
          if (aiError) throw aiError;
          if (aiResult?.fallback) throw new Error("Fallback requested");
          if (!aiResult?.training || !aiResult?.diet) throw new Error("Invalid AI response");
          result = { training: aiResult.training, diet: aiResult.diet };
        } catch (aiErr) {
          console.warn("AI protocol generation failed, using rule-based fallback:", aiErr);
          result = generateProtocol(profile as any);
        }

        await createProtocol.mutateAsync(result);
        await refetchProtocol();

        // Limpa o draft
        try {
          await supabase.from("onboarding_drafts").delete().eq("user_id", user.id);
        } catch {}

        toast.success("Protocolo gerado! Bem-vindo ao Hypertrophy.");
      } catch (err: any) {
        console.error(err);
        toast.error("Não conseguimos gerar agora. Tente novamente em alguns segundos.");
        generationStarted.current = false;
      } finally {
        setGenerating(false);
      }
    })();
  }, [isActive, user, profile, protocol, createProtocol, refetchProtocol]);

  const next = () => {
    if (!profile?.onboarding_complete) {
      navigate("/welcome", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const features = [
    { icon: Dumbbell, label: "Treino personalizado pela metodologia" },
    { icon: UtensilsCrossed, label: "Dieta calculada com seus alimentos" },
    { icon: TrendingUp, label: "Revisão automática a cada 60 dias" },
  ];

  const ready = isActive && !!protocol && !generating;
  const TARGET_SECONDS = 180;

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

        {waitingPayment && !isActive && (
          <Card className="p-4 mb-4 border-primary/30 bg-primary/5 flex items-center gap-3">
            <Loader2 size={18} className="text-primary animate-spin shrink-0" />
            <p className="text-xs text-muted-foreground">
              Confirmando sua assinatura no servidor... isso pode levar alguns segundos.
            </p>
          </Card>
        )}

        {generating && (
          <Card className="p-5 mb-4 border-primary/30 bg-primary/5 space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-1 animate-pulse">🤖</div>
              <h3 className="text-base font-heading font-bold text-foreground">Gerando seu protocolo</h3>
              <p className="text-xs text-muted-foreground min-h-[2rem] mt-1">{genStage}</p>
            </div>
            <Progress value={Math.min(100, (genElapsed / TARGET_SECONDS) * 100)} className="h-2" />
            <p className="text-2xl font-bold text-primary font-heading text-center tabular-nums">
              {String(Math.floor(genElapsed / 60)).padStart(2, "0")}:{String(genElapsed % 60).padStart(2, "0")}
            </p>
            <p className="text-[11px] text-muted-foreground text-center">
              Tempo médio: 1–3 minutos. Mantenha esta tela aberta.
            </p>
          </Card>
        )}

        <Button
          size="lg"
          className="w-full glow gap-2 h-14 text-base"
          onClick={next}
          disabled={!ready}
        >
          {ready ? (
            <>
              Ir para o app <ArrowRight size={18} />
            </>
          ) : generating ? (
            "Gerando seu protocolo..."
          ) : (
            "Aguardando confirmação..."
          )}
        </Button>

        {!waitingPayment && !isActive && (
          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Não recebeu confirmação? Atualize a página em alguns minutos ou contate o suporte.
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
