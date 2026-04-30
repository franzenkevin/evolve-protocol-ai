import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Trophy, Flame, ArrowRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const MilestoneCheckin = () => {
  const { milestone: milestoneParam } = useParams<{ milestone: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: protocol } = useActiveProtocol();
  const { data: profile } = useProfile();

  const milestone = Number(milestoneParam);
  const isFinal = milestone === 60;

  const [dietNotes, setDietNotes] = useState("");
  const [trainingNotes, setTrainingNotes] = useState("");
  const [requestsNotes, setRequestsNotes] = useState("");
  const [routineChanges, setRoutineChanges] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"form" | "analysis">("form");

  useEffect(() => {
    if (![30, 60].includes(milestone)) {
      navigate("/dashboard", { replace: true });
    }
  }, [milestone, navigate]);

  const submit = async () => {
    if (isFinal) {
      if (dietNotes.trim().length < 10 || trainingNotes.trim().length < 10) {
        toast.error("Descreva com mais detalhes a dieta e o treino (pelo menos 10 caracteres cada).");
        return;
      }
    } else {
      if (trainingNotes.trim().length < 5) {
        toast.error("Conta um pouco como foi a primeira metade do plano.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("protocol-milestone-analysis", {
        body: {
          milestone_day: milestone,
          responses: {
            diet_notes: dietNotes.trim() || null,
            training_notes: trainingNotes.trim() || null,
            requests_notes: requestsNotes.trim() || null,
            routine_changes_notes: routineChanges.trim() || null,
          },
        },
      });
      if (error) throw error;
      setAnalysis(data.analysis);
      setStep("analysis");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const goGenerateNewProtocol = async () => {
    // Vai pro fluxo de confirmação (igual onboarding) — usa a tela existente de novo protocolo
    setGenerating(true);
    try {
      navigate("/new-protocol?from=milestone-60");
    } finally {
      setGenerating(false);
    }
  };

  const Icon = isFinal ? Trophy : Flame;

  return (
    <AppLayout>
      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24 animate-fade-in">
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">
              {isFinal ? "Atualização do protocolo · 60 dias" : "Check-in dos 30 dias"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} — vamos avaliar seu progresso.
            </p>
          </div>
        </div>

        {step === "form" && (
          <>
            <Card className="p-4 card-gradient border-primary/30 space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                {isFinal ? (
                  <>
                    Você fechou <strong>60 dias</strong> de protocolo. Responda com sinceridade — quanto mais
                    detalhes, melhor a IA vai elaborar seu próximo ciclo.
                  </>
                ) : (
                  <>
                    Você está na <strong>metade do caminho</strong>. O protocolo é de 60 dias — esse check-in serve
                    pra IA te mostrar o que já melhorou e ajustar o foco até o final.
                  </>
                )}
              </p>
            </Card>

            {isFinal ? (
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diet">Como foi seguir essa dieta? Descreva em detalhes.</Label>
                  <Textarea
                    id="diet"
                    value={dietNotes}
                    onChange={(e) => setDietNotes(e.target.value)}
                    placeholder="Aderência, dificuldades, fome, energia, alimentos que não funcionaram..."
                    className="min-h-[100px] text-sm"
                    maxLength={2000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training">Como foi o treino? Descreva em detalhes.</Label>
                  <Textarea
                    id="training"
                    value={trainingNotes}
                    onChange={(e) => setTrainingNotes(e.target.value)}
                    placeholder="Cargas, evolução, exercícios que travaram, sensação muscular, recuperação..."
                    className="min-h-[100px] text-sm"
                    maxLength={2000}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requests">Tem alguma solicitação no geral do plano?</Label>
                  <Textarea
                    id="requests"
                    value={requestsNotes}
                    onChange={(e) => setRequestsNotes(e.target.value)}
                    placeholder="Trocar exercícios, mudar divisão, mais cardio, menos volume..."
                    className="min-h-[80px] text-sm"
                    maxLength={1500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routine">Algo na sua rotina vai mudar e precisamos saber?</Label>
                  <Textarea
                    id="routine"
                    value={routineChanges}
                    onChange={(e) => setRoutineChanges(e.target.value)}
                    placeholder="Novo horário, viagem, mudança de academia, lesão, sono..."
                    className="min-h-[80px] text-sm"
                    maxLength={1500}
                  />
                </div>
              </Card>
            ) : (
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="training">Como tá sendo o treino? (cargas, sensações, dificuldades)</Label>
                  <Textarea
                    id="training"
                    value={trainingNotes}
                    onChange={(e) => setTrainingNotes(e.target.value)}
                    placeholder="O que evoluiu, o que travou, como anda a energia..."
                    className="min-h-[100px] text-sm"
                    maxLength={1500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diet">E a dieta? Tá conseguindo seguir?</Label>
                  <Textarea
                    id="diet"
                    value={dietNotes}
                    onChange={(e) => setDietNotes(e.target.value)}
                    placeholder="Aderência, fome, dificuldades..."
                    className="min-h-[80px] text-sm"
                    maxLength={1500}
                  />
                </div>
              </Card>
            )}

            <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Gerando análise da IA...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" /> Ver minha análise
                </>
              )}
            </Button>
          </>
        )}

        {step === "analysis" && analysis && (
          <>
            <Card className="p-5 card-gradient border-primary/40 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-heading font-semibold text-foreground text-sm">
                  Análise da IA — {milestone} dias
                </h3>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground leading-relaxed">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </Card>

            {isFinal ? (
              <Card className="p-4 space-y-3">
                <p className="text-sm text-foreground">
                  Vamos para a <strong>elaboração do seu próximo protocolo</strong>. Você poderá revisar a proposta
                  da IA antes de confirmar (igual no onboarding).
                </p>
                <Button onClick={goGenerateNewProtocol} disabled={generating} className="w-full" size="lg">
                  {generating ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw size={16} className="mr-2" />
                  )}
                  Elaborar novo protocolo
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Card>
            ) : (
              <Card className="p-4 space-y-3">
                <p className="text-sm text-foreground">
                  <strong>Continue firme</strong> no seu protocolo atual até completar 60 dias. Quando chegar lá,
                  vamos avaliar a evolução completa e atualizar tudo.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Voltar pro treino
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MilestoneCheckin;
