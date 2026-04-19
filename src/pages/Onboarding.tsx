import { useState, useEffect } from "react";
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
import { ProtocolConfirmation, type ProtocolConfirmations, isConfirmationComplete } from "@/components/onboarding/ProtocolConfirmation";
import type { Profile } from "@/hooks/useProfile";

const STEPS = [
  "Dados Pessoais",
  "Objetivo & Nível",
  "Treino",
  "Cardio",
  "Alimentação",
  "Doces & Suplementos",
  "Estilo de Vida",
  "Avaliação Física",
  "Confirmação",
];

const CARDIO_FREQUENCY = ["1x por semana", "2x por semana", "3x por semana", "4x por semana", "5x por semana", "Todos os dias"];
const CARDIO_DURATION = ["10-15 min", "15-20 min", "20-30 min", "30-45 min", "45-60 min"];
const CARDIO_TIMING = ["Logo após o treino de musculação", "Em horário separado (manhã/noite)", "Em dias de descanso da musculação", "Tanto faz"];
const CARDIO_TYPE = ["LISS (caminhada/bike leve, baixa intensidade)", "HIIT (alta intensidade intervalado)", "Moderado contínuo (corrida/bike)", "Tanto faz — escolha o melhor para meu objetivo"];

const GOALS = ["Hipertrofia", "Emagrecimento", "Recomposição Corporal", "Saúde Geral"];
const ACTIVITY_LEVELS = ["Sedentário", "Levemente ativo", "Moderadamente ativo", "Muito ativo", "Extremamente ativo"];
const EXPERIENCE_LEVELS = ["Iniciante (0-6 meses)", "Intermediário (6m-2 anos)", "Avançado (2+ anos)"];
const GYM_TYPES = ["Academia completa", "Academia limitada", "Treino em casa"];
const TRAINING_DAYS = ["2", "3", "4", "5", "6"];
const TRAINING_TIMES = ["Manhã (antes das 10h)", "Meio-dia (10h-14h)", "Tarde (14h-18h)", "Noite (após 18h)"];
const NEAT_OPTIONS = ["Trabalho sentado", "Trabalho em pé", "Trabalho físico leve", "Trabalho físico pesado"];
const STRESS_LEVELS = ["Baixo", "Moderado", "Alto", "Muito alto"];
const MEAL_COUNTS = ["3", "4", "5", "6"];

const ALLERGY_OPTIONS = [
  "Intolerância à lactose",
  "Celíaco (glúten)",
  "Alergia a ovo",
  "Alergia a frutos do mar",
  "Alergia a proteína do soro do leite",
  "Não tenho alergias",
];

const SWEET_OPTIONS = ["Açaí", "Doce de leite", "Leite condensado", "Sucrilhos", "Chocolate", "Nenhum"];
const SUPPLEMENT_OPTIONS = ["Whey Protein", "Creatina", "Vitamina C", "Vitamina D", "Ômega 3", "Multivitamínico", "Nenhum"];

const FREE_MEAL_OPTIONS = [
  "Uma a cada 15 dias",
  "Uma por semana",
  "Duas por semana",
];

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

const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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
  trainingWeekdays: string[];
  trainingTime: string;
  experience: string;
  gymType: string;
  injuries: string;
  cardioEnabled: string; // "yes" | "no"
  cardioFrequency: string;
  cardioDuration: string;
  cardioTiming: string;
  cardioTypePreference: string;
  foodsLike: string[];
  foodsDislike: string;
  allergies: string[];
  sweetPreference: string;
  supplements: string[];
  freeMeals: string;
  mealCount: string;
  sleepHours: string;
  stressLevel: string;
  aiDataConsent: boolean;
}

const STORAGE_KEY = "hypertrophy:onboarding:v1";

