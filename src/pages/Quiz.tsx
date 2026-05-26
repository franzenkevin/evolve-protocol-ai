import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Upload, X, Sparkles, ShieldCheck, Star, Brain, Target, Dumbbell, Apple, Camera, Calendar as CalendarIcon, MessageCircle, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import QuizShell from "@/components/quiz/QuizShell";
import { quizSteps, TOTAL_QUIZ_STEPS, SPLITS_BY_GENDER, type QuizStep } from "@/lib/quizSteps";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Imagens body fat (slider visual)
import maleBF5 from "@/assets/bodyfat/male-5.png";
import maleBF10 from "@/assets/bodyfat/male-10.png";
import maleBF15 from "@/assets/bodyfat/male-15.png";
import maleBF20 from "@/assets/bodyfat/male-20.png";
import maleBF25 from "@/assets/bodyfat/male-25.png";
import maleBF35 from "@/assets/bodyfat/male-35.png";
import femaleBF18 from "@/assets/bodyfat/female-18.png";
import femaleBF22 from "@/assets/bodyfat/female-22.png";
import femaleBF27 from "@/assets/bodyfat/female-27.png";
import femaleBF32 from "@/assets/bodyfat/female-32.png";
import femaleBF37 from "@/assets/bodyfat/female-37.png";
import femaleBF42 from "@/assets/bodyfat/female-42.png";
// Gênero
import genderMale from "@/assets/quiz/gender-male.jpg";
import genderFemale from "@/assets/quiz/gender-female.jpg";
// Forma atual (reaproveita imagens BF)
// Forma alvo (3 opções por gênero — novas fotos)
import targetMaleLean from "@/assets/quiz/target-male-lean.jpg";
import targetMaleAthletic from "@/assets/quiz/target-male-athletic.jpg";
import targetMaleBodybuilder from "@/assets/quiz/target-male-bodybuilder.jpg";
import targetFemaleSlim from "@/assets/quiz/target-female-slim.jpg";
import targetFemaleVolume from "@/assets/quiz/target-female-volume.jpg";
import targetFemaleBodybuilder from "@/assets/quiz/target-female-bodybuilder.jpg";

type Phase =
  | { kind: "quiz"; index: number }
  | { kind: "loading" }
  | { kind: "preview" }
  | { kind: "physique-intro" }
  | { kind: "physique-upload" }
  | { kind: "physique-analyzing" }
  | { kind: "physique-result" }
  | { kind: "plans" }
  | { kind: "guarantee" };

const STORAGE_KEY = "evoria_quiz_v1";
const PHASE_KEY = "evoria_quiz_phase_v1";

const SOCIAL_PROOF_LINES = [
  "Calibrando proporção de macro nutrientes…",
  "Cruzando dados de treino, recuperação e rotina…",
  "Aplicando regras do Método Franzen…",
  "Projetando curva de progresso de 4 semanas…",
  "Quase lá — montando sua prévia…",
];

// Forma corporal ATUAL (4 opções por gênero — usam imagens BF como referência)
const BODY_SHAPES_BY_GENDER: Record<string, { value: string; label: string; img: string }[]> = {
  male: [
    { value: "slim", label: "Magro", img: maleBF10 },
    { value: "average", label: "Médio", img: maleBF20 },
    { value: "soft", label: "Acima do peso", img: maleBF25 },
    { value: "obese", label: "Bem acima do peso", img: maleBF35 },
  ],
  female: [
    { value: "slim", label: "Magra", img: femaleBF18 },
    { value: "average", label: "Média", img: femaleBF27 },
    { value: "soft", label: "Acima do peso", img: femaleBF37 },
    { value: "obese", label: "Bem acima do peso", img: femaleBF42 },
  ],
};

// Forma corporal ALVO (3 opções por gênero, fotos dedicadas)
const TARGET_SHAPES_BY_GENDER: Record<string, { value: string; label: string; img: string }[]> = {
  male: [
    { value: "lean", label: "Magro", img: targetMaleLean },
    { value: "athletic", label: "Atlético", img: targetMaleAthletic },
    { value: "bodybuilder", label: "Fisiculturista", img: targetMaleBodybuilder },
  ],
  female: [
    { value: "slim", label: "Corpo slim", img: targetFemaleSlim },
    { value: "volume", label: "Volume proporcional", img: targetFemaleVolume },
    { value: "bodybuilder", label: "Fisiculturista", img: targetFemaleBodybuilder },
  ],
};

