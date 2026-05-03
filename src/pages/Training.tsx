import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Save,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Flame,
  Target,
  Trophy,
  Star,
  Send,
  Info,
  Brain,
  Loader2,
  Replace,
  CheckCircle2,
  XCircle,
  Activity,
  Coffee,
} from "lucide-react";
import ExerciseVideo from "@/components/ExerciseVideo";
import MobilityDrawer from "@/components/MobilityDrawer";
import CardioCard from "@/components/CardioCard";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { useProfile } from "@/hooks/useProfile";
import {
  useWorkoutLogs,
  usePreviousWorkoutLogs,
  useSaveWorkoutLog,
  type WorkoutSet,
} from "@/hooks/useWorkoutLogs";
import { useWorkoutFeedback, useSaveWorkoutFeedback } from "@/hooks/useWorkoutFeedback";
import { toast } from "sonner";
import { normalizeTraining } from "@/lib/dietNormalize";

// AI explanation hook — streams from the chat edge function
function useAIExplanation() {
  const cache = useRef<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>({});

  const ask = useCallback(async (key: string, prompt: string) => {
    if (cache.current[key]) {
      setTexts((prev) => ({ ...prev, [key]: cache.current[key] }));
      return;
    }
    setLoading(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão expirada");
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
        }
      );
      if (!resp.ok || !resp.body) throw new Error("Falha");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let result = "";
      let done = false;
      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) {
              result += c;
              setTexts((prev) => ({ ...prev, [key]: result }));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      cache.current[key] = result;
    } catch {
      setTexts((prev) => ({ ...prev, [key]: "Erro ao carregar explicação." }));
    } finally {
      setLoading(null);
    }
  }, []);

  return { ask, loading, texts };
}

const today = new Date().toISOString().split("T")[0];

const WEEKDAY_MAP: Record<number, string> = {
  0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta",
  4: "Quinta", 5: "Sexta", 6: "Sábado",
};
const todayWeekday = WEEKDAY_MAP[new Date().getDay()];