const DEFAULT_FORM: FormData = {
  fullName: "", age: "", sex: "", weight: "", height: "",
  goal: "", activityLevel: "", neat: "", trainingDays: "", trainingWeekdays: [], trainingTime: "",
  experience: "", gymType: "", injuries: "",
  cardioEnabled: "", cardioFrequency: "", cardioDuration: "", cardioTiming: "", cardioTypePreference: "",
  foodsLike: [],
  foodsDislike: "", allergies: [], sweetPreference: "", supplements: [],
  freeMeals: "", mealCount: "", sleepHours: "", stressLevel: "",
  aiDataConsent: false,
};

const DEFAULT_CONFIRMATIONS: ProtocolConfirmations = {
  bodyEmphasis: { wants: "", description: "" },
  split: { agree: "", justification: "" },
  cardio: { agree: "", justification: "" },
  mealTimes: { agree: "", justification: "" },
};

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const Onboarding = () => {
  const persisted = typeof window !== "undefined" ? loadPersisted() : null;
  const [step, setStep] = useState<number>(persisted?.step ?? 0);
  const [saving, setSaving] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0); // seconds
  const [genStage, setGenStage] = useState("");
  const [assessmentPhotos, setAssessmentPhotos] = useState<Record<string, string>>(persisted?.assessmentPhotos ?? {});
  const [assessment, setAssessment] = useState<any>(persisted?.assessment ?? null);
  const [analyzing, setAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [confirmations, setConfirmations] = useState<ProtocolConfirmations>(
    persisted?.confirmations ?? DEFAULT_CONFIRMATIONS,
  );
  const [data, setData] = useState<FormData>(
    persisted?.data ? { ...DEFAULT_FORM, ...persisted.data } : DEFAULT_FORM,
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  const createProtocol = useCreateProtocol();

  const { user } = useAuth();
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Load cloud draft on mount (so user can resume from another device)
  useEffect(() => {
    if (!user) { setCloudLoaded(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: row } = await supabase
          .from("onboarding_drafts")
          .select("data, updated_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled || !row?.data) return;
        const cloud = row.data as any;
        const local = persisted;
        // Prefer cloud unless local has more progress (higher step)
        const useCloud = !local || (cloud.step ?? 0) > (local.step ?? 0);
        if (useCloud) {
          if (typeof cloud.step === "number") setStep(cloud.step);
          if (cloud.data) setData({ ...DEFAULT_FORM, ...cloud.data });
          if (cloud.assessmentPhotos) setAssessmentPhotos(cloud.assessmentPhotos);
          if (cloud.assessment) setAssessment(cloud.assessment);
          if (cloud.confirmations) setConfirmations(cloud.confirmations);
        }
      } catch (e) {
        console.warn("Failed to load cloud onboarding draft", e);
      } finally {
        if (!cancelled) setCloudLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-save the entire onboarding state on every change so the user never loses progress
  useEffect(() => {
    const payload = { step, data, assessmentPhotos, assessment, confirmations };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode errors
    }
    // Debounced cloud sync (only after initial cloud load to avoid overwriting it)
    if (!user || !cloudLoaded) return;
    const t = setTimeout(() => {
      supabase
        .from("onboarding_drafts")
        .upsert(
          { user_id: user.id, data: payload as any, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        )
        .then(({ error }) => {
          if (error) console.warn("Cloud draft sync failed", error);
        });
    }, 800);
    return () => clearTimeout(t);
  }, [step, data, assessmentPhotos, assessment, confirmations, user?.id, cloudLoaded]);

  // Real elapsed timer (up to 4 min) — IA analisa avaliação + lesões antes de prescrever
  const TARGET_SECONDS = 240;
  useEffect(() => {
    if (!saving) return;
    setGenElapsed(0);
    setGenStage("Analisando seu perfil e avaliação corporal...");
    const stages: { at: number; label: string }[] = [
      { at: 20, label: "Identificando lesões e desvios posturais..." },
      { at: 50, label: "Selecionando exercícios seguros e adequados..." },
      { at: 90, label: "Priorizando seus pontos fracos..." },
      { at: 130, label: "Calculando macros e montando refeições..." },
      { at: 180, label: "Refinando combinações e substituições..." },
      { at: 220, label: "Finalizando seu protocolo personalizado..." },
    ];
    const t0 = Date.now();
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - t0) / 1000);
      setGenElapsed(sec);
      const cur = [...stages].reverse().find((s) => sec >= s.at);
      if (cur) setGenStage(cur.label);
    }, 1000);
    return () => clearInterval(id);
  }, [saving]);

  const update = (field: keyof FormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setValidationError("");
  };

  const toggleArrayItem = (field: "foodsLike" | "allergies" | "supplements" | "trainingWeekdays", item: string) => {
    setValidationError("");
    setData((prev) => {
      const arr = prev[field] as string[];
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

  // Validation per step
  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!data.fullName.trim()) return "Preencha seu nome completo.";
        if (!data.age) return "Informe sua idade.";
        if (!data.sex) return "Selecione seu sexo.";
        if (!data.weight) return "Informe seu peso.";
        if (!data.height) return "Informe sua altura.";
        return null;
      case 1:
        if (!data.goal) return "Selecione seu objetivo.";
        if (!data.activityLevel) return "Selecione seu nível de atividade.";
        if (!data.experience) return "Selecione sua experiência com treino.";
        return null;
      case 2:
        if (!data.trainingDays) return "Selecione os dias de treino.";
        if (data.trainingWeekdays.length === 0) return "Selecione quais dias da semana você vai treinar.";
        if (data.trainingWeekdays.length !== parseInt(data.trainingDays)) return `Selecione exatamente ${data.trainingDays} dias da semana.`;
        if (!data.trainingTime) return "Selecione o horário de treino.";
        if (!data.gymType) return "Selecione o tipo de academia.";
        return null;
      case 3:
        if (!data.cardioEnabled) return "Indique se deseja incluir cardio.";
        if (data.cardioEnabled === "yes") {
          if (!data.cardioFrequency) return "Selecione a frequência do cardio.";
          if (!data.cardioDuration) return "Selecione a duração do cardio.";
          if (!data.cardioTiming) return "Selecione quando você vai fazer cardio.";
          if (!data.cardioTypePreference) return "Selecione o tipo de cardio preferido.";
        }
        return null;
      case 4:
        if (!data.mealCount) return "Selecione quantas refeições por dia.";
        if (data.foodsLike.length === 0) return "Selecione ao menos 5 alimentos que gosta.";
        if (data.foodsLike.length < 5) return "Selecione ao menos 5 alimentos que gosta.";
        if (data.allergies.length === 0) return "Selecione suas alergias ou marque 'Não tenho alergias'.";
        if (!data.freeMeals) return "Selecione a frequência de refeições livres.";
        return null;
      case 5:
        if (!data.sweetPreference) return "Selecione uma opção de doce ou 'Nenhum'.";
        if (data.supplements.length === 0) return "Selecione suplementos ou marque 'Nenhum'.";
        return null;
      case 6:
        if (!data.neat) return "Selecione sua rotina diária (NEAT).";
        if (!data.sleepHours) return "Informe suas horas de sono.";
        if (!data.stressLevel) return "Selecione seu nível de estresse.";
        return null;
      case 7:
        if (!data.aiDataConsent) return "Você precisa autorizar o uso dos seus dados pela IA para gerar o protocolo personalizado.";
        if (Object.keys(assessmentPhotos).length === 0) return "Envie pelo menos uma foto para análise corporal.";
        if (!assessment) return "Aguarde a análise das suas fotos antes de continuar.";
        return null;
      case 8:
        if (!isConfirmationComplete(confirmations)) return "Responda todas as perguntas de confirmação (e justifique quando responder 'Não').";
        return null;
      default:
        return null;
    }
  };

  const runAssessment = async (): Promise<boolean> => {
    const photoPaths = Object.values(assessmentPhotos);
    if (photoPaths.length === 0) return false;
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
      return !!result;
    } catch (err: any) {
      toast({ title: "Erro na análise", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setAnalyzing(false);
    }
  };

  const next = async () => {
    // Validate current step
    const error = validateStep();
    if (error) {
      setValidationError(error);
      return;
    }

    // On step 7 (assessment), trigger analysis if photos exist and no assessment yet
    if (step === 7 && Object.keys(assessmentPhotos).length > 0 && !assessment && !analyzing) {
      const ok = await runAssessment();
      if (ok) {
        // Auto-advance to confirmation step right after a successful analysis
        setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
        setValidationError("");
      }
      return;
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setValidationError("");
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
        training_weekdays: data.trainingWeekdays,
        training_time: data.trainingTime,
        experience: data.experience,
        gym_type: data.gymType,
        injuries: data.injuries,
        cardio_enabled: data.cardioEnabled === "yes",
        cardio_frequency: data.cardioEnabled === "yes" ? data.cardioFrequency : null,
        cardio_duration: data.cardioEnabled === "yes" ? data.cardioDuration : null,
        cardio_timing: data.cardioEnabled === "yes" ? data.cardioTiming : null,
        cardio_type_preference: data.cardioEnabled === "yes" ? data.cardioTypePreference : null,
        ai_data_consent: data.aiDataConsent,
        ai_data_consent_at: data.aiDataConsent ? new Date().toISOString() : null,
        preferred_foods: data.foodsLike,
        disliked_foods: data.foodsDislike,
        allergies: data.allergies.filter(a => a !== "Não tenho alergias").join(", "),
        sweet_preference: data.sweetPreference === "Nenhum" ? null : data.sweetPreference,
        supplements: data.supplements.filter(s => s !== "Nenhum"),
        free_meals: data.freeMeals,
        meal_count: data.mealCount ? parseInt(data.mealCount) : null,
        sleep_hours: data.sleepHours ? parseFloat(data.sleepHours) : null,
        stress_level: data.stressLevel,
        body_emphasis: confirmations.bodyEmphasis.wants === "yes"
          ? confirmations.bodyEmphasis.description.trim() || null
          : null,
        onboarding_complete: true,
      };

      await updateProfile.mutateAsync(profileData);

      // Try AI-generated protocol first, fallback to rule-based
      let protocol: { training: any; diet: any };
      try {
        // Fetch latest body assessment if available
        let bodyAssessment = assessment;
        if (!bodyAssessment && user) {
          const { data: assessData } = await supabase
            .from("body_assessments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          bodyAssessment = assessData;
        }

        toast({ title: "🤖 Gerando protocolo com IA...", description: "Isso pode levar alguns segundos." });

        const { data: aiResult, error: aiError } = await supabase.functions.invoke("generate-protocol", {
          body: {
            profile: profileData,
            bodyAssessment,
            bodyEmphasis: profileData.body_emphasis,
            confirmations,
          },
        });

        if (aiError) throw aiError;
        if (aiResult?.fallback) throw new Error("Fallback requested");
        if (!aiResult?.training || !aiResult?.diet) throw new Error("Invalid AI response");

        protocol = { training: aiResult.training, diet: aiResult.diet };
        toast({ title: "✨ Protocolo personalizado gerado!", description: "Seu plano foi criado com inteligência artificial." });
      } catch (aiErr) {
        console.warn("AI protocol generation failed, using fallback:", aiErr);
        protocol = generateProtocol(profileData as Profile);
        toast({ title: "Protocolo gerado!", description: "Seu protocolo foi criado com sucesso." });
      }

      await createProtocol.mutateAsync(protocol);
      setGenStage("Pronto!");
      await new Promise((r) => setTimeout(r, 400));
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const prev = () => { step > 0 && setStep(step - 1); setValidationError(""); };
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
              <div><Label>Nome completo *</Label><Input value={data.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Seu nome" className="mt-1" /></div>
              <div><Label>Idade *</Label><Input type="number" value={data.age} onChange={(e) => update("age", e.target.value)} placeholder="25" className="mt-1" /></div>
              <div>
                <Label>Sexo *</Label>
                <RadioGroup value={data.sex} onValueChange={(v) => update("sex", v)} className="flex gap-4 mt-1">
                  <div className="flex items-center gap-2"><RadioGroupItem value="M" id="m" /><Label htmlFor="m">Masculino</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="F" id="f" /><Label htmlFor="f">Feminino</Label></div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Peso (kg) *</Label><Input type="number" value={data.weight} onChange={(e) => update("weight", e.target.value)} placeholder="80" className="mt-1" /></div>
                <div><Label>Altura (cm) *</Label><Input type="number" value={data.height} onChange={(e) => update("height", e.target.value)} placeholder="175" className="mt-1" /></div>
              </div>
            </>
          )}

          {/* STEP 1 — Objetivo & Nível */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Objetivo & Nível</h2>
              <div>
                <Label>Objetivo principal *</Label>
                <RadioGroup value={data.goal} onValueChange={(v) => update("goal", v)} className="mt-2 space-y-2">
                  {GOALS.map((g) => radioOption(g, g, g))}
                </RadioGroup>
              </div>
              <div>
                <Label>Nível de atividade *</Label>
                <Select value={data.activityLevel} onValueChange={(v) => update("activityLevel", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ACTIVITY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experiência com treino *</Label>
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
                <Label>Dias de treino por semana *</Label>
                <RadioGroup value={data.trainingDays} onValueChange={(v) => { update("trainingDays", v); setData(prev => ({ ...prev, trainingWeekdays: [] })); }} className="flex gap-2 mt-2">
                  {TRAINING_DAYS.map((d) => (
                    <div key={d} className="flex items-center gap-1"><RadioGroupItem value={d} id={`d${d}`} /><Label htmlFor={`d${d}`}>{d}x</Label></div>
                  ))}
                </RadioGroup>
              </div>
              {data.trainingDays && (
                <div>
                  <Label>Quais dias da semana? * (selecione {data.trainingDays})</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">A divisão do treino será montada respeitando o descanso muscular adequado.</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (!data.trainingWeekdays.includes(day) && data.trainingWeekdays.length >= parseInt(data.trainingDays)) return;
                          toggleArrayItem("trainingWeekdays", day);
                        }}
                      >
                        <Checkbox
                          checked={data.trainingWeekdays.includes(day)}
                          disabled={!data.trainingWeekdays.includes(day) && data.trainingWeekdays.length >= parseInt(data.trainingDays)}
                        />
                        <Label className="cursor-pointer">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Horário preferido de treino *</Label>
                <RadioGroup value={data.trainingTime} onValueChange={(v) => update("trainingTime", v)} className="mt-2 space-y-2">
                  {TRAINING_TIMES.map((t) => radioOption(t, `tt-${t}`, t))}
                </RadioGroup>
              </div>
              <div>
                <Label>Tipo de academia *</Label>
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

          {/* STEP 3 — Cardio */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Cardio</h2>
              <p className="text-sm text-muted-foreground">Conte suas preferências de cardio. O cardio será incluído junto com seus dias de treino.</p>

              <div>
                <Label>Você quer incluir cardio no protocolo? *</Label>
                <RadioGroup value={data.cardioEnabled} onValueChange={(v) => update("cardioEnabled", v)} className="mt-2 space-y-2">
                  {radioOption("yes", "cardio-yes", "Sim, quero incluir cardio")}
                  {radioOption("no", "cardio-no", "Não, só musculação por enquanto")}
                </RadioGroup>
              </div>

              {data.cardioEnabled === "yes" && (
                <>
                  <div>
                    <Label>Frequência semanal de cardio *</Label>
                    <RadioGroup value={data.cardioFrequency} onValueChange={(v) => update("cardioFrequency", v)} className="mt-2 space-y-2">
                      {CARDIO_FREQUENCY.map((f) => radioOption(f, `cf-${f}`, f))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Tempo disponível por sessão *</Label>
                    <RadioGroup value={data.cardioDuration} onValueChange={(v) => update("cardioDuration", v)} className="mt-2 space-y-2">
                      {CARDIO_DURATION.map((d) => radioOption(d, `cd-${d}`, d))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Quando você prefere fazer o cardio? *</Label>
                    <RadioGroup value={data.cardioTiming} onValueChange={(v) => update("cardioTiming", v)} className="mt-2 space-y-2">
                      {CARDIO_TIMING.map((t) => radioOption(t, `ct-${t}`, t))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Tipo de cardio preferido *</Label>
                    <RadioGroup value={data.cardioTypePreference} onValueChange={(v) => update("cardioTypePreference", v)} className="mt-2 space-y-2">
                      {CARDIO_TYPE.map((t) => radioOption(t, `ctp-${t}`, t))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 LISS = baixa intensidade contínua (ótimo para queima de gordura sem prejudicar a recuperação). HIIT = alta intensidade curta (eficiente em pouco tempo, demanda mais recuperação).
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 4 — Alimentação */}
          {step === 4 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Alimentação</h2>

              <div>
                <Label>Quantas refeições por dia? *</Label>
                <RadioGroup value={data.mealCount} onValueChange={(v) => update("mealCount", v)} className="flex gap-3 mt-2">
                  {MEAL_COUNTS.map((m) => (
                    <div key={m} className="flex items-center gap-1"><RadioGroupItem value={m} id={`mc-${m}`} /><Label htmlFor={`mc-${m}`}>{m}</Label></div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Alimentos que você gosta (marque ao menos 5) *</Label>
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
                <Label>Alergias ou intolerâncias *</Label>
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
                <Label>Refeições livres por semana *</Label>
                <RadioGroup value={data.freeMeals} onValueChange={(v) => update("freeMeals", v)} className="mt-2 space-y-2">
                  {FREE_MEAL_OPTIONS.map((fm) => radioOption(fm, `fm-${fm}`, fm))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* STEP 5 — Doces & Suplementos */}
          {step === 5 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Doces & Suplementos</h2>

              <div>
                <Label>Gostaria de incluir um doce no plano? (escolha apenas um) *</Label>
                <RadioGroup value={data.sweetPreference} onValueChange={(v) => update("sweetPreference", v)} className="mt-2 space-y-2">
                  {SWEET_OPTIONS.map((s) => radioOption(s, `sweet-${s}`, s))}
                </RadioGroup>
              </div>

              <div>
                <Label>Suplementos que usa ou pretende usar *</Label>
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

          {/* STEP 6 — Estilo de Vida */}
          {step === 6 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-foreground">Estilo de Vida</h2>
              <div>
                <Label>NEAT (rotina diária) *</Label>
                <RadioGroup value={data.neat} onValueChange={(v) => update("neat", v)} className="mt-2 space-y-2">
                  {NEAT_OPTIONS.map((n) => radioOption(n, `neat-${n}`, n))}
                </RadioGroup>
              </div>
              <div><Label>Horas de sono por noite *</Label><Input type="number" value={data.sleepHours} onChange={(e) => update("sleepHours", e.target.value)} placeholder="7" className="mt-1" /></div>
              <div>
                <Label>Nível de estresse *</Label>
                <RadioGroup value={data.stressLevel} onValueChange={(v) => update("stressLevel", v)} className="flex gap-3 mt-2 flex-wrap">
                  {STRESS_LEVELS.map((s) => (
                    <div key={s} className="flex items-center gap-1"><RadioGroupItem value={s} id={`stress-${s}`} /><Label htmlFor={`stress-${s}`}>{s}</Label></div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* STEP 7 — Avaliação Física + Consentimento LGPD */}
          {step === 7 && (
            <>
              <BodyPhotoUpload photos={assessmentPhotos} onPhotosChange={setAssessmentPhotos} />
              <AssessmentResults assessment={assessment} loading={analyzing} />

              {/* LGPD CONSENT */}
              <div className="mt-6 p-4 rounded-lg border border-primary/40 bg-primary/5 space-y-3">
                <h3 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
                  🔒 Autorização de uso dos seus dados pela IA
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para gerar seu protocolo personalizado, autorizo o uso dos meus dados pela IA, em conformidade com a LGPD.
                </p>
                <details className="group">
                  <summary className="cursor-pointer text-xs text-primary hover:underline list-none">
                    <span className="group-open:hidden">Ler termo completo →</span>
                    <span className="hidden group-open:inline">Ocultar termo ↑</span>
                  </summary>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    Para gerar seu protocolo personalizado de treino, dieta, cardio e acompanhamento, a inteligência artificial do Hypertrophy
                    precisa processar os dados que você forneceu (idade, peso, altura, objetivo, fotos da avaliação corporal, preferências
                    alimentares, rotina e respostas dos check-ins). <strong className="text-foreground">Em conformidade com a LGPD
                    (Lei nº 13.709/2018)</strong>, seus dados são tratados de forma confidencial, usados exclusivamente dentro do app para
                    personalizar seu acompanhamento, e você pode solicitar exclusão a qualquer momento.
                  </p>
                </details>
                <div
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setData((prev) => ({ ...prev, aiDataConsent: !prev.aiDataConsent }))}
                >
                  <Checkbox
                    checked={data.aiDataConsent}
                    onCheckedChange={(c) => setData((prev) => ({ ...prev, aiDataConsent: !!c }))}
                    id="ai-consent"
                    className="mt-0.5"
                  />
                  <Label htmlFor="ai-consent" className="cursor-pointer text-sm text-foreground leading-snug">
                    <strong>Autorizo</strong> o uso dos meus dados pela IA do Hypertrophy. *
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* STEP 8 — Confirmação do protocolo */}
          {step === 8 && (
            <ProtocolConfirmation
              sex={data.sex}
              trainingDays={parseInt(data.trainingDays) || 4}
              cardioEnabled={data.cardioEnabled === "yes"}
              cardioFrequency={data.cardioFrequency}
              cardioType={data.cardioTypePreference}
              cardioDuration={data.cardioDuration}
              mealCount={parseInt(data.mealCount) || 4}
              trainingTime={data.trainingTime}
              weakPoints={assessment?.weak_points}
              initial={confirmations}
              onChange={setConfirmations}
            />
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="max-w-lg mx-auto">
          {validationError && (
            <p className="text-destructive text-sm mb-2 text-center">{validationError}</p>
          )}
          <div className="flex gap-3">
            {step > 0 && <Button variant="outline" onClick={prev} className="flex-1" disabled={saving || analyzing}>Voltar</Button>}
            <Button onClick={next} className="flex-1 glow" disabled={saving || analyzing}>
              {saving ? "🤖 Gerando protocolo com IA..." : analyzing ? "Analisando suas fotos..." : step === 7 && Object.keys(assessmentPhotos).length > 0 && !assessment ? "Analisar e gerar protocolo" : step === STEPS.length - 1 ? "Finalizar e gerar protocolo" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>

      {analyzing && !saving && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="text-5xl animate-pulse">📸</div>
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-1">Analisando suas fotos</h3>
              <p className="text-sm text-muted-foreground">A IA está avaliando composição corporal, postura e pontos fortes/fracos…</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Isso normalmente leva 20–60 segundos. Mantenha esta tela aberta.
            </p>
          </div>
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="text-5xl animate-pulse">🤖</div>
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-1">Gerando seu protocolo</h3>
              <p className="text-sm text-muted-foreground">{genStage}</p>
            </div>
            <div className="space-y-2">
              <Progress value={Math.min(100, (genElapsed / TARGET_SECONDS) * 100)} className="h-3" />
              <p className="text-3xl font-bold text-primary font-heading tabular-nums">
                {String(Math.floor(genElapsed / 60)).padStart(2, "0")}:{String(genElapsed % 60).padStart(2, "0")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tempo estimado: até 4 minutos (análise detalhada da sua avaliação)
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Mantenha esta tela aberta enquanto montamos seu treino e dieta personalizados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