export default function Quiz() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      const raw = sessionStorage.getItem(PHASE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { kind: "quiz", index: 0 };
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [physiqueResult, setPhysiqueResult] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);
  useEffect(() => {
    sessionStorage.setItem(PHASE_KEY, JSON.stringify(phase));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase]);

  function setAnswer(id: string, value: any) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function next() {
    if (phase.kind === "quiz") {
      const nextIdx = phase.index + 1;
      // Fim do quiz → análise IA opcional ANTES de gerar a prévia
      if (nextIdx >= TOTAL_QUIZ_STEPS) setPhase({ kind: "physique-intro" });
      else setPhase({ kind: "quiz", index: nextIdx });
    }
  }
  function back() {
    if (phase.kind === "quiz" && phase.index > 0) setPhase({ kind: "quiz", index: phase.index - 1 });
    else if (phase.kind === "physique-intro") setPhase({ kind: "quiz", index: TOTAL_QUIZ_STEPS - 1 });
    else if (phase.kind === "physique-upload") setPhase({ kind: "physique-intro" });
    else if (phase.kind === "preview") setPhase({ kind: "physique-intro" });
    else if (phase.kind === "plans") setPhase({ kind: "preview" });
    else if (phase.kind === "guarantee") setPhase({ kind: "plans" });
    else navigate("/");
  }

  useEffect(() => {
    if (phase.kind === "loading") {
      const t = setTimeout(() => setPhase({ kind: "preview" }), 3800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  function goToSignup() {
    const params = new URLSearchParams();
    params.set("plan", selectedPlan);
    params.set("from", "quiz");
    // Marca para o Welcome saber que falta completar formulário pós-pagamento
    sessionStorage.setItem("evoria_quiz_complete", "1");
    navigate(`/signup?${params.toString()}`);
  }

  // ===== RENDER =====
  if (phase.kind === "quiz") {
    const step = quizSteps[phase.index];
    return (
      <QuizShell currentStep={phase.index} totalSteps={TOTAL_QUIZ_STEPS} onBack={back}>
        <StepRenderer step={step} value={answers[step.id]} allAnswers={answers} onChange={(v) => setAnswer(step.id, v)} onNext={next} />
        <StepFooter step={step} value={answers[step.id]} onNext={next} />
      </QuizShell>
    );
  }

  if (phase.kind === "loading") return <LoadingPhase />;

  if (phase.kind === "preview") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PreviewPhase answers={answers} physiqueResult={physiqueResult} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "plans" })}>
              Ver meu plano completo <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "physique-intro") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <div className="text-center pt-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
            <Camera className="text-primary" size={36} />
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary mb-4">NOVO · OPCIONAL</Badge>
          <h1 className="text-3xl font-heading font-bold leading-tight mb-3">
            Quer uma <span className="text-gradient">prévia da análise física</span> por IA?
          </h1>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Em segundos a IA lê 2-3 fotos suas e devolve uma leitura inicial de
            <strong className="text-foreground"> postura, simetria e pontos a desenvolver</strong>.
          </p>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5 space-y-2">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "physique-upload" })}>
              <Camera size={18} /> Fazer análise por IA
            </Button>
            <Button variant="ghost" size="lg" className="w-full h-12 text-muted-foreground" onClick={() => { setAnswers((a) => ({ ...a, physique_pending: true })); setPhase({ kind: "loading" }); }}>
              Pular essa etapa
            </Button>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "physique-upload") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PhotoUpload photos={photos} setPhotos={setPhotos} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5 space-y-2">
            <Button
              size="lg"
              disabled={photos.length === 0}
              className="w-full h-14 text-base font-semibold gap-2 glow"
              onClick={async () => {
                setPhase({ kind: "physique-analyzing" });
                try {
                  const b64Photos = await Promise.all(photos.map((f) => compressImage(f, 1024, 0.78)));
                  const { data, error } = await supabase.functions.invoke("analyze-physique", {
                    body: { photos: b64Photos, context: answers },
                  });
                  if (error) throw error;
                  if (data?.error) throw new Error(data.error);
                  setPhysiqueResult(data);
                  setPhase({ kind: "loading" });
                } catch (e: any) {
                  console.error("[quiz] physique error", e);
                  toast.error("Não foi possível concluir a análise agora. Você poderá enviar suas fotos depois, no app.");
                  setAnswers((a) => ({ ...a, physique_pending: true }));
                  setPhase({ kind: "loading" });
                }
              }}
            >
              Analisar minhas fotos <ArrowRight size={18} />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full h-12 text-muted-foreground"
              onClick={() => {
                setAnswers((a) => ({ ...a, physique_pending: true }));
                setPhase({ kind: "loading" });
              }}
            >
              Enviar depois no app
            </Button>
            <p className="text-[11px] text-muted-foreground/80 text-center px-4">
              Essa análise é <span className="text-primary">essencial</span> para personalizar seu protocolo. Você pode enviar agora ou direto no app após o cadastro.
            </p>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "physique-analyzing") return <AnalyzingPhase />;

  if (phase.kind === "physique-result") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PhysiqueResult result={physiqueResult} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "plans" })}>
              Ver meu plano completo <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "plans") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PlansPhase selected={selectedPlan} onSelect={setSelectedPlan} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "guarantee" })}>
              Continuar <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "guarantee") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <GuaranteePhase />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={goToSignup}>
              Criar minha conta e pagar <ArrowRight size={18} />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Garantia de 7 dias · Cancela quando quiser
            </p>
          </div>
        </div>
      </QuizShell>
    );
  }

  return null;
}

