import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { useActiveProtocol } from "@/hooks/useProtocol";
import {
  useWorkoutLogs,
  usePreviousWorkoutLogs,
  useSaveWorkoutLog,
  type WorkoutSet,
} from "@/hooks/useWorkoutLogs";
import { toast } from "sonner";

const today = new Date().toISOString().split("T")[0];

const Training = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [exerciseSets, setExerciseSets] = useState<Record<string, WorkoutSet[]>>({});
  const [sessionDate] = useState(today);

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
        // Most recent session's last valid set
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
        // 2 warmup + valid sets from protocol (1-3 based on experience)
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
              onClick={() => setSelectedDay(i)}
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
                <Badge variant={completedCount === total ? "default" : "secondary"}>
                  {completedCount}/{total}
                </Badge>
              </div>
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
                                  className="text-[10px] px-1.5 py-0 border-orange-500/40 text-orange-400 bg-orange-500/10"
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
                        ))}

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
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Training;
