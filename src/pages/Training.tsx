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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useActiveProtocol } from "@/hooks/useProtocol";
import {
  useWorkoutLogs,
  usePreviousWorkoutLogs,
  useSaveWorkoutLog,
  type WorkoutSet,
} from "@/hooks/useWorkoutLogs";
import { toast } from "sonner";

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
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

const Training = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, WorkoutSet[]>>({});
  const [sessionDate] = useState(today);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const training = (protocol?.training as any[]) || [];
  const day = training[selectedDay];

  const { data: currentLogs } = useWorkoutLogs(selectedDay, sessionDate);
  const { data: previousLogs } = usePreviousWorkoutLogs(selectedDay, sessionDate);
  const saveLog = useSaveWorkoutLog();

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
        exercise_name: ex.name,
        session_date: sessionDate,
        sets,
      });
      toast.success("Exercício salvo!");
    } catch {
      toast.error("Erro ao salvar");
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

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Treino</h1>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {training.map((d: any, i: number) => (
            <Button
              key={d.label}
              variant={i === selectedDay ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedDay(i); setShowFeedback(false); }}
              className="whitespace-nowrap"
            >
              {d.label}
            </Button>
          ))}
        </div>

        {day && (
          <>
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

            {/* Warmup instruction */}
            <Card className="p-3 border-border bg-muted/30">
              <div className="flex items-start gap-2">
                <Flame size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Instruções de aquecimento</p>
                  <p>
                    1ª série: ~50% da carga máxima (12 reps). 2ª série: ~75% da carga máxima (10
                    reps). Depois, séries válidas próximas da falha. Última série: até a falha
                    total.
                  </p>
                </div>
              </div>
            </Card>

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
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium text-sm ${allValidDone ? "text-primary" : "text-foreground"}`}
                          >
                            {ex.name}
                          </p>
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
                          {ex.sets}x{ex.reps} • Descanso: {ex.rest}
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
                        {/* Previous best */}
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

            {/* Post-workout feedback */}
            {isWorkoutComplete && !showFeedback && (
              <Card className="p-4 card-gradient border-primary/30">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy size={24} className="text-primary" />
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Treino concluído! 🔥</h3>
                    <p className="text-xs text-muted-foreground">
                      Tonelagem: {totalTonnage.toLocaleString("pt-BR")} kg
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setShowFeedback(true)}>
                  Dar feedback do treino
                </Button>
              </Card>
            )}

            {showFeedback && (
              <Card className="p-4 card-gradient border-border">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-2">Feedback do treino</h3>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setFeedbackRating(s)} className="p-0.5">
                      <Star
                        size={24}
                        className={s <= feedbackRating ? "fill-primary text-primary" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">{feedbackRating}/5</span>
                </div>
                <Textarea
                  placeholder="Como foi o treino? Sentiu algo? Alguma observação..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  className="h-16 text-xs resize-none mb-2"
                />
                <Button
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => {
                    toast.success("Feedback salvo! 💪");
                    setShowFeedback(false);
                  }}
                >
                  <Send size={12} />Enviar feedback
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Training;