const Training = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const { data: profile } = useProfile();
  const [selectedDay, setSelectedDay] = useState(-1); // -1 = not yet initialized
  const [initialized, setInitialized] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, WorkoutSet[]>>({});
  const [sessionDate] = useState(today);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [showSplitExplanation, setShowSplitExplanation] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState<string | null>(null);
  const [swapResults, setSwapResults] = useState<Record<string, { available: boolean; newExercise?: string; reason?: string; message?: string }>>({});
  const [swapping, setSwapping] = useState<string | null>(null);
  const [swappedNames, setSwappedNames] = useState<Record<string, string>>({});
  const [showMobilityDrawer, setShowMobilityDrawer] = useState(false);
  const ai = useAIExplanation();

  const training = useMemo(
    () => normalizeTraining(protocol?.training),
    [protocol?.training]
  );

  // Detect: is today a "rest day"? (today isn't in any of the training day weekdays)
  const todayHasTraining = useMemo(
    () => training.some((d: any) => d.weekday === todayWeekday),
    [training]
  );
  const isRestDayToday = training.length > 0 && !todayHasTraining;

  // Auto-select today's training day on first load. If today is rest, default to first day.
  useEffect(() => {
    if (initialized || training.length === 0) return;
    const todayIndex = training.findIndex((d: any) => d.weekday === todayWeekday);
    setSelectedDay(todayIndex >= 0 ? todayIndex : 0);
    setInitialized(true);
  }, [training.length, initialized]);

  const day = selectedDay >= 0 ? training[selectedDay] : null;
  const isTodayDay = (d: any) => d.weekday === todayWeekday;
  const viewingTodayTraining = day && isTodayDay(day);

  const { data: currentLogs } = useWorkoutLogs(selectedDay, sessionDate);
  const { data: previousLogs } = usePreviousWorkoutLogs(selectedDay, sessionDate);
  const { data: existingFeedback } = useWorkoutFeedback(selectedDay >= 0 ? selectedDay : 0, sessionDate);
  const saveLog = useSaveWorkoutLog();
  const saveFeedback = useSaveWorkoutFeedback();

  // Build a map of previous best per exercise
  const prevBestMap: Record<string, { weight: number; reps: number }> = {};
  if (previousLogs) {
    for (const log of previousLogs) {
      if (!prevBestMap[log.exercise_id]) {
        const validSets = (log.sets as WorkoutSet[]).filter(
          (s) => s.type === "valid" && s.completed
        );
        if (validSets.length > 0) {
          const last = validSets[validSets.length - 1];
          prevBestMap[log.exercise_id] = { weight: last.weight, reps: last.reps };
        }
      }
    }
  }

  // Initialize sets from saved logs or defaults
  useEffect(() => {
    if (!day?.exercises) return;
    const initial: Record<string, WorkoutSet[]> = {};
    for (const ex of day.exercises) {
      const saved = currentLogs?.find((l: any) => l.exercise_id === ex.id);
      if (saved) {
        initial[ex.id] = saved.sets as WorkoutSet[];
      } else {
        const prev = prevBestMap[ex.id];
        const maxWeight = prev?.weight || 0;
        const validSets = Math.min(Math.max(ex.sets || 2, 1), 3);
        initial[ex.id] = [
          { type: "warmup", weight: Math.round(maxWeight * 0.5), reps: 12, completed: false },
          { type: "warmup", weight: Math.round(maxWeight * 0.75), reps: 10, completed: false },
          ...Array.from({ length: validSets }, () => ({
            type: "valid" as const,
            weight: maxWeight,
            reps: 0,
            completed: false,
          })),
        ];
      }
    }
    setExerciseSets(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, currentLogs?.length, day?.exercises?.length]);

  const updateSet = useCallback(
    (exId: string, setIndex: number, field: keyof WorkoutSet, value: any) => {
      setExerciseSets((prev) => {
        const sets = [...(prev[exId] || [])];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        return { ...prev, [exId]: sets };
      });
    },
    []
  );

  const handleSaveExercise = async (ex: any) => {
    const sets = exerciseSets[ex.id];
    if (!sets) return;
    try {
      await saveLog.mutateAsync({
        protocol_id: protocol?.id,
        day_index: selectedDay,
        exercise_id: ex.id,
        exercise_name: swappedNames[ex.id] || ex.name,
        session_date: sessionDate,
        sets,
      });
      toast.success("Exercício salvo!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  // Sync existing feedback when day changes
  useEffect(() => {
    if (existingFeedback) {
      setFeedbackRating(existingFeedback.rating);
      setFeedbackNotes(existingFeedback.notes || "");
    } else {
      setFeedbackRating(0);
      setFeedbackNotes("");
    }
  }, [existingFeedback?.id, selectedDay]);

  const handleFinishWorkout = async () => {
    if (!day?.exercises) return;
    try {
      // Save all exercises that have any data entered
      await Promise.all(
        day.exercises.map((ex: any) => {
          const sets = exerciseSets[ex.id];
          if (!sets) return Promise.resolve();
          return saveLog.mutateAsync({
            protocol_id: protocol?.id,
            day_index: selectedDay,
            exercise_id: ex.id,
            exercise_name: swappedNames[ex.id] || ex.name,
            session_date: sessionDate,
            sets,
          });
        })
      );
      toast.success("Treino finalizado! 💪");
      setShowFeedback(true);
    } catch {
      toast.error("Erro ao finalizar treino");
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      toast.error("Escolha uma nota de 1 a 5");
      return;
    }
    try {
      await saveFeedback.mutateAsync({
        protocol_id: protocol?.id || null,
        day_index: selectedDay,
        session_date: sessionDate,
        rating: feedbackRating,
        notes: feedbackNotes || null,
      });
      toast.success("Feedback registrado! Obrigado.");
      setShowFeedback(false);
    } catch {
      toast.error("Erro ao salvar feedback");
    }
  };

  const handleSwapExercise = async (ex: any) => {
    setSwapping(ex.id);
    try {
      const { data, error } = await supabase.functions.invoke("swap-exercise", {
        body: {
          exerciseName: swappedNames[ex.id] || ex.name,
          muscleGroup: day?.muscleGroup,
          gymType: undefined,
          reason: "Aluno não tem o equipamento ou não consegue executar este exercício",
        },
      });
      if (error) throw error;
      setSwapResults((prev) => ({ ...prev, [ex.id]: data }));
    } catch (e: any) {
      toast.error(e?.message || "Erro ao buscar substituição");
      setSwapResults((prev) => ({
        ...prev,
        [ex.id]: { available: false, message: "Erro ao buscar substituição. Tente novamente." },
      }));
    } finally {
      setSwapping(null);
    }
  };

  const acceptSwap = (exId: string) => {
    const result = swapResults[exId];
    if (result?.available && result.newExercise) {
      setSwappedNames((prev) => ({ ...prev, [exId]: result.newExercise! }));
      setSwapResults((prev) => {
        const next = { ...prev };
        delete next[exId];
        return next;
      });
      toast.success("Exercício substituído nesta sessão!");
    }
  };

  const getProgression = (exId: string): "up" | "down" | "same" | null => {
    const prev = prevBestMap[exId];
    const current = exerciseSets[exId];
    if (!prev || !current) return null;
    const validCompleted = current.filter((s) => s.type === "valid" && s.completed);
    if (validCompleted.length === 0) return null;
    const last = validCompleted[validCompleted.length - 1];
    if (last.weight > prev.weight) return "up";
    if (last.weight === prev.weight && last.reps > prev.reps) return "up";
    if (last.weight < prev.weight) return "down";
    if (last.reps < prev.reps) return "down";
    return "same";
  };

  // Calculate tonnage for current workout
  const totalTonnage = useMemo(() => {
    if (!day?.exercises) return 0;
    let total = 0;
    for (const ex of day.exercises) {
      const sets = exerciseSets[ex.id] || [];
      for (const set of sets) {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          total += set.weight * set.reps;
        }
      }
    }
    return total;
  }, [day?.exercises, exerciseSets]);

  // Check if all exercises are completed
  const isWorkoutComplete = useMemo(() => {
    if (!day?.exercises || day.exercises.length === 0) return false;
    return day.exercises.every((e: any) => {
      const sets = exerciseSets[e.id] || [];
      const validSets = sets.filter((s) => s.type === "valid");
      return validSets.length > 0 && validSets.every((s) => s.completed);
    });
  }, [day?.exercises, exerciseSets]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!training.length) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto text-center pt-20">
          <p className="text-muted-foreground">
            Nenhum treino disponível. Complete o onboarding primeiro.
          </p>
        </div>
      </AppLayout>
    );
  }

  const completedCount =
    day?.exercises?.filter((e: any) => {
      const sets = exerciseSets[e.id] || [];
      return sets.filter((s) => s.type === "valid").every((s) => s.completed);
    }).length || 0;
  const total = day?.exercises?.length || 0;

  // Cardio prescribed for today within the training day (when applicable)
  const cardioOnDay = day?.cardio || null;
  const cardioTiming = (profile?.cardio_timing || "").toLowerCase();

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Treino</h1>

        {/* REST DAY BANNER + CARDIO */}
        {isRestDayToday && (
          <Card className="p-4 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Coffee size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-foreground text-sm">
                  Hoje é dia de descanso
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Aproveite para recuperar. Veja abaixo seus treinos da semana ou complete um cardio leve, se estiver no seu protocolo.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Cardio dedicated card on rest day */}
        {isRestDayToday && profile?.cardio_enabled && (
          <CardioCard profile={profile} variant="rest" />
        )}

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {training.map((d: any, i: number) => {
            const isToday = isTodayDay(d);
            return (
              <Button
                key={d.label}
                variant={i === selectedDay ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedDay(i); setShowFeedback(false); }}
                className={`whitespace-nowrap ${isToday && i !== selectedDay ? "border-primary/60 text-primary" : ""}`}
              >
                {isToday && "📍 "}{d.weekday || d.label}
              </Button>
            );
          })}
        </div>

        {day && (
          <>
            {/* Cardio BEFORE training (if timing=before and today's training day) */}
            {viewingTodayTraining && profile?.cardio_enabled && cardioTiming === "before" && (
              <CardioCard profile={profile} variant="training" />
            )}

            {/* Summary card */}
            <Card className="p-4 card-gradient border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">
                    {day.muscleGroup}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {total} exercícios • {sessionDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isWorkoutComplete && (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <Trophy size={10} className="mr-1" />Concluído
                    </Badge>
                  )}
                  <Badge variant={completedCount === total ? "default" : "secondary"}>
                    {completedCount}/{total}
                  </Badge>
                </div>
              </div>

              {/* Tonnage display */}
              {totalTonnage > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tonelagem total</span>
                    <span className="text-lg font-bold text-primary font-heading">
                      {totalTonnage.toLocaleString("pt-BR")} kg
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Cardio prescribed inside the day from the protocol */}
            {cardioOnDay && cardioOnDay.modality && (
              <Card className="p-3 bg-primary/10 border-primary/30">
                <div className="flex items-start gap-2">
                  <Activity size={16} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Cardio: {cardioOnDay.modality}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {cardioOnDay.duration ? `${cardioOnDay.duration} min` : ""}
                      {cardioOnDay.intensity ? ` · ${cardioOnDay.intensity}` : ""}
                    </p>
                    {cardioOnDay.notes && (
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {cardioOnDay.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Split explanation button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => {
                setShowSplitExplanation(!showSplitExplanation);
                if (!showSplitExplanation) {
                  const allExercises = day.exercises.map((e: any) => `${e.name} (${e.sets}x${e.reps})`).join("; ");
                  ai.ask(
                    `split-${selectedDay}`,
                    `Explique a lógica deste treino de **${day.muscleGroup}** de forma curta, didática e em MARKDOWN com seções claras. Exercícios na ordem: ${allExercises}.

Use EXATAMENTE este formato (sem inventar outras seções):

### 🎯 Por que essa divisão
2 frases curtas explicando por que esses músculos juntos hoje e como isso encaixa na semana.

### 🔁 Lógica da ordem
- 1º exercício: por quê começa por ele (composto/maior gasto neural)
- 2º: como complementa o ângulo
- (continue na ordem real, 1 linha por exercício, foco no porquê biomecânico)

### 📈 Como progredir hoje
2-3 bullets diretos: como saber se aumenta carga, quando fica na mesma e o sinal da última série de falha.

Seja direto, sem floreio. Máximo 180 palavras no total.`
                  );
                }
              }}
            >
              <Brain size={14} />
              {showSplitExplanation ? "Ocultar explicação" : "Por que esse treino?"}
            </Button>

            {showSplitExplanation && (
              <Card className="p-4 border-primary/20 bg-primary/5">
                {ai.loading === `split-${selectedDay}` && !ai.texts[`split-${selectedDay}`] ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Analisando...
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-xs [&>p]:mb-2 [&>ul]:mb-2 [&>ul]:pl-4 [&>ul>li]:mb-1 [&>h3]:text-sm [&>h3]:text-primary [&>h3]:font-heading [&>h3]:mt-3 [&>h3:first-child]:mt-0 [&>h3]:mb-1 [&>p]:text-xs [&>li]:text-xs">
                    <ReactMarkdown>{ai.texts[`split-${selectedDay}`] || ""}</ReactMarkdown>
                  </div>
                )}
              </Card>
            )}

            {/* Dinâmica do treino — visual, organizada por nível */}
            <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} className="text-primary" />
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Dinâmica do treino
                </h3>
                {profile?.experience && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary capitalize ml-auto">
                    {profile.experience}
                  </Badge>
                )}
              </div>

              {profile?.experience === "iniciante" ? (
                <div className="space-y-3 sm:space-y-3.5">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold shrink-0">A</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Aquecimento — 50% da carga máx. já usada</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">15 reps controladas. SEM chegar perto da falha. Só preparar o músculo.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Válida 1 — carga máxima já usada</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">Vai até 10 reps, próximo da falha (RIR 1-2).</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/25 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Válida 2 — sobe 10–20% da carga</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">Alvo de 8 reps, próximo da falha.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/40 text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Válida 3 — MESMA carga da V2, FALHA TOTAL</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">A série mais importante. Só pare quando o músculo travar.</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-success" /> Como progredir na próxima sessão
                    </p>
                    <ul className="text-xs sm:text-[13px] text-muted-foreground space-y-1.5 pl-4 list-disc marker:text-primary/60 leading-relaxed">
                      <li>Passou de <span className="text-foreground font-medium">10 reps</span> na V3 (falha) → <span className="text-success font-medium">aumenta carga</span></li>
                      <li>Ficou abaixo de <span className="text-foreground font-medium">6 reps</span> na V3 → <span className="text-warning font-medium">reduz carga</span></li>
                      <li>Entre 7-10 reps → mantém e sobe 1 rep por semana</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-3.5">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold shrink-0">A1</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Aquecimento 1 — 50% da carga (12 reps)</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">Movimento controlado, ativação muscular. Pode pular se já estiver bem aquecido.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold shrink-0">A2</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">Aquecimento 2 — 75% da carga (5–8 reps)</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">Preparação neural. Ainda longe da falha.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/25 text-primary flex items-center justify-center text-xs font-bold shrink-0">V</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {profile?.experience === "avancado" || profile?.experience === "avançado"
                          ? "3 séries válidas (RIR 1-2)"
                          : "2 a 3 séries válidas (RIR 1-2)"}
                      </p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mt-0.5">
                        Próximo da falha. A <span className="text-foreground font-medium">última é SEMPRE falha total (RIR 0)</span>.
                        {" "}Quantidade de válidas (1, 2 ou 3) varia por exercício — siga o card.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Zona-alvo de repetições</p>
                    <ul className="text-xs sm:text-[13px] text-muted-foreground space-y-1.5 pl-4 list-disc marker:text-primary/60 leading-relaxed">
                      <li>Compostos pesados / força: <span className="text-foreground font-medium">5–9 reps</span></li>
                      <li>Hipertrofia clássica: <span className="text-foreground font-medium">6–10 ou 8–12 reps</span></li>
                      <li>Isolados / resistência: <span className="text-foreground font-medium">10–15 ou 15–20 reps</span></li>
                    </ul>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-success" /> Progressão contínua (olhe a SÉRIE DE FALHA)
                    </p>
                    <ul className="text-xs sm:text-[13px] text-muted-foreground space-y-1.5 pl-4 list-disc marker:text-primary/60 leading-relaxed">
                      <li>Passou do <span className="text-foreground font-medium">topo da zona-alvo</span> → <span className="text-success font-medium">aumenta carga</span></li>
                      <li>Abaixo do <span className="text-foreground font-medium">piso da zona</span> → <span className="text-warning font-medium">reduz carga</span></li>
                      <li>Dentro da zona → +1 rep por semana até bater o topo</li>
                    </ul>
                  </div>

                  {(profile?.experience === "avancado" || profile?.experience === "avançado") && (
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">Volume e ciclo</p>
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                        Ciclo com volume <span className="text-foreground font-medium">mediano</span> para permitir progressão gradual de carga sem acumular fadiga em excesso.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border/40 flex items-start gap-2">
                <Info size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                  Siga a <span className="text-foreground font-medium">ordem dos exercícios</span> abaixo. Respeite o descanso entre séries indicado em cada exercício para manter a intensidade.
                </p>
              </div>
            </Card>

            {/* Mobility drawer trigger — opcional, sugerido pelo grupo do dia */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-warning/30 text-warning hover:text-warning hover:bg-warning/10"
              onClick={() => setShowMobilityDrawer(true)}
            >
              <Activity size={14} />
              Ver rotina de mobilidade
            </Button>

            {/* Mobility & stretching (based on posture deviations) */}
            {Array.isArray(day.mobility) && day.mobility.length > 0 && (
              <Card className="p-4 border-warning/20 bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-warning" />
                  <h3 className="font-heading font-semibold text-sm text-foreground">
                    Mobilidade & alongamento
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Faça <span className="text-foreground font-medium">antes das séries válidas</span>. Itens prescritos para corrigir desvios identificados na sua avaliação corporal.
                </p>
                <div className="space-y-3">
                  {day.mobility.map((m: any, mi: number) => {
                    const mobKey = `mob-${selectedDay}-${mi}`;
                    const expanded = expandedExercise === mobKey;
                    return (
                      <div key={mi} className="rounded-lg border border-border/50 bg-background/40 overflow-hidden">
                        <button
                          className="w-full p-3 flex items-start gap-2 text-left"
                          onClick={() => setExpandedExercise(expanded ? null : mobKey)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-sm font-medium text-foreground">{m.name}</p>
                              {m.type && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 border-warning/30 text-warning bg-warning/5 capitalize">
                                  {m.type}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {m.duration}
                              {m.target && <span className="opacity-70"> · corrige: {m.target}</span>}
                            </p>
                          </div>
                          {expanded ? (
                            <ChevronUp size={14} className="text-muted-foreground mt-1" />
                          ) : (
                            <ChevronDown size={14} className="text-muted-foreground mt-1" />
                          )}
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3">
                            <ExerciseVideo
                              exerciseName={m.name}
                              videoUrl={m.videoUrl}
                              videoQuery={m.videoQuery}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Exercise list */}
            <div className="space-y-3">
              {day.exercises?.map((ex: any) => {
                const sets = exerciseSets[ex.id] || [];
                const isExpanded = expandedExercise === ex.id;
                const allValidDone = sets
                  .filter((s) => s.type === "valid")
                  .every((s) => s.completed);
                const progression = getProgression(ex.id);
                const prev = prevBestMap[ex.id];

                // Exercise tonnage
                const exTonnage = sets.reduce((acc, s) => {
                  if (s.completed && s.weight > 0 && s.reps > 0) return acc + s.weight * s.reps;
                  return acc;
                }, 0);

                return (
                  <Card
                    key={ex.id}
                    className={`transition-colors ${allValidDone ? "border-primary/30 bg-primary/5" : ""}`}
                  >
                    {/* Header */}
                    <button
                      className="w-full p-4 flex items-center gap-3 text-left"
                      onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`font-medium text-sm ${allValidDone ? "text-primary" : "text-foreground"}`}
                          >
                            {swappedNames[ex.id] || ex.name}
                          </p>
                          {swappedNames[ex.id] && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-warning/40 text-warning bg-warning/10">
                              substituído
                            </Badge>
                          )}
                          {progression === "up" && (
                            <TrendingUp size={14} className="text-primary" />
                          )}
                          {progression === "down" && (
                            <TrendingDown size={14} className="text-destructive" />
                          )}
                          {progression === "same" && (
                            <Minus size={14} className="text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {/* Se reps já descreve múltiplas séries (ex: "3 séries válidas...", "10/8/falha", "8/8/8 cluster"), mostrar só reps. Senão, "Nx reps". */}
                          {/[\/x]|série|serie|valida|válida|falha/i.test(String(ex.reps)) ? ex.reps : `${ex.sets}x${ex.reps}`} • Descanso: {ex.rest}
                          {exTonnage > 0 && ` • ${exTonnage.toLocaleString("pt-BR")}kg`}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      )}
                    </button>

                    {/* Expanded: Set tracking */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        {/* Exercise info button */}
                        <button
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const infoKey = `ex-${ex.id}`;
                            if (showExerciseInfo === ex.id) {
                              setShowExerciseInfo(null);
                            } else {
                              setShowExerciseInfo(ex.id);
                              ai.ask(
                                infoKey,
                                `Explique brevemente (máximo 2 parágrafos) o exercício "${ex.name}" no contexto de treino de ${day.muscleGroup}. Inclua: músculos trabalhados, por que foi escolhido para essa divisão, dica de execução. Seja direto.`
                              );
                            }
                          }}
                        >
                          <Info size={12} />
                          {showExerciseInfo === ex.id ? "Ocultar info" : "Por que este exercício?"}
                        </button>

                        {showExerciseInfo === ex.id && (
                          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                            {ai.loading === `ex-${ex.id}` && !ai.texts[`ex-${ex.id}`] ? (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 size={12} className="animate-spin" /> Analisando...
                              </div>
                            ) : (
                              <div className="prose prose-sm prose-invert max-w-none text-xs [&>p]:mb-1 [&>p]:text-xs [&>li]:text-xs [&>ul]:mb-1">
                                <ReactMarkdown>{ai.texts[`ex-${ex.id}`] || ""}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Swap exercise button */}
                        <button
                          className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 transition-colors disabled:opacity-50"
                          disabled={swapping === ex.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwapExercise(ex);
                          }}
                        >
                          {swapping === ex.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Replace size={12} />
                          )}
                          Não tenho esse equipamento — sugerir substituição
                        </button>

                        {swapResults[ex.id] && (
                          <div className={`rounded-lg border p-3 ${swapResults[ex.id].available ? "bg-warning/10 border-warning/30" : "bg-muted/30 border-border"}`}>
                            {swapResults[ex.id].available ? (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 size={14} className="text-warning mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-foreground">
                                      Substituir por: <span className="text-warning">{swapResults[ex.id].newExercise}</span>
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                      {swapResults[ex.id].reason}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] flex-1"
                                    onClick={() => acceptSwap(ex.id)}
                                  >
                                    Aceitar substituição
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-[11px]"
                                    onClick={() => setSwapResults((prev) => { const n = { ...prev }; delete n[ex.id]; return n; })}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <XCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {swapResults[ex.id].message}
                                  </p>
                                  <button
                                    onClick={() => setSwapResults((prev) => { const n = { ...prev }; delete n[ex.id]; return n; })}
                                    className="text-[10px] text-primary hover:underline mt-1"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Execution video */}
                        <ExerciseVideo
                          exerciseName={swappedNames[ex.id] || ex.name}
                          videoUrl={ex.videoUrl}
                          videoQuery={ex.videoQuery || `${swappedNames[ex.id] || ex.name} execução correta`}
                        />

                        {prev && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
                            <History size={12} />
                            <span>
                              Último treino: {prev.weight}kg × {prev.reps} reps
                            </span>
                          </div>
                        )}

                        {/* Sets table header */}
                        <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
                          <span>Série</span>
                          <span>Carga (kg)</span>
                          <span>Reps</span>
                          <span className="text-center">✓</span>
                        </div>

                        {/* Sets */}
                        {sets.map((set, si) => {
                          const validIndex = set.type === "valid"
                            ? sets.slice(0, si).filter((s) => s.type === "valid").length + 1
                            : 0;
                          return (
                          <div
                            key={si}
                            className={`grid grid-cols-[60px_1fr_1fr_40px] gap-2 items-center ${
                              set.completed ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {set.type === "warmup" ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-warning/40 text-warning bg-warning/10"
                                >
                                  AQ {si + 1}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-primary/30 text-primary"
                                >
                                  <Target size={8} className="mr-0.5" />
                                  {validIndex}
                                </Badge>
                              )}
                            </div>
                            <Input
                              type="number"
                              inputMode="decimal"
                              className="h-8 text-sm text-center"
                              value={set.weight || ""}
                              onChange={(e) =>
                                updateSet(ex.id, si, "weight", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="h-8 text-sm text-center"
                              value={set.reps || ""}
                              onChange={(e) =>
                                updateSet(ex.id, si, "reps", Number(e.target.value))
                              }
                              placeholder="0"
                            />
                            <div className="flex justify-center">
                              <Checkbox
                                checked={set.completed}
                                onCheckedChange={(checked) =>
                                  updateSet(ex.id, si, "completed", !!checked)
                                }
                              />
                            </div>
                          </div>
                          );
                        })}

                        {/* Progression hint */}
                        {prev && (
                          <p className="text-[10px] text-muted-foreground italic">
                            Meta: atingir {ex.reps} reps com {prev.weight}kg. Se alcançar o
                            topo, aumente ~10% na próxima sessão.
                          </p>
                        )}

                        {/* Save button */}
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleSaveExercise(ex)}
                          disabled={saveLog.isPending}
                        >
                          <Save size={14} />
                          Salvar exercício
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Cardio AFTER training (if timing=after and today's training day) */}
            {viewingTodayTraining && profile?.cardio_enabled && cardioTiming === "after" && (
              <CardioCard profile={profile} variant="training" />
            )}

            {/* Finalize workout button */}
            {!showFeedback && (
              <Card className={`p-4 card-gradient ${isWorkoutComplete ? "border-primary/30" : "border-border"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Trophy size={20} className={isWorkoutComplete ? "text-primary" : "text-muted-foreground"} />
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground text-sm">
                      {isWorkoutComplete ? "Treino concluído! 🔥" : "Finalizar treino"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Salva todos exercícios e pede um feedback rápido.
                      {totalTonnage > 0 && ` • ${totalTonnage.toLocaleString("pt-BR")} kg`}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full glow"
                  onClick={handleFinishWorkout}
                  disabled={saveLog.isPending}
                >
                  {saveLog.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
                  Finalizar treino
                </Button>
                {existingFeedback && (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Feedback já registrado: {existingFeedback.rating}/5 ⭐
                  </p>
                )}
              </Card>
            )}

            {showFeedback && (
              <Card className="p-4 card-gradient border-primary/30">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">Como foi o treino?</h3>
                <p className="text-[11px] text-muted-foreground mb-3">Avalie de 0 a 5 estrelas (descrição opcional).</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setFeedbackRating(s)} className="p-0.5" type="button">
                      <Star
                        size={28}
                        className={s <= feedbackRating ? "fill-primary text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">{feedbackRating}/5</span>
                </div>
                <Textarea
                  placeholder="Como foi a execução? Sentiu algo? (opcional)"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="h-20 text-xs resize-none mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowFeedback(false)}
                    disabled={saveFeedback.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={handleSubmitFeedback}
                    disabled={saveFeedback.isPending || feedbackRating === 0}
                  >
                    {saveFeedback.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Enviar feedback
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
      <MobilityDrawer
        open={showMobilityDrawer}
        onOpenChange={setShowMobilityDrawer}
        suggestedRegion={day?.muscleGroup}
      />
    </AppLayout>
  );
};

export default Training;