// ============== STEP RENDERER ==============

function StepRenderer({ step, value, allAnswers, onChange, onNext }: any) {
  if (step.type === "gender") return <GenderStep value={value} onChange={onChange} onNext={onNext} step={step} />;
  if (step.type === "choice") return <ChoiceStep step={step} value={value} onChange={onChange} onNext={onNext} allAnswers={allAnswers} />;
  // muscle-choice removido — não usamos mais priorização manual de músculos
  if (step.type === "slider") return <SliderStep step={step} value={value} onChange={onChange} />;
  if (step.type === "number") return <NumberStep step={step} value={value} onChange={onChange} allAnswers={allAnswers} />;
  if (step.type === "weight-target") return <WeightTargetStep step={step} value={value} onChange={onChange} />;
  if (step.type === "event-target") return <EventTargetStep step={step} value={value} onChange={onChange} />;
  if (step.type === "info") return <InfoStep step={step} />;
  if (step.type === "body-shape") return <BodyShapeStep step={step} value={value} onChange={onChange} onNext={onNext} allAnswers={allAnswers} />;
  if (step.type === "bodyfat-slider") return <BodyFatStep value={value} onChange={onChange} allAnswers={allAnswers} />;
  return null;
}

function StepFooter({ step, value, onNext }: any) {
  if (step.type === "info") {
    return <FixedFooter><Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={onNext}>Continuar <ArrowRight size={18} /></Button></FixedFooter>;
  }
  if (step.type === "gender" || (step.type === "choice" && !step.multi) || step.type === "body-shape") return null;

  let canContinue = false;
  if (step.type === "slider" || step.type === "bodyfat-slider") canContinue = value !== undefined;
  else if (step.type === "number") canContinue = value !== undefined && value !== "";
  else if (step.type === "weight-target") canContinue = value?.skip || (value?.value !== undefined && value?.value !== "");
  else if (step.type === "event-target") canContinue = value?.skip || (value?.date && value?.goal);
  else if (step.type === "choice" && step.multi) canContinue = Array.isArray(value) && value.length > 0;
  else if (step.type === "muscle-choice") canContinue = Array.isArray(value) && value.length > 0;
  else canContinue = !!value;

  return (
    <FixedFooter>
      <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" disabled={!canContinue} onClick={onNext}>
        Continuar <ArrowRight size={18} />
      </Button>
    </FixedFooter>
  );
}

function FixedFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
      <div className="max-w-xl mx-auto px-5">{children}</div>
    </div>
  );
}

function StepHeader({ step }: { step: QuizStep | { title: string; subtitle?: string } }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl md:text-3xl font-heading font-bold leading-tight text-foreground">{step.title}</h1>
      {"subtitle" in step && step.subtitle && (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.subtitle}</p>
      )}
    </div>
  );
}

// ============== GENDER ==============

function GenderStep({ value, onChange, onNext, step }: any) {
  const options = [
    { value: "male", label: "Masculino", img: genderMale },
    { value: "female", label: "Feminino", img: genderFemale },
  ];
  return (
    <>
      <StepHeader step={step} />
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setTimeout(onNext, 200); }}
              className={cn(
                "rounded-2xl border overflow-hidden transition-all bg-card/40 flex flex-col",
                active ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary))]" : "border-white/10 hover:border-white/25"
              )}
            >
              <div className="aspect-[3/4] bg-neutral-800 overflow-hidden">
                <img src={o.img} alt={o.label} loading="lazy" width={640} height={896} className="w-full h-full object-cover" />
              </div>
              <div className={cn("py-3 text-center font-semibold", active ? "bg-primary text-primary-foreground" : "text-foreground")}>
                {o.label}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/80 text-center mt-4">Obrigatório selecionar para continuar.</p>
    </>
  );
}

// ============== CHOICE ==============

function ChoiceStep({ step, value, onChange, onNext, allAnswers }: any) {
  // Splits dependem do gênero
  let options = step.options as any[];
  if (step.id === "split_pref") {
    const g = allAnswers?.gender === "female" ? "female" : "male";
    options = [...SPLITS_BY_GENDER[g]];
  }
  const multi = step.multi;
  const arr: string[] = multi ? value || [] : [];
  return (
    <>
      <StepHeader step={step} />
      <div className="space-y-2.5">
        {options.map((opt: any) => {
          const active = multi ? arr.includes(opt.value) : value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (multi) {
                  const newArr = active ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                  onChange(newArr);
                } else {
                  onChange(opt.value);
                  setTimeout(onNext, 180);
                }
              }}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-3",
                active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-white/10 bg-card/40 hover:border-white/25"
              )}
            >
              {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
              <div className="flex-1">
                <div className="font-semibold text-foreground">{opt.label}</div>
                {opt.description && <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>}
              </div>
              {multi && <Checkbox checked={active} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />}
            </button>
          );
        })}
      </div>
    </>
  );
}

