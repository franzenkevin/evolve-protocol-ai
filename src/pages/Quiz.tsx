import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Upload, X, Sparkles, ShieldCheck, Star, Brain, Target, Dumbbell, Apple, TrendingUp, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import QuizShell from "@/components/quiz/QuizShell";
import { quizSteps, TOTAL_QUIZ_STEPS, type QuizStep } from "@/lib/quizSteps";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Phase =
  | { kind: "quiz"; index: number }
  | { kind: "loading" }
  | { kind: "preview" }
  | { kind: "physique-intro" }
  | { kind: "physique-upload" }
  | { kind: "physique-analyzing" }
  | { kind: "physique-result" }
  | { kind: "email" }
  | { kind: "plans" }
  | { kind: "guarantee" };

const STORAGE_KEY = "evoria_quiz_v1";
const PHASE_KEY = "evoria_quiz_phase_v1";

const BODY_SHAPES_M = [
  { value: "slim", label: "Magro", emoji: "🧍" },
  { value: "average", label: "Médio", emoji: "🧑" },
  { value: "soft", label: "Acima do peso", emoji: "🧔" },
  { value: "athletic", label: "Atlético", emoji: "💪" },
];

const BODYFAT_LEVELS = [
  { value: 10, label: "10%" },
  { value: 15, label: "15%" },
  { value: 20, label: "20%" },
  { value: 25, label: "25%" },
  { value: 30, label: "30%" },
  { value: 35, label: "35%+" },
];

