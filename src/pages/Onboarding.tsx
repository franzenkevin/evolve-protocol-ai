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
import { useUpdateProfile } from "@/hooks/useProfile";
import { useCreateProtocol } from "@/hooks/useProtocol";
import { generateProtocol } from "@/lib/generateProtocol";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BodyPhotoUpload } from "@/components/onboarding/BodyPhotoUpload";
import { AssessmentResults } from "@/components/onboarding/AssessmentResults";
import type { Profile } from "@/hooks/useProfile";

const STEPS = [
  "Dados Pessoais",
  "Objetivo & Nível",
  "Treino",
  "Alimentação",
  "Doces & Suplementos",
  "Estilo de Vida",
  "Avaliação Física",
];

const GOALS = ["Hipertrofia", "Emagrecimento", "Recomposição Corporal", "Saúde Geral"];
const ACTIVITY_LEVELS = ["Sedentário", "Levemente ativo", "Moderadamente ativo", "Muito ativo", "Extremamente ativo"];
const EXPERIENCE_LEVELS = ["Iniciante (0-6 meses)", "Intermediário (6m-2 anos)", "Avançado (2+ anos)"];
const GYM_TYPES = ["Academia completa", "Academia limitada", "Treino em casa"];
const TRAINING_DAYS = ["2", "3", "4", "5", "6"];
const TRAINING_TIMES = ["Manhã (antes das 10h)", "Meio-dia (10h-14h)", "Tarde (14h-18h)", "Noite (após 18h)"];
const NEAT_OPTIONS = ["Trabalho sentado", "Trabalho em pé", "Trabalho físico leve", "Trabalho físico pesado"];
const STRESS_LEVELS = ["Baixo", "Moderado", "Alto", "Muito alto"];
const MEAL_COUNTS = ["3", "4", "5", "6"];

// Alergias em lista
const ALLERGY_OPTIONS = [
  "Intolerância à lactose",
  "Celíaco (glúten)",
  "Alergia a ovo",
  "Alergia a frutos do mar",
  "Alergia a proteína do soro do leite",
  "Não tenho alergias",
];

// Doces — apenas 1
const SWEET_OPTIONS = ["Açaí", "Doce de leite", "Leite condensado", "Sucrilhos", "Chocolate", "Nenhum"];

// Suplementos
const SUPPLEMENT_OPTIONS = ["Whey Protein", "Creatina", "Vitamina C", "Vitamina D", "Ômega 3", "Multivitamínico", "Nenhum"];

// Refeições livres
const FREE_MEAL_OPTIONS = [
  "Uma a cada 15 dias",
  "Uma por semana",
  "Duas por semana",
];

// Alimentos em lista organizada
const FOOD_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "🍚 Carboidratos",
    items: ["Arroz", "Macarrão", "Batata inglesa", "Batata doce", "Mandioca", "Pão de forma", "Pão francês", "Pão de hambúrguer", "Rap10", "Cuscuz", "Tapioca", "Inhame", "Milho"],
  },
  {
    label: "🍌 Frutas",
    items: ["Banana", "Mamão", "Melão", "Melancia", "Kiwi", "Uva", "Manga", "Abacate", "Laranja", "Limão", "Morango", "Maçã", "Pera", "Abacaxi", "Goiaba", "Ameixa", "Pêssego"],
  },
  {
    label: "🥩 Proteínas",
    items: ["Peito de frango", "Sobrecoxa sem pele", "Patinho", "Músculo", "Filé mignon", "Coxão mole", "Salmão", "Tilápia", "Atum", "Ovo", "Queijo", "Leite desnatado", "Leite semi desnatado", "Sardinha", "Camarão", "Carne de porco magra"],
  },
  {
    label: "🥗 Outros",
    items: ["Feijão", "Lentilha", "Granola", "Aveia", "Iogurte desnatado", "Requeijão light", "Vegetais e saladas em geral", "Grão de bico", "Pasta de amendoim", "Castanhas", "Azeite de oliva"],
  },
];