// (MuscleChoiceStep removido — etapa de priorização manual foi excluída)

// ============== SLIDER / NUMBER ==============

function SliderStep({ step, value, onChange }: any) {
  const v = value ?? step.defaultValue ?? Math.round((step.min + step.max) / 2);
  useEffect(() => { if (value === undefined) onChange(v); }, []);
  return (
    <>
      <StepHeader step={step} />
      <Card className="p-8 bg-card/40 border-white/10 text-center">
        <div className="text-6xl font-heading font-bold text-primary mb-6 tabular-nums">{v}{step.unit ? ` ${step.unit}` : ""}</div>
        <Slider min={step.min} max={step.max} step={step.step ?? 1} value={[v]} onValueChange={([nv]) => onChange(nv)} />
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>{step.min}</span><span>{step.max}</span>
        </div>
      </Card>
    </>
  );
}

function NumberStep({ step, value, onChange, allAnswers }: any) {
  const bmi = useMemo(() => {
    if (step.derived !== "bmi") return null;
    const h = Number(allAnswers.height);
    const w = Number(value);
    if (!h || !w) return null;
    return (w / Math.pow(h / 100, 2)).toFixed(1);
  }, [value, allAnswers, step.derived]);
  return (
    <>
      <StepHeader step={step} />
      <div className="relative">
        <Input
          type="number" inputMode="numeric" placeholder={step.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="h-20 text-4xl font-heading font-bold text-center bg-card/60 border-white/10 rounded-2xl pr-16"
        />
        {step.unit && <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">{step.unit}</span>}
      </div>
      {bmi && (
        <Card className="mt-4 p-4 bg-primary/5 border-primary/20 text-center">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Seu IMC</p>
          <p className="text-2xl font-heading font-bold">{bmi}</p>
        </Card>
      )}
    </>
  );
}

// ============== WEIGHT TARGET ==============

function WeightTargetStep({ step, value, onChange }: any) {
  const skip = value?.skip === true;
  const v = value?.value;
  return (
    <>
      <StepHeader step={step} />
      <div className="relative">
        <Input
          type="number" inputMode="numeric" placeholder={step.placeholder}
          value={skip ? "" : (v ?? "")}
          disabled={skip}
          onChange={(e) => onChange({ skip: false, value: e.target.value === "" ? undefined : Number(e.target.value) })}
          className={cn("h-20 text-4xl font-heading font-bold text-center bg-card/60 border-white/10 rounded-2xl pr-16", skip && "opacity-40")}
        />
        {step.unit && <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">{step.unit}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange({ skip: !skip })}
        className={cn(
          "w-full mt-4 rounded-2xl border p-4 flex items-center gap-3 text-left transition-all",
          skip ? "border-primary bg-primary/10" : "border-white/10 bg-card/40 hover:border-white/25"
        )}
      >
        <Checkbox checked={skip} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
        <div>
          <p className="font-semibold">Não tenho peso alvo</p>
          <p className="text-xs text-muted-foreground">Quero focar em composição corporal e como me sinto</p>
        </div>
      </button>
    </>
  );
}

// ============== EVENT TARGET ==============

function EventTargetStep({ step, value, onChange }: any) {
  const skip = value?.skip === true;
  const date: Date | undefined = value?.date ? new Date(value.date) : undefined;
  const goal: string = value?.goal || "";

  return (
    <>
      <StepHeader step={step} />
      {!skip && (
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Data do evento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full h-14 justify-start text-left font-normal bg-card/60 border-white/10 rounded-2xl text-base", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Escolha uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single" selected={date}
                  onSelect={(d) => onChange({ ...value, skip: false, date: d?.toISOString() })}
                  disabled={(d) => d < new Date()}
                  initialFocus className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">Objetivo desejado nessa data</label>
            <Input
              placeholder="Ex.: chegar com 8% de gordura, perder 5kg, ganhar 4kg de massa…"
              value={goal}
              onChange={(e) => onChange({ ...value, skip: false, goal: e.target.value })}
              className="h-14 bg-card/60 border-white/10 rounded-2xl"
            />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange({ skip: !skip })}
        className={cn(
          "w-full mt-4 rounded-2xl border p-4 flex items-center gap-3 text-left transition-all",
          skip ? "border-primary bg-primary/10" : "border-white/10 bg-card/40 hover:border-white/25"
        )}
      >
        <Checkbox checked={skip} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
        <div>
          <p className="font-semibold">Não tenho um evento — é um objetivo contínuo</p>
          <p className="text-xs text-muted-foreground">Sem pressa, foco em consistência</p>
        </div>
      </button>
    </>
  );
}

// ============== INFO ==============

function InfoStep({ step }: any) {
  return (
    <div className="pt-4">
      <StepHeader step={step} />
      {step.variant === "social-proof" && (
        <Card className="p-6 bg-card/40 border-white/10 text-center">
          <div className="flex justify-center mb-3">
            {[0,1,2,3,4].map((i) => <Star key={i} size={20} className="fill-primary text-primary" />)}
          </div>
          <p className="text-4xl font-heading font-bold text-gradient">12.000+</p>
          <p className="text-sm text-muted-foreground mt-2">pessoas estruturando rotina com a Evoria</p>
        </Card>
      )}
      {step.variant === "kevin-method" && (
        <div className="space-y-4">
          <Card className="p-5 bg-primary/5 border-primary/30">
            <p className="text-foreground/90 text-sm leading-relaxed">{step.body}</p>
          </Card>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Cpu, label: "+1.000 regras", sub: "de programação" },
              { icon: Brain, label: "Método Franzen", sub: "anos de prática" },
              { icon: MessageCircle, label: "Chat humano", sub: "respostas reais" },
            ].map((it) => (
              <div key={it.label} className="rounded-2xl border border-white/10 bg-card/40 p-3 text-center">
                <it.icon size={20} className="text-primary mx-auto mb-1.5" />
                <p className="text-[11px] font-semibold leading-tight">{it.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{it.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {step.variant === "transition" && (
        <Card className="p-6 bg-primary/5 border-primary/30">
          <Sparkles size={24} className="text-primary mb-3" />
          <p className="text-foreground/90 text-base leading-relaxed">{step.body}</p>
        </Card>
      )}
    </div>
  );
}

// ============== BODY SHAPE (fotos) ==============

function BodyShapeStep({ step, value, onChange, onNext, allAnswers }: any) {
  const g = allAnswers?.gender === "female" ? "female" : "male";
  const source = step.field === "target_shape" ? TARGET_SHAPES_BY_GENDER : BODY_SHAPES_BY_GENDER;
  const shapes = source[g];
  return (
    <>
      <StepHeader step={step} />
      <div className="grid grid-cols-2 gap-3">
        {shapes.map((s) => {
          const active = value === s.value;
          return (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setTimeout(onNext, 200); }}
              className={cn(
                "rounded-2xl border overflow-hidden transition-all bg-card/40 flex flex-col",
                active ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary))]" : "border-white/10 hover:border-white/25"
              )}
            >
              <div className="aspect-[3/4] bg-neutral-800 overflow-hidden">
                <img src={s.img} alt={s.label} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className={cn("py-2.5 text-center text-sm font-semibold", active ? "bg-primary text-primary-foreground" : "text-foreground")}>
                {s.label}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============== BODYFAT SLIDER ==============

const MALE_BF_REFS = [
  { v: 5, img: maleBF5, label: "~5% (seco)" },
  { v: 10, img: maleBF10, label: "8-12% (atlético)" },
  { v: 15, img: maleBF15, label: "13-17% (em forma)" },
  { v: 20, img: maleBF20, label: "18-22% (normal)" },
  { v: 27, img: maleBF25, label: "23-30% (barriga saliente)" },
  { v: 35, img: maleBF35, label: "30%+ (obeso)" },
];
const FEMALE_BF_REFS = [
  { v: 18, img: femaleBF18, label: "15-20% (atlética)" },
  { v: 22, img: femaleBF22, label: "21-25% (em forma)" },
  { v: 27, img: femaleBF27, label: "26-30% (normal)" },
  { v: 32, img: femaleBF32, label: "31-35% (saliente)" },
  { v: 37, img: femaleBF37, label: "36-40% (acima do peso)" },
  { v: 42, img: femaleBF42, label: "40%+ (obesa)" },
];

function BodyFatStep({ value, onChange, allAnswers }: any) {
  const isFemale = allAnswers?.gender === "female";
  const refs = isFemale ? FEMALE_BF_REFS : MALE_BF_REFS;
  const min = refs[0].v;
  const max = refs[refs.length - 1].v;
  const v = value ?? refs[Math.floor(refs.length / 2)].v;
  useEffect(() => { if (value === undefined) onChange(refs[Math.floor(refs.length / 2)].v); }, [isFemale]);
  useEffect(() => { refs.forEach((r) => { const img = new window.Image(); img.src = r.img; }); }, [isFemale]);
  const active = refs.reduce((best, r) => Math.abs(r.v - v) < Math.abs(best.v - v) ? r : best, refs[0]);
  return (
    <>
      <StepHeader step={{ title: "Estime seu percentual de gordura", subtitle: "A referência visual ajuda. Não precisa ser exato." }} />
      <div className="relative w-full h-[420px] mb-3 flex items-center justify-center overflow-hidden">
        {refs.map((r) => (
          <img key={r.v} src={r.img} alt={`Referência ${r.label}`} width={640} height={1024} loading="lazy"
            className={cn("absolute inset-0 m-auto h-full w-auto object-contain transition-opacity duration-200", r.v === active.v ? "opacity-100" : "opacity-0")} />
        ))}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg tabular-nums">{active.label}</div>
      </div>
      <div className="px-1">
        <Slider min={min} max={max} step={1} value={[v]} onValueChange={([nv]) => onChange(nv)} />
        <div className="flex justify-between mt-3 text-[11px] text-muted-foreground">
          {refs.map((r) => <span key={r.v}>{r.label}</span>)}
        </div>
      </div>
    </>
  );
}

// ============== LOADING / ANALYZING ==============

function LoadingPhase() {
  const [step, setStep] = useState(0);
  useEffect(() => { const i = setInterval(() => setStep((s) => Math.min(s + 1, SOCIAL_PROOF_LINES.length - 1)), 700); return () => clearInterval(i); }, []);
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <Sparkles size={28} className="text-primary absolute inset-0 m-auto" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-center mb-2">Montando sua prévia…</h2>
      <p className="text-muted-foreground text-center text-sm max-w-sm">{SOCIAL_PROOF_LINES[step]}</p>
    </div>
  );
}

function AnalyzingPhase() {
  const MAX = 180;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const id = setInterval(() => setElapsed((s) => Math.min(MAX, s + 1)), 1000); return () => clearInterval(id); }, []);
  const pct = Math.min(100, Math.round((elapsed / MAX) * 100));
  const remaining = Math.max(0, MAX - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <Brain size={32} className="text-primary absolute inset-0 m-auto" />
      </div>
      <h2 className="text-2xl font-heading font-bold text-center mb-2">IA analisando suas fotos…</h2>
      <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">Avaliando postura, simetria e proporção corporal.</p>
      <div className="w-full max-w-xs">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-center text-3xl font-heading font-bold text-foreground mt-4 tabular-nums">{mm}:{ss}</p>
        <p className="text-center text-xs text-muted-foreground mt-1">Aguarde — a análise pode levar até 3 minutos</p>
      </div>
    </div>
  );
}

// ============== PREVIEW ==============

function PreviewPhase({ answers, physiqueResult }: { answers: Record<string, any>; physiqueResult?: any }) {
  const goal = answers.main_goal || "gain_muscle";
  const freq = answers.desired_frequency || "4";
  const dur = answers.session_duration || "60";
  const goalLabel = ({
    lose_fat: "Perder gordura",
    gain_muscle: "Ganhar massa muscular",
    performance: "Performance esportiva",
  } as any)[goal] || "Construção muscular";
  const split = answers.split_pref === "ppl" ? "Push · Pull · Legs"
    : answers.split_pref === "upper_lower" ? "Upper · Lower"
    : answers.split_pref === "fb" ? "Full Body"
    : answers.split_pref === "lpplu" ? "L · P · P · L · U (5x)"
    : answers.split_pref === "fb_inf" ? "Full Body com ênfase inferior"
    : answers.split_pref === "inf_sup_alt" ? "Inferior · Superior alternado"
    : answers.split_pref === "inf_sup_glute" ? "Inf (quad) · Sup · Inf (post+glúteo)"
    : `${freq}x · Otimizada pelo sistema`;
  const w = Number(answers.weight) || 75;
  const calories = goal === "lose_fat" ? Math.round(w * 28) : goal === "gain_muscle" ? Math.round(w * 38) : Math.round(w * 33);
  const protein = Math.round(w * 2);
  const carbs = Math.round((calories - protein * 4 - (calories * 0.25)) / 4);
  const fat = Math.round((calories * 0.25) / 9);

  return (
    <div className="pt-2 space-y-5">
      <div>
        <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-2">PRONTO</p>
        <h1 className="text-3xl font-heading font-bold leading-tight">
          Seu <span className="text-gradient">plano Evoria</span> está pronto.
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Uma prévia do que vai compor seu protocolo completo.</p>
      </div>

      <Card className="p-5 bg-card/40 border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Target size={20} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Objetivo</p>
        </div>
        <p className="text-xl font-heading font-bold">{goalLabel}</p>
      </Card>

      <Card className="p-5 bg-card/40 border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Dumbbell size={20} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Divisão de treino</p>
        </div>
        <p className="text-xl font-heading font-bold mb-1">{split}</p>
        <p className="text-sm text-muted-foreground">{freq} dias por semana · ~{dur} min por sessão</p>
      </Card>

      <Card className="p-5 bg-card/40 border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Apple size={20} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Calorias e macros</p>
        </div>
        <p className="text-4xl font-heading font-bold text-primary mb-3 tabular-nums">{calories} <span className="text-base text-muted-foreground font-medium">kcal/dia</span></p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/40 rounded-xl p-3"><p className="text-lg font-bold tabular-nums">{protein}g</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Proteína</p></div>
          <div className="bg-black/40 rounded-xl p-3"><p className="text-lg font-bold tabular-nums">{carbs}g</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Carbo</p></div>
          <div className="bg-black/40 rounded-xl p-3"><p className="text-lg font-bold tabular-nums">{fat}g</p><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gordura</p></div>
        </div>
      </Card>

      <Card className="p-5 bg-card/40 border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles size={20} className="text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estratégia Evoria</p>
        </div>
        <ul className="space-y-2.5 text-sm text-foreground/90">
          <li className="flex gap-2"><span className="text-primary">→</span> Cargas progressivas com microciclos calibrados ao seu nível.</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Alimentação com seus alimentos da rotina — sem dieta engessada.</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Recovery e sono entram na conta — não só treino.</li>
        </ul>
      </Card>

      {physiqueResult && (
        <Card className="p-5 bg-card/40 border-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <Camera size={20} className="text-primary" />
            <p className="text-xs uppercase tracking-wider text-primary font-bold">Leitura física por IA</p>
          </div>
          <div className="space-y-3 text-sm text-foreground/90">
            {physiqueResult.posture && (
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Postura</p><p className="leading-relaxed">{physiqueResult.posture}</p></div>
            )}
            {physiqueResult.symmetry && (
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Simetria</p><p className="leading-relaxed">{physiqueResult.symmetry}</p></div>
            )}
            {Array.isArray(physiqueResult.priorities) && physiqueResult.priorities.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pontos prioritários</p>
                <ul className="space-y-1">
                  {physiqueResult.priorities.slice(0, 3).map((p: string, i: number) => (
                    <li key={i} className="flex gap-2"><span className="text-primary">→</span> {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {physiqueResult.recommendation && (
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Recomendação inicial</p><p className="leading-relaxed">{physiqueResult.recommendation}</p></div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5 bg-primary/5 border-primary/30">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">O que falta para liberar tudo</p>
        <p className="text-foreground/90 text-sm leading-relaxed">
          Esta é apenas a <strong>prévia</strong>. Seu protocolo completo — treino detalhado, dieta personalizada, coaching diário e acompanhamento — é gerado <strong>imediatamente</strong> após a confirmação do plano.
        </p>
      </Card>
    </div>
  );
}

// ============== PHOTO UPLOAD ==============

function PhotoUpload({ photos, setPhotos }: any) {
  const slots = ["Frente", "Lado", "Costas"];
  function onPick(file: File, idx: number) {
    const next = [...photos];
    next[idx] = file;
    setPhotos(next.filter(Boolean));
  }
  return (
    <div className="pt-2">
      <h1 className="text-2xl font-heading font-bold leading-tight mb-2">Envie de 1 a 3 fotos</h1>
      <p className="text-muted-foreground text-sm mb-6">
        De preferência sem camisa (homens) ou com top esportivo (mulheres), bem iluminado.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((label, idx) => {
          const file = photos[idx];
          return (
            <label key={label} className={cn("relative aspect-[3/4] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all", file ? "border-primary bg-primary/5" : "border-white/15 bg-card/40 hover:border-white/30")}>
              {file ? (
                <>
                  <img src={URL.createObjectURL(file)} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                  <button type="button" onClick={(e) => { e.preventDefault(); setPhotos(photos.filter((_: any, i: number) => i !== idx)); }} className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5">
                    <X size={14} className="text-white" />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </>
              )}
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0], idx)} />
            </label>
          );
        })}
      </div>
      <Card className="mt-5 p-4 bg-black/40 border-white/5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <ShieldCheck size={14} className="inline mr-1 text-primary" />
          Suas fotos são processadas com privacidade total e descartadas em até 24h.
        </p>
      </Card>
    </div>
  );
}

function PhysiqueResult({ result }: any) {
  const data = result || {
    posture: "Postura geral alinhada com leve protrusão anterior do ombro.",
    symmetry: "Boa simetria entre lados; ligeira dominância do hemisfério direito.",
    priorities: ["Posterior de ombro e dorsais médias", "Glúteo médio e core", "Mobilidade torácica"],
    recommendation: "Foco em puxadas horizontais, rotação externa e core anti-extensão nas primeiras 4 semanas.",
  };
  return (
    <div className="pt-2 space-y-4">
      <div>
        <Badge variant="outline" className="border-primary/40 text-primary mb-3">ANÁLISE POR IA · PRÉVIA</Badge>
        <h1 className="text-2xl font-heading font-bold leading-tight">Sua leitura inicial está pronta.</h1>
        <p className="text-muted-foreground text-sm mt-2">Esta é uma estimativa computacional — não substitui avaliação profissional.</p>
      </div>
      <Card className="p-5 bg-card/40 border-white/10"><p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Postura</p><p className="text-foreground/90 text-sm leading-relaxed">{data.posture}</p></Card>
      <Card className="p-5 bg-card/40 border-white/10"><p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Simetria</p><p className="text-foreground/90 text-sm leading-relaxed">{data.symmetry}</p></Card>
      <Card className="p-5 bg-card/40 border-white/10">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Pontos prioritários</p>
        <ul className="space-y-2 text-sm text-foreground/90">{(data.priorities || []).map((p: string, i: number) => (<li key={i} className="flex gap-2"><span className="text-primary">→</span> {p}</li>))}</ul>
      </Card>
      <Card className="p-5 bg-primary/5 border-primary/30"><p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Recomendação inicial</p><p className="text-foreground/90 text-sm leading-relaxed">{data.recommendation}</p></Card>
    </div>
  );
}

// ============== PLANS (preços reais Evoria) ==============

function PlansPhase({ selected, onSelect }: any) {
  const plans = [
    {
      id: "monthly",
      title: "Mensal",
      highlight: "1º mês R$ 29,90",
      sub: "depois R$ 97/mês",
      priceBig: "29,90",
      priceSub: "no 1º mês",
      note: "Renova por R$ 97/mês · cancela quando quiser",
      popular: true,
    },
    {
      id: "annual",
      title: "Anual · Lançamento",
      highlight: "R$ 599 / ano",
      sub: "equivale a R$ 49,92/mês",
      priceBig: "599",
      priceSub: "no ano todo",
      note: "Preço de lançamento — sobe em breve",
    },
  ];
  return (
    <div className="pt-2">
      <div className="bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-primary">Oferta expira em</span>
        <Countdown />
      </div>
      <h1 className="text-2xl font-heading font-bold mb-1">Escolha seu plano</h1>
      <p className="text-muted-foreground text-sm mb-6">Comece com menos de R$1 por dia no primeiro mês.</p>
      <div className="space-y-3">
        {plans.map((p) => {
          const active = selected === p.id;
          return (
            <button key={p.id} type="button" onClick={() => onSelect(p.id)}
              className={cn("w-full text-left rounded-2xl border p-5 transition-all relative", active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-white/10 bg-card/40 hover:border-white/25")}>
              {p.popular && (
                <Badge className="absolute -top-2.5 left-5 bg-primary text-primary-foreground font-bold tracking-wider text-[10px]">RECOMENDADO</Badge>
              )}
              <div className="flex items-start gap-3">
                <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1", active ? "border-primary bg-primary" : "border-white/30")}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-lg">{p.title}</p>
                  <p className="text-sm text-primary font-semibold">{p.highlight}</p>
                  <p className="text-xs text-muted-foreground">{p.sub}</p>
                </div>
                <div className="bg-black/40 rounded-xl px-3 py-2 text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">R$</p>
                  <p className="text-2xl font-heading font-bold tabular-nums leading-none">{p.priceBig}</p>
                  <p className="text-[10px] text-muted-foreground">{p.priceSub}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">{p.note}</p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-5 flex items-start gap-2">
        <span>💪</span>
        <span>Quem segue por mais de 3 meses tem em média 3x mais resultado do que quem para no primeiro mês.</span>
      </p>
    </div>
  );
}

function Countdown() {
  const [secs, setSecs] = useState(600);
  useEffect(() => { const i = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(i); }, []);
  const m = Math.floor(secs / 60); const s = secs % 60;
  return <span className="text-xl font-heading font-bold text-primary tabular-nums">{m}:{s.toString().padStart(2, "0")}</span>;
}

// ============== GUARANTEE (7 dias) ==============

function GuaranteePhase() {
  return (
    <div className="pt-2 space-y-5">
      <Card className="p-6 bg-card/40 border-primary/40 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-3">Garantia de 7 dias</h2>
        <p className="text-foreground/85 text-sm leading-relaxed">
          Se em até <strong className="text-primary">7 dias</strong> você sentir que a Evoria não é pra você,
          devolvemos 100% do valor. Sem perguntas, sem burocracia.
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-4 leading-relaxed">
          Direito assegurado pelo Código de Defesa do Consumidor (Art. 49) para serviços contratados online.
        </p>
      </Card>


      <Card className="p-5 bg-primary/5 border-primary/30">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">O que vem agora</p>
        <ol className="space-y-2 text-sm text-foreground/90 list-decimal pl-4">
          <li>Você cria sua conta</li>
          <li>Faz o pagamento seguro</li>
          <li>Finaliza algumas perguntas finais + envia suas fotos</li>
          <li>Recebe seu protocolo completo na hora</li>
        </ol>
      </Card>
    </div>
  );
}

// ============== HELPERS ==============

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function compressImage(file: File, maxSide = 1024, quality = 0.8): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try { resolve(canvas.toDataURL("image/jpeg", quality)); } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
