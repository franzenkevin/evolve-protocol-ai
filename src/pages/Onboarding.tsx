import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingData {
  fullName: string;
  age: string;
  sex: string;
  weight: string;
  height: string;
  goal: string;
  activityLevel: string;
  neat: string;
  trainingDays: string;
  experience: string;
  gymType: string;
  injuries: string[];
  foodsLike: string[];
  foodsDislike: string;
  allergies: string;
  sleepHours: string;
  stressLevel: string;
}

const STEPS = [
  "Dados Pessoais",
  "Objetivo & Nível",
  "Treino",
  "Alimentação",
  "Estilo de Vida",
];

const GOALS = ["Hipertrofia", "Emagrecimento", "Recomposição Corporal", "Saúde Geral"];
const ACTIVITY_LEVELS = ["Sedentário", "Levemente ativo", "Moderadamente ativo", "Muito ativo", "Extremamente ativo"];
const EXPERIENCE_LEVELS = ["Iniciante (0-6 meses)", "Intermediário (6m-2 anos)", "Avançado (2+ anos)"];
const GYM_TYPES = ["Academia completa", "Academia limitada", "Treino em casa"];
const INJURY_OPTIONS = ["Nenhuma", "Joelho", "Ombro", "Lombar", "Cervical", "Punho", "Tornozelo"];
const FOOD_OPTIONS = ["Frango", "Carne vermelha", "Peixe", "Ovos", "Arroz", "Batata doce", "Aveia", "Whey", "Frutas", "Vegetais", "Leite", "Queijo"];
const TRAINING_DAYS = ["2", "3", "4", "5", "6"];
const NEAT_OPTIONS = ["Trabalho sentado", "Trabalho em pé", "Trabalho físico leve", "Trabalho físico pesado"];
const STRESS_LEVELS = ["Baixo", "Moderado", "Alto", "Muito alto"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    fullName: "", age: "", sex: "", weight: "", height: "",
    goal: "", activityLevel: "", neat: "", trainingDays: "",
    experience: "", gymType: "", injuries: [], foodsLike: [],
    foodsDislike: "", allergies: "", sleepHours: "", stressLevel: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "injuries" | "foodsLike", item: string) => {
    setData((prev) => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] };
    });
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      // Save onboarding data (will be persisted to DB later)
      localStorage.setItem("hypertrophy_onboarding", JSON.stringify(data));
      toast({ title: "Onboarding completo!", description: "Gerando seu protocolo..." });
      navigate("/dashboard");
    }
  };

  const prev = () => step > 0 && setStep(step - 1);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground mb-2">{STEPS[step]} — Passo {step + 1} de {STEPS.length}</p>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto animate-fade-in space-y-5">
          {step === 0 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Dados Pessoais</h2>
              <div><Label>Nome completo</Label><Input value={data.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Seu nome" className="mt-1" /></div>
              <div><Label>Idade</Label><Input type="number" value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="25" className="mt-1" /></div>
              <div>
                <Label>Sexo</Label>
                <RadioGroup value={data.sex} onValueChange={(v) => update("sex", v)} className="flex gap-4 mt-1">
                  <div className="flex items-center gap-2"><RadioGroupItem value="M" id="m" /><Label htmlFor="m">Masculino</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="F" id="f" /><Label htmlFor="f">Feminino</Label></div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Peso (kg)</Label><Input type="number" value={data.weight} onChange={(e) => update("weight", e.target.value)} placeholder="80" className="mt-1" /></div>
                <div><Label>Altura (cm)</Label><Input type="number" value={data.height} onChange={(e) => update("height", e.target.value)} placeholder="175" className="mt-1" /></div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Objetivo & Nível</h2>
              <div>
                <Label>Objetivo principal</Label>
                <RadioGroup value={data.goal} onValueChange={(v) => update("goal", v)} className="mt-2 space-y-2">
                  {GOALS.map((g) => (
                    <div key={g} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={g} id={g} /><Label htmlFor={g} className="flex-1 cursor-pointer">{g}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Nível de atividade</Label>
                <Select value={data.activityLevel} onValueChange={(v) => update("activityLevel", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ACTIVITY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experiência com treino</Label>
                <RadioGroup value={data.experience} onValueChange={(v) => update("experience", v)} className="mt-2 space-y-2">
                  {EXPERIENCE_LEVELS.map((l) => (
                    <div key={l} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={l} id={l} /><Label htmlFor={l} className="flex-1 cursor-pointer">{l}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Treino</h2>
              <div>
                <Label>Dias de treino por semana</Label>
                <RadioGroup value={data.trainingDays} onValueChange={(v) => update("trainingDays", v)} className="flex gap-2 mt-2">
                  {TRAINING_DAYS.map((d) => (
                    <div key={d} className="flex items-center gap-1">
                      <RadioGroupItem value={d} id={`d${d}`} /><Label htmlFor={`d${d}`}>{d}x</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Tipo de academia</Label>
                <RadioGroup value={data.gymType} onValueChange={(v) => update("gymType", v)} className="mt-2 space-y-2">
                  {GYM_TYPES.map((g) => (
                    <div key={g} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={g} id={g} /><Label htmlFor={g} className="flex-1 cursor-pointer">{g}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Lesões ou dores</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {INJURY_OPTIONS.map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox checked={data.injuries.includes(i)} onCheckedChange={() => toggleArrayItem("injuries", i)} id={`inj-${i}`} />
                      <Label htmlFor={`inj-${i}`} className="cursor-pointer">{i}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Alimentação</h2>
              <div>
                <Label>Alimentos que você gosta</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FOOD_OPTIONS.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Checkbox checked={data.foodsLike.includes(f)} onCheckedChange={() => toggleArrayItem("foodsLike", f)} id={`food-${f}`} />
                      <Label htmlFor={`food-${f}`} className="cursor-pointer">{f}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Alimentos que não gosta</Label>
                <Textarea value={data.foodsDislike} onChange={(e) => update("foodsDislike", e.target.value)} placeholder="Liste os alimentos..." className="mt-1" />
              </div>
              <div>
                <Label>Alergias ou restrições</Label>
                <Input value={data.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="Ex: lactose, glúten" className="mt-1" />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Estilo de Vida</h2>
              <div>
                <Label>NEAT (rotina diária)</Label>
                <RadioGroup value={data.neat} onValueChange={(v) => update("neat", v)} className="mt-2 space-y-2">
                  {NEAT_OPTIONS.map((n) => (
                    <div key={n} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={n} id={n} /><Label htmlFor={n} className="flex-1 cursor-pointer">{n}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Horas de sono por noite</Label>
                <Input type="number" value={data.sleepHours} onChange={(e) => update("sleepHours", e.target.value)} placeholder="7" className="mt-1" />
              </div>
              <div>
                <Label>Nível de estresse</Label>
                <RadioGroup value={data.stressLevel} onValueChange={(v) => update("stressLevel", v)} className="flex gap-3 mt-2 flex-wrap">
                  {STRESS_LEVELS.map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <RadioGroupItem value={s} id={s} /><Label htmlFor={s}>{s}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && <Button variant="outline" onClick={prev} className="flex-1">Voltar</Button>}
          <Button onClick={next} className="flex-1 glow">
            {step === STEPS.length - 1 ? "Finalizar" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
