import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  AlertCircle,
  RotateCw,
  Clock,
} from "lucide-react";
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
const TARGET_SECONDS = 180;

/**
 * Estados explícitos da geração do protocolo:
 * - waiting_payment : Polling do webhook de pagamento
 * - pending         : Pagamento OK, prestes a iniciar geração
 * - processing      : Edge function rodando + criação do protocolo
 * - done            : Protocolo salvo, CTA liberado
 * - error           : Falha na geração — permite retry
 */
type GenStatus = "waiting_payment" | "pending" | "processing" | "done" | "error";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription, refetch } = useSubscription();
  const { data: protocol, refetch: refetchProtocol } = useActiveProtocol();
  const createProtocol = useCreateProtocol();
  const qc = useQueryClient();

  const [status, setStatus] = useState<GenStatus>("waiting_payment");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [genElapsed, setGenElapsed] = useState(0);
  const [genStage, setGenStage] = useState("");
  const generationStarted = useRef(false);

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || "Atleta").split(" ")[0];

  const isActive =
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  // Quando o protocolo aparecer (já existia ou acabou de ser criado), marcamos como done
  useEffect(() => {
    if (protocol && status !== "done") {
      setStatus("done");
    }
  }, [protocol, status]);

  // Poll do webhook de pagamento → só importa enquanto status = waiting_payment
  useEffect(() => {
    if (status !== "waiting_payment") return;
    if (isActive) {
      // Pagamento confirmado, aguardando início da geração
      setStatus("pending");
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
        // Mantém waiting_payment + permite retry manual via mensagem inferior
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, isActive, qc, refetch]);

  // Timer + stages visuais durante processing
  useEffect(() => {
    if (status !== "processing") return;
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
  }, [status]);

  // Ação principal: gerar o protocolo
  const runGeneration = useCallback(async () => {
    if (!user || !profile?.onboarding_complete) return;
    setErrorMessage(null);
    setStatus("processing");

    try {
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

      try {
        await supabase.from("onboarding_drafts").delete().eq("user_id", user.id);
      } catch {}

      setStatus("done");
      toast.success("Protocolo gerado! Bem-vindo ao EVORIA.");
    } catch (err: any) {
      console.error("Protocol generation failed:", err);
      setErrorMessage(err?.message || "Falha ao gerar o protocolo.");
      setStatus("error");
      generationStarted.current = false;
    }
  }, [user, profile, createProtocol, refetchProtocol]);

  // Dispara geração automática quando status vira pending
  useEffect(() => {
    if (status !== "pending") return;
    if (protocol) {
      setStatus("done");
      return;
    }
    if (generationStarted.current) return;
    generationStarted.current = true;
    runGeneration();
  }, [status, protocol, runGeneration]);

  const next = () => {
    if (!profile?.onboarding_complete) {
      navigate("/welcome", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleRetry = () => {
    generationStarted.current = false;
    setStatus("pending");
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
          <img src={logo} alt="EVORIA" className="w-14 h-14 mb-4" />
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <CheckCircle2 size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Pagamento confirmado, <span className="text-gradient">{firstName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Bem-vindo ao EVORIA. Seu acesso completo está liberado.
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

        {/* STATUS: aguardando webhook de pagamento */}
        {status === "waiting_payment" && (
          <Card className="p-4 mb-4 border-primary/30 bg-primary/5 flex items-center gap-3">
            <Loader2 size={18} className="text-primary animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Pendente
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Confirmando sua assinatura no servidor...
              </p>
            </div>
          </Card>
        )}

        {/* STATUS: pendente (pagamento OK, prestes a iniciar) */}
        {status === "pending" && (
          <Card className="p-4 mb-4 border-primary/30 bg-primary/5 flex items-center gap-3">
            <Clock size={18} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Iniciando geração
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Preparando os dados do seu protocolo...
              </p>
            </div>
          </Card>
        )}

        {/* STATUS: processando — loader cheio com stages */}
        {status === "processing" && (
          <Card className="p-5 mb-4 border-primary/30 bg-primary/5 space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-1 animate-pulse">🤖</div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                Processando
              </p>
              <h3 className="text-base font-heading font-bold text-foreground">
                Gerando seu protocolo
              </h3>
              <p className="text-xs text-muted-foreground min-h-[2rem] mt-1">{genStage}</p>
            </div>
            <Progress value={Math.min(100, (genElapsed / TARGET_SECONDS) * 100)} className="h-2" />
            <p className="text-2xl font-bold text-primary font-heading text-center tabular-nums">
              {String(Math.floor(genElapsed / 60)).padStart(2, "0")}:
              {String(genElapsed % 60).padStart(2, "0")}
            </p>
            <p className="text-[11px] text-muted-foreground text-center">
              Tempo médio: 1–3 minutos. Mantenha esta tela aberta.
            </p>
          </Card>
        )}

        {/* STATUS: concluído */}
        {status === "done" && (
          <Card className="p-4 mb-4 border-primary/40 bg-primary/10 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                Concluído
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seu protocolo está pronto. Bora começar.
              </p>
            </div>
          </Card>
        )}

        {/* STATUS: erro */}
        {status === "error" && (
          <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider">
                  Erro
                </p>
                <p className="text-xs text-foreground mt-0.5">
                  Não conseguimos gerar seu protocolo agora.
                </p>
                {errorMessage && (
                  <p className="text-[11px] text-muted-foreground mt-1 break-words">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={handleRetry}
            >
              <RotateCw size={14} /> Tentar novamente
            </Button>
          </Card>
        )}

        {/* CTA principal */}
        <Button
          size="lg"
          className="w-full glow gap-2 h-14 text-base"
          onClick={next}
          disabled={status !== "done"}
        >
          {status === "done" && (
            <>
              Ir para o app <ArrowRight size={18} />
            </>
          )}
          {status === "processing" && (
            <>
              <Loader2 size={18} className="animate-spin" /> Gerando seu protocolo...
            </>
          )}
          {status === "pending" && (
            <>
              <Loader2 size={18} className="animate-spin" /> Iniciando...
            </>
          )}
          {status === "waiting_payment" && (
            <>
              <Loader2 size={18} className="animate-spin" /> Aguardando confirmação...
            </>
          )}
          {status === "error" && "Geração falhou — tente novamente acima"}
        </Button>

        {status === "waiting_payment" && !isActive && (
          <p className="text-[11px] text-muted-foreground text-center mt-4">
            Não recebeu confirmação? Atualize a página em alguns minutos ou contate o suporte.
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