const SOCIAL_PROOF_LINES = [
  "Calibrando proporção de macro nutrientes…",
  "Cruzando dados de treino, recuperação e rotina…",
  "Aplicando regras do Método Evoria…",
  "Projetando curva de progresso de 4 semanas…",
  "Quase lá — montando sua prévia…",
];

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
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("3m");

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
      if (nextIdx >= TOTAL_QUIZ_STEPS) {
        setPhase({ kind: "loading" });
      } else {
        setPhase({ kind: "quiz", index: nextIdx });
      }
    }
  }
  function back() {
    if (phase.kind === "quiz" && phase.index > 0) {
      setPhase({ kind: "quiz", index: phase.index - 1 });
    } else if (phase.kind === "preview") setPhase({ kind: "quiz", index: TOTAL_QUIZ_STEPS - 1 });
    else if (phase.kind === "physique-intro") setPhase({ kind: "preview" });
    else if (phase.kind === "physique-upload") setPhase({ kind: "physique-intro" });
    else if (phase.kind === "physique-result") setPhase({ kind: "physique-intro" });
    else if (phase.kind === "email") setPhase({ kind: "physique-intro" });
    else if (phase.kind === "plans") setPhase({ kind: "email" });
    else if (phase.kind === "guarantee") setPhase({ kind: "plans" });
    else navigate("/");
  }

  // Loading → Preview transition
  useEffect(() => {
    if (phase.kind === "loading") {
      const t = setTimeout(() => setPhase({ kind: "preview" }), 3800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ===== RENDER =====
  if (phase.kind === "quiz") {
    const step = quizSteps[phase.index];
    return (
      <QuizShell currentStep={phase.index} totalSteps={TOTAL_QUIZ_STEPS} onBack={back}>
        <StepRenderer
          step={step}
          value={answers[step.id]}
          allAnswers={answers}
          onChange={(v) => setAnswer(step.id, v)}
          onNext={next}
        />
        <StepFooter step={step} value={answers[step.id]} onNext={next} />
      </QuizShell>
    );
  }

  if (phase.kind === "loading") return <LoadingPhase />;

  if (phase.kind === "preview") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PreviewPhase answers={answers} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "physique-intro" })}>
              Continuar <ArrowRight size={18} />
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
            Em segundos, nossa IA lê 2-3 fotos suas e devolve uma leitura inicial de
            <strong className="text-foreground"> postura, simetria e pontos a desenvolver</strong> —
            antes mesmo de você ver os planos.
          </p>
          <div className="space-y-2 text-left bg-card/40 border border-white/5 rounded-2xl p-4 mb-6">
            {[
              "Leitura visual de postura e proporção",
              "Identifica pontos prioritários de evolução",
              "Recomenda foco inicial do treino",
              "100% privado — fotos descartadas em 24h",
            ].map((t) => (
              <div key={t} className="flex gap-2 text-sm">
                <span className="text-primary">✓</span>
                <span className="text-foreground/85">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5 space-y-2">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "physique-upload" })}>
              <Camera size={18} /> Fazer análise por IA
            </Button>
            <Button variant="ghost" size="lg" className="w-full h-12 text-muted-foreground" onClick={() => setPhase({ kind: "email" })}>
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
                  setPhase({ kind: "physique-result" });
                } catch (e: any) {
                  console.error("[quiz] physique error", e);
                  toast.error("Não foi possível concluir a análise agora. Você poderá enviar suas fotos depois, no app.");
                  setAnswers((a) => ({ ...a, physique_pending: true }));
                  setPhase({ kind: "email" });
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
                setPhase({ kind: "email" });
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

  if (phase.kind === "physique-analyzing") {
    return (
      <AnalyzingPhase
        onSkip={() => {
          setAnswers((a) => ({ ...a, physique_pending: true }));
          toast.info("Sem problema — você poderá enviar suas fotos no app.");
          setPhase({ kind: "email" });
        }}
      />
    );
  }

  if (phase.kind === "physique-result") {
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <PhysiqueResult result={physiqueResult} />
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={() => setPhase({ kind: "email" })}>
              Ver meu plano completo <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </QuizShell>
    );
  }

  if (phase.kind === "email") {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return (
      <QuizShell currentStep={TOTAL_QUIZ_STEPS} totalSteps={TOTAL_QUIZ_STEPS} onBack={back} hideProgress>
        <div className="pt-4">
          <Badge variant="outline" className="border-primary/40 text-primary mb-3">ÚLTIMO PASSO</Badge>
          <h1 className="text-3xl font-heading font-bold leading-tight mb-3">
            Onde enviamos seu <span className="text-gradient">plano personalizado?</span>
          </h1>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Seu protocolo fica salvo nesse email. Sem spam — só seu acesso.
          </p>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-base bg-card/60 border-white/10 rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" /> Seus dados ficam protegidos.
          </p>
        </div>
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
          <div className="max-w-xl mx-auto px-5">
            <Button
              size="lg"
              disabled={!valid}
              className="w-full h-14 text-base font-semibold gap-2 glow"
              onClick={() => {
                sessionStorage.setItem("evoria_quiz_email", email.trim());
                setPhase({ kind: "plans" });
              }}
            >
              Ver meu plano <ArrowRight size={18} />
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
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2 glow"
              onClick={() => setPhase({ kind: "guarantee" })}
            >
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
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold gap-2 glow"
              onClick={() => {
                const params = new URLSearchParams();
                const e = sessionStorage.getItem("evoria_quiz_email");
                if (e) params.set("email", e);
                params.set("plan", selectedPlan);
                navigate(`/signup?${params.toString()}`);
              }}
            >
              Obter meu plano agora <ArrowRight size={18} />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Garantia de 30 dias · Cancela quando quiser
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
  if (step.type === "choice") return <ChoiceStep step={step} value={value} onChange={onChange} onNext={onNext} />;
  if (step.type === "slider") return <SliderStep step={step} value={value} onChange={onChange} />;
  if (step.type === "number") return <NumberStep step={step} value={value} onChange={onChange} allAnswers={allAnswers} />;
  if (step.type === "info") return <InfoStep step={step} />;
  if (step.type === "body-shape") return <BodyShapeStep step={step} value={value} onChange={onChange} onNext={onNext} />;
  if (step.type === "bodyfat-slider") return <BodyFatStep value={value} onChange={onChange} allAnswers={allAnswers} />;
  return null;
}

function StepFooter({ step, value, onNext }: any) {
  if (step.type === "info") {
    return (
      <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
        <div className="max-w-xl mx-auto px-5">
          <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" onClick={onNext}>
            Continuar <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }
  if (step.type === "choice" && !step.multi) return null; // auto-advance on choice
  // number, slider, multi, body-shape, bodyfat
  const canContinue =
    (step.type === "slider" || step.type === "bodyfat-slider")
      ? value !== undefined
      : step.type === "number"
        ? value !== undefined && value !== ""
        : step.type === "choice" && step.multi
          ? Array.isArray(value) && value.length > 0
          : !!value;
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-5">
      <div className="max-w-xl mx-auto px-5">
        <Button size="lg" className="w-full h-14 text-base font-semibold gap-2 glow" disabled={!canContinue} onClick={onNext}>
          Continuar <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: QuizStep }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl md:text-3xl font-heading font-bold leading-tight text-foreground">{step.title}</h1>
      {"subtitle" in step && step.subtitle && (
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.subtitle}</p>
      )}
    </div>
  );
}

function ChoiceStep({ step, value, onChange, onNext }: any) {
  const multi = step.multi;
  const arr: string[] = multi ? value || [] : [];
  return (
    <>
      <StepHeader step={step} />
      <div className="space-y-2.5">
        {step.options.map((opt: any) => {
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
              className={`w-full text-left rounded-2xl border p-4 transition-all flex items-center gap-3
                ${active
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]"
                  : "border-white/10 bg-card/40 hover:border-white/25"}`}
            >
              {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
              <div className="flex-1">
                <div className="font-semibold text-foreground">{opt.label}</div>
                {opt.description && <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>}
              </div>
              {multi && (
                <Checkbox checked={active} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

function SliderStep({ step, value, onChange }: any) {
  const v = value ?? step.defaultValue ?? Math.round((step.min + step.max) / 2);
  useEffect(() => {
    if (value === undefined) onChange(v);
  }, []);
  return (
    <>
      <StepHeader step={step} />
      <Card className="p-8 bg-card/40 border-white/10 text-center">
        <div className="text-6xl font-heading font-bold text-primary mb-6 tabular-nums">{v}{step.unit ? ` ${step.unit}` : ""}</div>
        <Slider min={step.min} max={step.max} step={step.step ?? 1} value={[v]} onValueChange={([nv]) => onChange(nv)} />
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>{step.min}</span>
          <span>{step.max}</span>
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
          type="number"
          inputMode="numeric"
          placeholder={step.placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="h-20 text-4xl font-heading font-bold text-center bg-card/60 border-white/10 rounded-2xl pr-16"
        />
        {step.unit && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
            {step.unit}
          </span>
        )}
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

function InfoStep({ step }: any) {
  return (
    <div className="pt-4">
      <StepHeader step={step} />
      {step.variant === "chart" && <ProgressChart />}
      {step.variant === "social-proof" && (
        <Card className="p-6 bg-card/40 border-white/10 text-center">
          <div className="flex justify-center mb-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={20} className="fill-primary text-primary" />
            ))}
          </div>
          <p className="text-4xl font-heading font-bold text-gradient">12.000+</p>
          <p className="text-sm text-muted-foreground mt-2">pessoas estruturando rotina com a Evoria</p>
        </Card>
      )}
      {step.variant === "transition" && (
        <Card className="p-6 bg-primary/5 border-primary/30">
          <Sparkles size={24} className="text-primary mb-3" />
          <p className="text-foreground/90 text-base leading-relaxed">{step.body}</p>
        </Card>
      )}
      {!step.variant && step.body && (
        <p className="text-muted-foreground text-base leading-relaxed">{step.body}</p>
      )}
    </div>
  );
}

function BodyShapeStep({ step, value, onChange, onNext }: any) {
  return (
    <>
      <StepHeader step={step} />
      <div className="grid grid-cols-2 gap-3">
        {BODY_SHAPES_M.map((s) => {
          const active = value === s.value;
          return (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setTimeout(onNext, 180); }}
              className={`aspect-[3/4] rounded-2xl border p-4 flex flex-col items-center justify-between transition-all
                ${active ? "border-primary bg-primary/10" : "border-white/10 bg-card/40 hover:border-white/25"}`}
            >
              <span className="text-6xl">{s.emoji}</span>
              <span className="font-semibold text-foreground">{s.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// Imagens de referência geradas por IA (homem e mulher em níveis de % de gordura)
import maleBF10 from "@/assets/bodyfat/male-10.png";
import maleBF15 from "@/assets/bodyfat/male-15.png";
import maleBF20 from "@/assets/bodyfat/male-20.png";
import maleBF25 from "@/assets/bodyfat/male-25.png";
import maleBF30 from "@/assets/bodyfat/male-30.png";
import maleBF35 from "@/assets/bodyfat/male-35.png";
import femaleBF18 from "@/assets/bodyfat/female-18.png";
import femaleBF22 from "@/assets/bodyfat/female-22.png";
import femaleBF27 from "@/assets/bodyfat/female-27.png";
import femaleBF32 from "@/assets/bodyfat/female-32.png";
import femaleBF37 from "@/assets/bodyfat/female-37.png";
import femaleBF42 from "@/assets/bodyfat/female-42.png";

const MALE_BF_REFS = [
  { v: 10, img: maleBF10, label: "8-12%" },
  { v: 15, img: maleBF15, label: "13-17%" },
  { v: 20, img: maleBF20, label: "18-22%" },
  { v: 25, img: maleBF25, label: "23-27%" },
  { v: 30, img: maleBF30, label: "28-32%" },
  { v: 35, img: maleBF35, label: "33%+" },
];
const FEMALE_BF_REFS = [
  { v: 18, img: femaleBF18, label: "15-20%" },
  { v: 22, img: femaleBF22, label: "21-25%" },
  { v: 27, img: femaleBF27, label: "26-30%" },
  { v: 32, img: femaleBF32, label: "31-35%" },
  { v: 37, img: femaleBF37, label: "36-40%" },
  { v: 42, img: femaleBF42, label: "41%+" },
];

function BodyFatStep({ value, onChange, allAnswers }: any) {
  const isFemale = allAnswers?.gender === "female";
  const refs = isFemale ? FEMALE_BF_REFS : MALE_BF_REFS;
  const min = refs[0].v;
  const max = refs[refs.length - 1].v;
  const v = value ?? refs[Math.floor(refs.length / 2)].v;
  useEffect(() => {
    if (value === undefined) onChange(refs[Math.floor(refs.length / 2)].v);
  }, [isFemale]);

  // Pré-carrega todas as imagens para evitar flicker ao arrastar
  useEffect(() => {
    refs.forEach((r) => {
      const img = new window.Image();
      img.src = r.img;
    });
  }, [isFemale]);

  // Acha a referência mais próxima
  const active = refs.reduce((best, r) =>
    Math.abs(r.v - v) < Math.abs(best.v - v) ? r : best
  , refs[0]);

  return (
    <>
      <StepHeader step={{ title: "Estime seu percentual de gordura", subtitle: "A referência visual ajuda. Não precisa ser exato." } as any} />
      <div className="relative w-full h-[420px] mb-3 flex items-center justify-center overflow-hidden">
        {refs.map((r) => (
          <img
            key={r.v}
            src={r.img}
            alt={`Referência ${r.label}`}
            width={640}
            height={1024}
            loading="lazy"
            className={`absolute inset-0 m-auto h-full w-auto object-contain transition-opacity duration-200 ${
              r.v === active.v ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg tabular-nums">
          {active.label}
        </div>
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

function ProgressChart() {
  return (
    <Card className="p-6 bg-card/40 border-white/10">
      <p className="text-sm text-muted-foreground mb-4">Sua musculatura projetada</p>
      <svg viewBox="0 0 320 140" className="w-full h-auto">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ef4444" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 10 120 Q 80 105, 110 80 T 200 60 T 310 20 L 310 130 L 10 130 Z" fill="url(#gf)" />
        <path d="M 10 120 Q 80 105, 110 80 T 200 60 T 310 20" fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="10" cy="120" r="4" fill="#fff" />
        <circle cx="310" cy="20" r="4" fill="#22c55e" />
      </svg>
      <div className="flex justify-between mt-3 text-[11px] text-muted-foreground font-medium">
        <span>Semana 1</span><span>Semana 2</span><span>Semana 3</span><span>Semana 4</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 text-center italic">Este gráfico é apenas para fins ilustrativos</p>
    </Card>
  );
}

// ============== LOADING ==============

function LoadingPhase() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setStep((s) => Math.min(s + 1, SOCIAL_PROOF_LINES.length - 1)), 700);
    return () => clearInterval(i);
  }, []);
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

function AnalyzingPhase(_: { onSkip?: () => void }) {
  const MAX = 180;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => Math.min(MAX, s + 1)), 1000);
    return () => clearInterval(id);
  }, []);
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
      <p className="text-muted-foreground text-center text-sm max-w-sm mb-6">
        Avaliando postura, simetria e proporção corporal.
      </p>
      <div className="w-full max-w-xs">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-center text-3xl font-heading font-bold text-foreground mt-4 tabular-nums">
          {mm}:{ss}
        </p>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Aguarde — a análise pode levar até 3 minutos
        </p>
      </div>
    </div>
  );
}

// ============== PREVIEW ==============

function PreviewPhase({ answers }: { answers: Record<string, any> }) {
  const name = "Atleta";
  const goal = answers.main_goal || "gain_muscle";
  const freq = answers.desired_frequency || "4";
  const dur = answers.session_duration || "60";
  const goalLabel = {
    lose_fat: "Perder gordura",
    gain_muscle: "Ganhar massa muscular",
    recomp: "Recomposição corporal",
    performance: "Performance e saúde",
  }[goal as string] || "Construção muscular";
  const split = answers.split_pref === "ppl" ? "Push · Pull · Legs"
              : answers.split_pref === "ab" ? "Superior · Inferior"
              : answers.split_pref === "abcd" ? "ABCD"
              : `${freq}x · Otimizada pelo sistema`;
  const w = Number(answers.weight) || 75;
  const calories = goal === "lose_fat" ? Math.round(w * 28) : goal === "gain_muscle" ? Math.round(w * 38) : Math.round(w * 33);
  const protein = Math.round(w * 2);
  const carbs = Math.round((calories - protein * 4 - (calories * 0.25)) / 4);
  const fat = Math.round((calories * 0.25) / 9);

  return (
    <div className="pt-2 space-y-5">
      <div>
        <p className="text-primary text-sm font-semibold tracking-wider uppercase mb-2">Sua prévia · grátis</p>
        <h1 className="text-3xl font-heading font-bold leading-tight">
          Seu plano <span className="text-gradient">Evoria de 4 semanas</span> está pronto.
        </h1>
      </div>

      <ProgressChart />

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
          <div className="bg-black/40 rounded-xl p-3">
            <p className="text-lg font-bold tabular-nums">{protein}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Proteína</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3">
            <p className="text-lg font-bold tabular-nums">{carbs}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Carbo</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3">
            <p className="text-lg font-bold tabular-nums">{fat}g</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gordura</p>
          </div>
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

      <Card className="p-5 bg-primary/5 border-primary/30">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">O que falta para liberar tudo</p>
        <p className="text-foreground/90 text-sm leading-relaxed">
          Esta é apenas a <strong>prévia</strong>. Seu protocolo completo — com treino A/B/C/D detalhado, dieta personalizada com seus alimentos,
          coaching diário por IA e acompanhamento de progresso — é gerado <strong>imediatamente</strong> após a confirmação do plano.
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
        De preferência sem camisa (homens) ou com top esportivo (mulheres), bem iluminado. Quanto melhor a foto, mais precisa a leitura.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((label, idx) => {
          const file = photos[idx];
          return (
            <label
              key={label}
              className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all
                ${file ? "border-primary bg-primary/5" : "border-white/15 bg-card/40 hover:border-white/30"}`}
            >
              {file ? (
                <>
                  <img src={URL.createObjectURL(file)} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setPhotos(photos.filter((_: any, i: number) => i !== idx)); }}
                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0], idx)}
              />
            </label>
          );
        })}
      </div>
      <Card className="mt-5 p-4 bg-black/40 border-white/5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <ShieldCheck size={14} className="inline mr-1 text-primary" />
          Suas fotos são processadas com privacidade total e descartadas em até 24h. Nunca compartilhamos com terceiros.
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

      <Card className="p-5 bg-card/40 border-white/10">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Postura</p>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.posture}</p>
      </Card>
      <Card className="p-5 bg-card/40 border-white/10">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Simetria</p>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.symmetry}</p>
      </Card>
      <Card className="p-5 bg-card/40 border-white/10">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Pontos prioritários</p>
        <ul className="space-y-2 text-sm text-foreground/90">
          {(data.priorities || []).map((p: string, i: number) => (
            <li key={i} className="flex gap-2"><span className="text-primary">→</span> {p}</li>
          ))}
        </ul>
      </Card>
      <Card className="p-5 bg-primary/5 border-primary/30">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">Recomendação inicial</p>
        <p className="text-foreground/90 text-sm leading-relaxed">{data.recommendation}</p>
      </Card>
    </div>
  );
}

// ============== PLANS ==============

function PlansPhase({ selected, onSelect }: any) {
  const plans = [
    { id: "1m", title: "1 Mês", was: 129.9, now: 64.98, daily: 2.17 },
    { id: "3m", title: "3 Meses", was: 259.9, now: 129.97, daily: 1.44, popular: true },
    { id: "6m", title: "6 Meses", was: 399.9, now: 199.96, daily: 1.11 },
  ];
  return (
    <div className="pt-2">
      <div className="bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-primary">Desconto expira em</span>
        <Countdown />
      </div>
      <h1 className="text-2xl font-heading font-bold mb-1">Escolha seu plano</h1>
      <p className="text-muted-foreground text-sm mb-6">Quanto mais tempo, melhor o ritmo da evolução.</p>
      <div className="space-y-3">
        {plans.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all relative
                ${active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-white/10 bg-card/40 hover:border-white/25"}`}
            >
              {p.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-bold tracking-wider text-[10px]">
                  MAIS POPULAR
                </Badge>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${active ? "border-primary bg-primary" : "border-white/30"}`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-lg">Plano de {p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="line-through">R$ {p.was.toFixed(2)}</span>
                    <span className="ml-2 text-foreground">R$ {p.now.toFixed(2)}</span>
                  </p>
                </div>
                <div className="bg-black/40 rounded-xl px-3 py-2 text-right">
                  <p className="text-xs text-muted-foreground">R$</p>
                  <p className="text-2xl font-heading font-bold tabular-nums leading-none">{Math.floor(p.daily)}<span className="text-sm">,{Math.round((p.daily % 1) * 100).toString().padStart(2, "0")}</span></p>
                  <p className="text-[10px] text-muted-foreground">por dia</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-5 flex items-start gap-2">
        <span>💪</span>
        <span>Quem segue o plano por 6 meses alcança em média 3x mais resultados do que por 1 mês.</span>
      </p>
    </div>
  );
}

function Countdown() {
  const [secs, setSecs] = useState(600);
  useEffect(() => {
    const i = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return <span className="text-xl font-heading font-bold text-primary tabular-nums">{m}:{s.toString().padStart(2, "0")}</span>;
}

function GuaranteePhase() {
  return (
    <div className="pt-2 space-y-5">
      <Card className="p-6 bg-card/40 border-primary/40 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-3">Garantia de 30 dias</h2>
        <p className="text-foreground/85 text-sm leading-relaxed">
          Se em 30 dias seguindo o protocolo você não enxergar evolução visível, devolvemos 100% do valor.
          Sem perguntas complicadas. Sua confiança importa mais que a venda.
        </p>
      </Card>

      <div>
        <h3 className="text-xl font-heading font-bold mb-3">Mesmo profissionais treinam com a Evoria</h3>
        <div className="space-y-3">
          {[
            { name: "Kay Jaster", role: "Atleta Men's Physique", text: '"Desde que terminei minha competição, uso o Evoria. A estrutura me mantém em pico mesmo fora de prep."' },
            { name: "Patrícia Lima", role: "Coach de hipertrofia", text: '"Indico para meus alunos que precisam de organização. A IA acerta o ritmo e o volume."' },
          ].map((t) => (
            <Card key={t.name} className="p-4 bg-card/40 border-white/10">
              <p className="font-bold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground mb-2">{t.role}</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{t.text}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-5 bg-card/40 border-white/10 text-center">
        <p className="text-sm text-muted-foreground">Ajudamos mais de</p>
        <p className="text-4xl font-heading font-bold text-gradient my-1">12.000+ pessoas</p>
        <p className="text-sm text-muted-foreground">a estruturar treino, dieta e progresso</p>
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
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
