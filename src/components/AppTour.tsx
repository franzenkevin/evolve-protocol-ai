import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, Dumbbell, UtensilsCrossed, MessageCircle, TrendingUp,
  CheckCircle2, ChevronRight, X, Sparkles, ListChecks, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProtocol } from "@/hooks/useProtocol";

const STORAGE_KEY_PREFIX = "hypertrophy:tour:done:";

type Step = {
  icon: any;
  title: string;
  badge?: string;
  body: string;
  bullets?: string[];
  cta?: { label: string; route: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao seu protocolo",
    badge: "60 dias",
    body:
      "Seu treino e dieta personalizados estão prontos. Antes de começar, deixa eu te mostrar como tirar o máximo do app em 1 minuto.",
  },
  {
    icon: Home,
    title: "Início — sua central diária",
    body:
      "Aqui você vê o treino do dia, registra como se sentiu (1 a 5 estrelas), acompanha seu progresso geral e lê as novidades do journal.",
    bullets: [
      "Avalie seu dia (humor, energia, sono)",
      "Veja o resumo do protocolo",
      "Acesse seu ranking semanal",
    ],
  },
  {
    icon: Dumbbell,
    title: "Treino — execute e registre cargas",
    body:
      "Cada exercício mostra séries, reps, descanso e vídeo. No card, toque em cada série pra anotar o peso e quantas reps fez.",
    bullets: [
      "Toque na série → digite peso (kg) e reps",
      "Use o cronômetro de descanso embutido",
      "Quando terminar todos exercícios, toque em Finalizar treino e dê sua nota",
    ],
    cta: { label: "Ver meu treino", route: "/training" },
  },
  {
    icon: UtensilsCrossed,
    title: "Dieta — siga e dê feedback",
    body:
      "Suas refeições estão calculadas pra bater suas metas de proteína, carbo e gordura. Use a calculadora de receitas pra adaptar quando precisar.",
    bullets: [
      "Substitua alimentos equivalentes pelo botão de troca",
      "Dê feedback diário (fome, energia, digestão)",
      "Esses dados ajustam seu próximo protocolo automaticamente",
    ],
  },
  {
    icon: MessageCircle,
    title: "Chat IA — seu coach 24/7",
    body:
      "Tire qualquer dúvida sobre técnica, suplementação, ajuste de carga, dor muscular. A IA conhece seu protocolo e seu histórico.",
    bullets: [
      "Pergunte: 'posso trocar agachamento por leg press?'",
      "Peça correção: 'minha lombar dói no terra'",
      "Disponível 24h, treinada com toda a metodologia",
    ],
  },
  {
    icon: TrendingUp,
    title: "Progresso — veja sua evolução",
    body:
      "Cada 7-14 dias, faça um check-in (peso + fotos). O app gera gráficos de evolução e a IA usa pra recalibrar.",
    bullets: [
      "Tire fotos no mesmo horário e luz",
      "Anote o peso na mesma balança",
      "Comparativos antes/depois automáticos",
    ],
  },
  {
    icon: ListChecks,
    title: "Como o ciclo funciona",
    body:
      "A cada 60 dias seu protocolo é recalculado automaticamente com base nos seus check-ins, treinos e feedback. Quanto mais você usar, mais preciso fica.",
    bullets: [
      "Treinos registrados → ajuste de carga e volume",
      "Feedback de dieta → ajuste calórico",
      "Fotos + peso → ajuste do objetivo",
    ],
  },
  {
    icon: MessageSquare,
    title: "Precisa de ajuda?",
    body:
      "No menu lateral (☰ no topo) você acha Suporte, Indicações, Reuniões ao vivo, Exames e seu Perfil. Bora começar?",
  },
];

interface AppTourProps {
  open: boolean;
  onClose: () => void;
}

export default function AppTour({ open, onClose }: AppTourProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) onClose();
    else setStep(step + 1);
  };
  const handleSkip = () => onClose();
  const handleCTA = () => {
    if (current.cta) {
      onClose();
      navigate(current.cta.route);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-fade-in">
      <Card className="w-full max-w-md card-gradient border-primary/30 p-5 relative">
        {/* Close */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Pular tour"
        >
          <X size={18} />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Icon size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-heading font-bold text-foreground">
                {current.title}
              </h2>
              {current.badge && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                  {current.badge}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Passo {step + 1} de {STEPS.length}
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3">{current.body}</p>

        {current.bullets && (
          <ul className="space-y-1.5 mb-4">
            {current.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 size={13} className="text-primary mt-0.5 shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              Voltar
            </Button>
          )}
          <div className="flex-1" />
          {current.cta && (
            <Button variant="outline" size="sm" onClick={handleCTA}>
              {current.cta.label}
            </Button>
          )}
          <Button size="sm" onClick={handleNext} className="gap-1">
            {isLast ? "Bora treinar!" : "Próximo"}
            {!isLast && <ChevronRight size={14} />}
          </Button>
        </div>

        {!isLast && (
          <button
            onClick={handleSkip}
            className="block mx-auto mt-3 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Pular tour
          </button>
        )}
      </Card>
    </div>
  );
}

/**
 * Hook that auto-opens the tour the first time the user has an active protocol.
 * Stores completion in localStorage keyed by user id.
 */
export function useAppTour() {
  const { user } = useAuth();
  const { data: protocol } = useActiveProtocol();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !protocol) return;
    const key = `${STORAGE_KEY_PREFIX}${user.id}`;
    if (localStorage.getItem(key) === "1") return;
    // Small delay so the dashboard renders first
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user, protocol]);

  const close = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY_PREFIX}${user.id}`, "1");
    setOpen(false);
  };

  const restart = () => setOpen(true);

  return { open, close, restart };
}
