import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { useActiveProtocol } from "@/hooks/useProtocol";

const Training = () => {
  const { data: protocol, isLoading } = useActiveProtocol();
  const [selectedDay, setSelectedDay] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const training = (protocol?.training as any[]) || [];
  const day = training[selectedDay];

  const toggleDone = (exId: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      next.has(exId) ? next.delete(exId) : next.add(exId);
      return next;
    });
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
          <p className="text-muted-foreground">Nenhum treino disponível. Complete o onboarding primeiro.</p>
        </div>
      </AppLayout>
    );
  }

  const completed = day?.exercises?.filter((e: any) => completedExercises.has(e.id)).length || 0;
  const total = day?.exercises?.length || 0;

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Treino</h1>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {training.map((d: any, i: number) => (
            <Button key={d.label} variant={i === selectedDay ? "default" : "outline"} size="sm" onClick={() => setSelectedDay(i)} className="whitespace-nowrap">
              {d.label}
            </Button>
          ))}
        </div>

        {day && (
          <>
            <Card className="p-4 card-gradient border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{day.muscleGroup}</h3>
                  <p className="text-sm text-muted-foreground">{total} exercícios</p>
                </div>
                <Badge variant={completed === total ? "default" : "secondary"}>{completed}/{total}</Badge>
              </div>
            </Card>

            <div className="space-y-2">
              {day.exercises?.map((ex: any) => {
                const done = completedExercises.has(ex.id);
                return (
                  <Card key={ex.id} className={`p-4 transition-colors ${done ? "border-primary/30 bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={done} onCheckedChange={() => toggleDone(ex.id)} />
                      <div className="flex-1" onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}>
                        <p className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{ex.name}</p>
                        <p className="text-xs text-muted-foreground">{ex.sets}x{ex.reps} • Descanso: {ex.rest}</p>
                      </div>
                      <button onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}>
                        {expandedExercise === ex.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </button>
                    </div>
                    {expandedExercise === ex.id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" className="gap-2"><Play size={14} /> Ver vídeo</Button>
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