interface FormData {
  fullName: string;
  age: string;
  sex: string;
  weight: string;
  height: string;
  goal: string;
  activityLevel: string;
  neat: string;
  trainingDays: string;
  trainingTime: string;
  experience: string;
  gymType: string;
  injuries: string;
  foodsLike: string[];
  foodsDislike: string;
  allergies: string[];
  sweetPreference: string;
  supplements: string[];
  freeMeals: string;
  mealCount: string;
  sleepHours: string;
  stressLevel: string;
}

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [assessmentPhotos, setAssessmentPhotos] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<FormData>({
    fullName: "", age: "", sex: "", weight: "", height: "",
    goal: "", activityLevel: "", neat: "", trainingDays: "", trainingTime: "",
    experience: "", gymType: "", injuries: "", foodsLike: [],
    foodsDislike: "", allergies: [], sweetPreference: "", supplements: [],
    freeMeals: "", mealCount: "", sleepHours: "", stressLevel: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const createProtocol = useCreateProtocol();

  const update = (field: keyof FormData, value: any) => setData((prev) => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field: "foodsLike" | "allergies" | "supplements", item: string) => {
    setData((prev) => {
      const arr = prev[field] as string[];
      // Handle "Não tenho alergias" / "Nenhum" exclusive
      if (field === "allergies" && item === "Não tenho alergias") {
        return { ...prev, [field]: arr.includes(item) ? [] : [item] };
      }
      if (field === "allergies" && arr.includes("Não tenho alergias")) {
        return { ...prev, [field]: [item] };
      }
      if (field === "supplements" && item === "Nenhum") {
        return { ...prev, [field]: arr.includes(item) ? [] : [item] };
      }
      if (field === "supplements" && arr.includes("Nenhum")) {
        return { ...prev, [field]: [item] };
      }
      return { ...prev, [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] };
    });
  };

  const { user } = useAuth();

  const runAssessment = async () => {
    const photoPaths = Object.values(assessmentPhotos);
    if (photoPaths.length === 0) return;
    setAnalyzing(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("analyze-body", {
        body: {
          photoPaths,
          sex: data.sex,
          weight: data.weight,
          height: data.height,
          age: data.age,
        },
      });
      if (error) throw error;
      const result = fnData.assessment;
      setAssessment(result);

      // Save to database
      if (user && result) {
        await supabase.from("body_assessments").insert({
          user_id: user.id,
          photo_paths: photoPaths,
          body_fat_estimate: result.body_fat_estimate || null,
          body_fat_category: result.body_fat_category || null,
          posture_deviations: result.posture_deviations || [],
          strong_points: result.strong_points || [],
          weak_points: result.weak_points || [],
          muscle_development: result.muscle_development || {},
          recommendations: result.recommendations || [],
          overall_summary: result.overall_summary || null,
        });
      }
    } catch (err: any) {
      toast({ title: "Erro na análise", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const next = async () => {
    // On step 6 (assessment), trigger analysis if photos exist and no assessment yet
    if (step === 6 && Object.keys(assessmentPhotos).length > 0 && !assessment && !analyzing) {
      await runAssessment();
      return;
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    try {
      const profileData: Partial<Profile> = {
        full_name: data.fullName,
        age: data.age ? parseInt(data.age) : null,
        sex: data.sex,
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        goal: data.goal,
        activity_level: data.activityLevel,
        neat: data.neat,
        training_days: data.trainingDays ? parseInt(data.trainingDays) : null,
        training_time: data.trainingTime,
        experience: data.experience,
        gym_type: data.gymType,
        injuries: data.injuries,
        preferred_foods: data.foodsLike,
        disliked_foods: data.foodsDislike,
        allergies: data.allergies.filter(a => a !== "Não tenho alergias").join(", "),
        sweet_preference: data.sweetPreference === "Nenhum" ? null : data.sweetPreference,
        supplements: data.supplements.filter(s => s !== "Nenhum"),
        free_meals: data.freeMeals,
        meal_count: data.mealCount ? parseInt(data.mealCount) : null,
        sleep_hours: data.sleepHours ? parseFloat(data.sleepHours) : null,
        stress_level: data.stressLevel,
        onboarding_complete: true,
      };

      await updateProfile.mutateAsync(profileData);

      const protocol = generateProtocol(profileData as Profile);
      await createProtocol.mutateAsync(protocol);

      toast({ title: "Onboarding completo!", description: "Seu protocolo foi gerado com sucesso." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const prev = () => step > 0 && setStep(step - 1);
  const progress = ((step + 1) / STEPS.length) * 100;

  const radioOption = (value: string, id: string, label: string) => (
    <div key={id} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="flex-1 cursor-pointer">{label}</Label>
    </div>
  );

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

          {/* STEP 0 — Dados Pessoais */}
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

          {/* STEP 1 — Objetivo & Nível */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Objetivo & Nível</h2>
              <div>
                <Label>Objetivo principal</Label>
                <RadioGroup value={data.goal} onValueChange={(v) => update("goal", v)} className="mt-2 space-y-2">
                  {GOALS.map((g) => radioOption(g, g, g))}
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
                  {EXPERIENCE_LEVELS.map((l) => radioOption(l, l, l))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* STEP 2 — Treino */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Treino</h2>
              <div>
                <Label>Dias de treino por semana</Label>
                <RadioGroup value={data.trainingDays} onValueChange={(v) => update("trainingDays", v)} className="flex gap-2 mt-2">
                  {TRAINING_DAYS.map((d) => (
                    <div key={d} className="flex items-center gap-1"><RadioGroupItem value={d} id={`d${d}`} /><Label htmlFor={`d${d}`}>{d}x</Label></div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label>Horário preferido de treino</Label>
                <RadioGroup value={data.trainingTime} onValueChange={(v) => update("trainingTime", v)} className="mt-2 space-y-2">
                  {TRAINING_TIMES.map((t) => radioOption(t, `tt-${t}`, t))}
                </RadioGroup>
              </div>
              <div>
                <Label>Tipo de academia</Label>
                <RadioGroup value={data.gymType} onValueChange={(v) => update("gymType", v)} className="mt-2 space-y-2">
                  {GYM_TYPES.map((g) => radioOption(g, `gym-${g}`, g))}
                </RadioGroup>
              </div>
              <div>
                <Label>Lesões, dores ou limitações</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">Descreva com detalhes para que o treino seja adaptado.</p>
                <Textarea
                  value={data.injuries}
                  onChange={(e) => update("injuries", e.target.value)}
                  placeholder="Ex: Dor no ombro direito ao fazer supino, hérnia de disco L4-L5, tendinite no joelho esquerdo..."
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}

          {/* STEP 3 — Alimentação */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Alimentação</h2>

              <div>
                <Label>Quantas refeições por dia?</Label>
                <RadioGroup value={data.mealCount} onValueChange={(v) => update("mealCount", v)} className="flex gap-3 mt-2">
                  {MEAL_COUNTS.map((m) => (
                    <div key={m} className="flex items-center gap-1"><RadioGroupItem value={m} id={`mc-${m}`} /><Label htmlFor={`mc-${m}`}>{m}</Label></div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Alimentos que você gosta (marque todos)</Label>
                {FOOD_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="mt-3">
                    <p className="text-xs font-semibold text-primary mb-1.5">{cat.label}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cat.items.map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <Checkbox checked={data.foodsLike.includes(f)} onCheckedChange={() => toggleArrayItem("foodsLike", f)} id={`food-${f}`} />
                          <Label htmlFor={`food-${f}`} className="cursor-pointer text-sm">{f}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label>Alimentos que NÃO gosta</Label>
                <Textarea value={data.foodsDislike} onChange={(e) => update("foodsDislike", e.target.value)} placeholder="Liste os alimentos que não gosta..." className="mt-1" />
              </div>

              <div>
                <Label>Alergias ou intolerâncias</Label>
                <div className="mt-2 space-y-2">
                  {ALLERGY_OPTIONS.map((a) => (
                    <div key={a} className="flex items-center gap-2">
                      <Checkbox checked={data.allergies.includes(a)} onCheckedChange={() => toggleArrayItem("allergies", a)} id={`allergy-${a}`} />
                      <Label htmlFor={`allergy-${a}`} className="cursor-pointer text-sm">{a}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Refeições livres por semana</Label>
                <RadioGroup value={data.freeMeals} onValueChange={(v) => update("freeMeals", v)} className="mt-2 space-y-2">
                  {FREE_MEAL_OPTIONS.map((fm) => radioOption(fm, `fm-${fm}`, fm))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* STEP 4 — Doces & Suplementos */}
          {step === 4 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Doces & Suplementos</h2>

              <div>
                <Label>Gostaria de incluir um doce no plano? (escolha apenas um)</Label>
                <RadioGroup value={data.sweetPreference} onValueChange={(v) => update("sweetPreference", v)} className="mt-2 space-y-2">
                  {SWEET_OPTIONS.map((s) => radioOption(s, `sweet-${s}`, s))}
                </RadioGroup>
              </div>

              <div>
                <Label>Suplementos que usa ou pretende usar</Label>
                <div className="mt-2 space-y-2">
                  {SUPPLEMENT_OPTIONS.map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <Checkbox checked={data.supplements.includes(s)} onCheckedChange={() => toggleArrayItem("supplements", s)} id={`supp-${s}`} />
                      <Label htmlFor={`supp-${s}`} className="cursor-pointer text-sm">{s}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  💡 Estes são suplementos básicos. Para protocolos avançados (hormonal, etc.), faça seus exames e adquira a análise completa.
                </p>
              </div>
            </>
          )}

          {/* STEP 5 — Estilo de Vida */}
          {step === 5 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Estilo de Vida</h2>
              <div>
                <Label>NEAT (rotina diária)</Label>
                <RadioGroup value={data.neat} onValueChange={(v) => update("neat", v)} className="mt-2 space-y-2">
                  {NEAT_OPTIONS.map((n) => radioOption(n, `neat-${n}`, n))}
                </RadioGroup>
              </div>
              <div><Label>Horas de sono por noite</Label><Input type="number" value={data.sleepHours} onChange={(e) => update("sleepHours", e.target.value)} placeholder="7" className="mt-1" /></div>
              <div>
                <Label>Nível de estresse</Label>
                <RadioGroup value={data.stressLevel} onValueChange={(v) => update("stressLevel", v)} className="flex gap-3 mt-2 flex-wrap">
                  {STRESS_LEVELS.map((s) => (
                    <div key={s} className="flex items-center gap-1"><RadioGroupItem value={s} id={`stress-${s}`} /><Label htmlFor={`stress-${s}`}>{s}</Label></div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* STEP 6 — Avaliação Física */}
          {step === 6 && (
            <>
              <BodyPhotoUpload photos={assessmentPhotos} onPhotosChange={setAssessmentPhotos} />
              <AssessmentResults assessment={assessment} loading={analyzing} />
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && <Button variant="outline" onClick={prev} className="flex-1" disabled={saving || analyzing}>Voltar</Button>}
          <Button onClick={next} className="flex-1 glow" disabled={saving || analyzing}>
            {saving ? "Salvando..." : analyzing ? "Analisando..." : step === 6 && Object.keys(assessmentPhotos).length > 0 && !assessment ? "Analisar Fotos" : step === STEPS.length - 1 ? "Finalizar" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
