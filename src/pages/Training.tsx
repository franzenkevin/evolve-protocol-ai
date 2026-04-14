import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Play, ChevronDown, ChevronUp } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  done: boolean;
  videoUrl?: string;
}

interface TrainingDay {
  label: string;
  muscleGroup: string;
  exercises: Exercise[];
}

const MOCK_TRAINING: TrainingDay[] = [
  {
    label: "Segunda",
    muscleGroup: "Peito & Tríceps",
    exercises: [
      { id: "1", name: "Supino reto com barra", sets: 4, reps: "8-12", rest: "90s", done: false },
      { id: "2", name: "Supino inclinado com halteres", sets: 3, reps: "10-12", rest: "90s", done: false },
      { id: "3", name: "Crucifixo na máquina", sets: 3, reps: "12-15", rest: "60s", done: false },
      { id: "4", name: "Tríceps pulley corda", sets: 3, reps: "12-15", rest: "60s", done: false },
      { id: "5", name: "Tríceps testa com barra EZ", sets: 3, reps: "10-12", rest: "60s", done: false },
      { id: "6", name: "Mergulho no banco", sets: 3, reps: "falha", rest: "60s", done: false },
    ],
  },
  {
    label: "Terça",
    muscleGroup: "Costas & Bíceps",
    exercises: [
      { id: "7", name: "Puxada frontal", sets: 4, reps: "8-12", rest: "90s", done: false },
      { id: "8", name: "Remada curvada", sets: 4, reps: "8-12", rest: "90s", done: false },
      { id: "9", name: "Remada unilateral", sets: 3, reps: "10-12", rest: "60s", done: false },
      { id: "10", name: "Rosca direta barra", sets: 3, reps: "10-12", rest: "60s", done: false },
      { id: "11", name: "Rosca martelo", sets: 3, reps: "12-15", rest: "60s", done: false },
    ],
  },
  {
    label: "Quarta",
    muscleGroup: "Pernas (Quad)",
    exercises: [
      { id: "12", name: "Agachamento livre", sets: 4, reps: "8-10", rest: "120s", done: false },
      { id: "13", name: "Leg press 45°", sets: 4, reps: "10-12", rest: "90s", done: false },
      { id: "14", name: "Cadeira extensora", sets: 3, reps: "12-15", rest: "60s", done: false },
      { id: "15", name: "Passada com halteres", sets: 3, reps: "12/lado", rest: "60s", done: false },
    ],
  },
];

const Training = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [exercises, setExercises] = useState(MOCK_TRAINING);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const toggleDone = (dayIdx: number, exId: string) => {
    setExercises((prev) =>
      prev.map((day, i) =>
        i === dayIdx
          ? {
              ...day,
              exercises: day.exercises.map((ex) =>
                ex.id === exId ? { ...ex, done: !ex.done } : ex
              ),
            }
          : day
      )
    );
  };

  const day = exercises[selectedDay];
  const completed = day.exercises.filter((e) => e.done).length;

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Treino</h1>

        {/* Day Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {exercises.map((d, i) => (
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

        {/* Day Info */}
        <Card className="p-4 card-gradient border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-foreground">{day.muscleGroup}</h3>
              <p className="text-sm text-muted-foreground">{day.exercises.length} exercícios</p>
            </div>
            <Badge variant={completed === day.exercises.length ? "default" : "secondary"}>
              {completed}/{day.exercises.length}
            </Badge>
          </div>
        </Card>

        {/* Exercises */}
        <div className="space-y-2">
          {day.exercises.map((ex) => (
            <Card key={ex.id} className={`p-4 transition-colors ${ex.done ? "border-primary/30 bg-primary/5" : ""}`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={ex.done}
                  onCheckedChange={() => toggleDone(selectedDay, ex.id)}
                />
                <div className="flex-1" onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}>
                  <p className={`font-medium text-sm ${ex.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {ex.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets}x{ex.reps} • Descanso: {ex.rest}
                  </p>
                </div>
                <button onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}>
                  {expandedExercise === ex.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>
              </div>
              {expandedExercise === ex.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Play size={14} /> Ver vídeo
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Training;
