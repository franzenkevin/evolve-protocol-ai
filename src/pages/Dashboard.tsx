import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useCheckins } from "@/hooks/useCheckins";
import { useBodyAssessments } from "@/hooks/useBodyAssessments";
import { useDailyRatings, useTodayRating, useSaveDailyRating } from "@/hooks/useDailyRatings";
import { useWorkoutLogs, useAllWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useJournalArticles } from "@/hooks/useJournal";
import AppLayout from "@/components/AppLayout";
import ProtocolProgressWidget from "@/components/ProtocolProgressWidget";
import AppTour, { useAppTour } from "@/components/AppTour";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dumbbell, Bell, Star, Send, Eye, CheckCircle, BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const today = new Date().toISOString().split("T")[0];
const WEEKDAY_MAP: Record<number, string> = {
  0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta",
  4: "Quinta", 5: "Sexta", 6: "Sábado",
};
const todayWeekday = WEEKDAY_MAP[new Date().getDay()];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: protocol, isLoading: loadingProtocol } = useActiveProtocol();
  const { data: checkins = [] } = useCheckins();
  const { data: assessments = [] } = useBodyAssessments();
  const { data: ratings = [] } = useDailyRatings(14);
  const { data: todayRating } = useTodayRating();
  const { data: allLogs = [] } = useAllWorkoutLogs();
  const { data: articles = [] } = useJournalArticles();
  const saveRating = useSaveDailyRating();

  const [starRating, setStarRating] = useState(0);
  const [ratingNotes, setRatingNotes] = useState("");
  const [showAssessment, setShowAssessment] = useState(false);

  // Sync today's rating when loaded
  useEffect(() => {
    if (todayRating) {
      setStarRating(todayRating.rating);
      setRatingNotes(todayRating.notes || "");
    }
  }, [todayRating]);

  const name = profile?.full_name || user?.user_metadata?.full_name || "Atleta";
  const daysLeft = protocol
    ? Math.max(0, Math.ceil((new Date(protocol.end_date).getTime() - Date.now()) / 86400000))
    : 0;
  const trainingDays = profile?.training_days || 0;
  const diet = protocol?.diet as any;
  const training = protocol?.training as any;
  const todayTrainingIndex = training?.findIndex((d: any) => d.weekday === todayWeekday) ?? -1;
  const todayTraining = todayTrainingIndex >= 0 ? training[todayTrainingIndex] : null;
  const isRestDay = training?.length > 0 && todayTrainingIndex < 0;
  const latestAssessment = assessments[0];
  const weightHistory = checkins.filter((c) => c.weight).slice(0, 10).reverse();

  // Tonnage + completed workouts (for 60-day widget)
  const { totalTonnage, totalWorkouts, avgAdherenceProtocol } = useMemo(() => {
    const protoLogs = protocol ? allLogs.filter((l) => l.protocol_id === protocol.id) : allLogs;
    let tonnage = 0;
    const sessionKeys = new Set<string>();
    protoLogs.forEach((log) => {
      sessionKeys.add(`${log.session_date}-${log.day_index}`);
      const sets = (log.sets as any[]) || [];
      sets.forEach((s: any) => {
        if (s.completed && s.type === "valid") tonnage += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      });
    });
    const adherenceList = checkins.filter((c) => c.adherence);
    const adh = adherenceList.length
      ? Math.round(adherenceList.reduce((a, c) => a + (c.adherence || 0), 0) / adherenceList.length)
      : 0;
    return { totalTonnage: tonnage, totalWorkouts: sessionKeys.size, avgAdherenceProtocol: adh };
  }, [allLogs, protocol, checkins]);

  // Check if today's workout is completed via logs
  const { data: todayLogs } = useWorkoutLogs(todayTrainingIndex >= 0 ? todayTrainingIndex : 0, today);
  const isTodayWorkoutDone = todayTraining?.exercises?.length > 0 && todayLogs && todayLogs.length > 0 &&
    todayTraining.exercises.every((ex: any) => {
      const log = todayLogs.find((l: any) => l.exercise_id === ex.id);
      if (!log) return false;
      const sets = (log.sets as any[]) || [];
      return sets.filter((s: any) => s.type === "valid").every((s: any) => s.completed);
    });

  const handleSaveRating = async () => {
    try {
      await saveRating.mutateAsync({ rating: starRating, notes: ratingNotes || undefined });
      toast.success("Avaliação do dia salva!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
            <h1 className="text-2xl font-heading font-bold text-foreground">{name}</h1>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          </Button>
        </div>

        {/* Protocol summary with days left */}
        {loadingProtocol ? (
          <Skeleton className="h-28 w-full" />
        ) : protocol ? (
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-semibold text-foreground text-sm">Protocolo Atual</h3>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Ativo</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold text-foreground">{trainingDays}x</p><p className="text-[10px] text-muted-foreground">Dias/semana</p></div>
              <div><p className="text-lg font-bold text-primary">{daysLeft}</p><p className="text-[10px] text-muted-foreground">Dias p/ troca</p></div>
              <div><p className="text-lg font-bold text-foreground">v{protocol.version}</p><p className="text-[10px] text-muted-foreground">Versão</p></div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 card-gradient border-border text-center">
            <p className="text-muted-foreground mb-3 text-sm">Nenhum protocolo ativo</p>
            <Link to="/onboarding"><Button className="glow">Criar protocolo</Button></Link>
          </Card>
        )}

        {/* Legacy protocol upgrade notice */}
        {protocol && (training as any)?.needs_upgrade && (
          <Card className="p-4 border-primary/40 bg-primary/5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">
                  ✨ Novidades disponíveis no seu protocolo
                </h3>
                <p className="text-xs text-muted-foreground">
                  {(training as any)?.upgrade_reason || "Atualizamos a metodologia: substituições isocalóricas e faixas de repetições variáveis."}
                  Regere o protocolo para aplicar.
                </p>
              </div>
              <Link to="/new-protocol">
                <Button size="sm" className="glow whitespace-nowrap">Regerar protocolo</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* 60-day journey widget */}
        {protocol && (
          <ProtocolProgressWidget
            startDate={protocol.start_date}
            endDate={protocol.end_date}
            totalWorkouts={totalWorkouts}
            totalTonnage={totalTonnage}
            avgAdherence={avgAdherenceProtocol}
          />
        )}

        {/* Today's training or rest day */}
        {isRestDay ? (
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
                <span className="text-lg">😴</span>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground text-sm">Dia de Descanso</h3>
                <p className="text-xs text-muted-foreground">
                  {todayWeekday} — Recupere-se para o próximo treino!
                </p>
              </div>
            </div>
            {training?.length > 0 && (() => {
              const nextDays = training.map((d: any) => {
                const idx = Object.entries(WEEKDAY_MAP).find(([, v]) => v === d.weekday)?.[0];
                return { ...d, dayIdx: idx ? parseInt(idx) : 99 };
              });
              const todayIdx = new Date().getDay();
              const upcoming = nextDays
                .filter((d: any) => d.dayIdx > todayIdx)
                .sort((a: any, b: any) => a.dayIdx - b.dayIdx);
              const next = upcoming[0] || nextDays.sort((a: any, b: any) => a.dayIdx - b.dayIdx)[0];
              return next ? (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Próximo treino: <span className="text-primary font-medium">{next.weekday} — {next.muscleGroup}</span>
                </p>
              ) : null;
            })()}
          </Card>
        ) : todayTraining ? (
          <Card className="p-4 card-gradient border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Dumbbell size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">Treino de Hoje</h3>
                  <p className="text-[10px] text-muted-foreground">{todayWeekday}</p>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                📍 Hoje
              </Badge>
            </div>
            <p className="text-xs text-secondary-foreground mb-3">
              <span className="font-medium text-foreground">{todayTraining.muscleGroup}</span> — {todayTraining.exercises?.length || 0} exercícios
            </p>
            {isTodayWorkoutDone ? (
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded-md border border-success/20">
                <CheckCircle size={16} className="text-success" />
                <span className="text-sm font-medium text-success">Treino concluído! 💪</span>
              </div>
            ) : (
              <Link to="/training"><Button className="w-full glow" size="sm">🏋️ Iniciar Treino</Button></Link>
            )}
          </Card>
        ) : null}

        {/* Daily Rating */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground mb-2 text-sm">Como foi seu dia?</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setStarRating(s)} className="p-0.5">
                <Star
                  size={24}
                  className={s <= starRating ? "fill-primary text-primary" : "text-muted-foreground"}
                />
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">{starRating}/5</span>
          </div>
          <Textarea
            placeholder="Breve detalhe do dia (opcional)..."
            value={ratingNotes}
            onChange={(e) => setRatingNotes(e.target.value)}
            className="h-16 text-xs resize-none mb-2"
          />
          <Button size="sm" className="w-full gap-1" onClick={handleSaveRating} disabled={saveRating.isPending || starRating === 0}>
            <Send size={12} />Salvar avaliação
          </Button>
        </Card>

        {/* Body Assessment */}
        {latestAssessment && (
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-semibold text-foreground text-sm">Última Avaliação Corporal</h3>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => setShowAssessment(!showAssessment)}>
                <Eye size={12} />{showAssessment ? "Ocultar" : "Ver detalhes"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-secondary rounded p-2">
                <p className="text-xs text-muted-foreground">BF Estimado</p>
                <p className="text-sm font-bold text-foreground">{latestAssessment.body_fat_estimate || "—"}</p>
              </div>
              <div className="bg-secondary rounded p-2">
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="text-sm font-bold text-foreground">{latestAssessment.body_fat_category || "—"}</p>
              </div>
            </div>
            {showAssessment && (
              <div className="mt-3 space-y-2 text-xs">
                {latestAssessment.overall_summary && (
                  <p className="text-muted-foreground">{latestAssessment.overall_summary}</p>
                )}
                {(latestAssessment.strong_points as string[])?.length > 0 && (
                  <div>
                    <p className="font-semibold text-primary mb-0.5">Pontos fortes:</p>
                    {(latestAssessment.strong_points as string[]).map((p: string, i: number) => (
                      <p key={i} className="text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                )}
                {(latestAssessment.weak_points as string[])?.length > 0 && (
                  <div>
                    <p className="font-semibold text-warning mb-0.5">Pontos fracos:</p>
                    {(latestAssessment.weak_points as string[]).map((p: string, i: number) => (
                      <p key={i} className="text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                )}
                {(latestAssessment.recommendations as string[])?.length > 0 && (
                  <div>
                    <p className="font-semibold text-info mb-0.5">Recomendações:</p>
                    {(latestAssessment.recommendations as string[]).map((p: string, i: number) => (
                      <p key={i} className="text-muted-foreground">• {p}</p>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Avaliado em: {new Date(latestAssessment.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Journal preview */}
        {articles.length > 0 && (
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <h3 className="font-heading font-semibold text-foreground text-sm">Journal — novidades</h3>
              </div>
              <Link to="/journal" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver tudo <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {articles.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  to="/journal"
                  className="block p-2 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <p className="text-xs font-medium text-foreground line-clamp-1">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                    {a.excerpt || a.summary}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {new Date(a.published_at).toLocaleDateString("pt-BR")}
                    {a.read_time_minutes ? ` • ${a.read_time_minutes} min de leitura` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
