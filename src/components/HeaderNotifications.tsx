import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, GraduationCap, Sparkles, Check, Calendar, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useBodyAssessments } from "@/hooks/useBodyAssessments";
import { useProtocolMilestone } from "@/hooks/useProtocolMilestone";

interface NotifItem {
  id: string;
  icon: typeof Bell;
  title: string;
  body: string;
  cta: string;
  highlight?: boolean;
  action: () => void;
}

interface HeaderNotificationsProps {
  onOpenTour?: () => void;
}

const TOUR_KEY_PREFIX = "hypertrophy:tour:done:";
const ASSESS_KEY_PREFIX = "hypertrophy:assessment:seen:";
const WEEKLY_DISMISS_PREFIX = "hypertrophy:weekly-notif:";

const MOTIVATIONAL_PHRASES = [
  "Disciplina vence motivação. Marca aí seu feedback semanal.",
  "Quem mede, melhora. 1 minuto agora vale 7 dias de evolução.",
  "Resultado é construído na constância. Bora registrar.",
  "Sem feedback não tem ajuste. Sem ajuste não tem evolução.",
  "Quem se enxerga progredir, treina mais forte. Vamos.",
  "A IA precisa dos seus dados pra te empurrar mais longe.",
];

function pickPhrase(week: number) {
  return MOTIVATIONAL_PHRASES[week % MOTIVATIONAL_PHRASES.length];
}

export default function HeaderNotifications({ onOpenTour }: HeaderNotificationsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assessments = [] } = useBodyAssessments();
  const { data: milestone } = useProtocolMilestone();
  const [tick, setTick] = useState(0);

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!user) return null;

  const tourDone = localStorage.getItem(`${TOUR_KEY_PREFIX}${user.id}`) === "1";
  const hasAssessment = assessments.length > 0;
  const assessmentSeen = localStorage.getItem(`${ASSESS_KEY_PREFIX}${user.id}`) === "1";

  const items: NotifItem[] = [];

  // Marco final 60d (prioridade máxima)
  if (milestone?.isFinal60Due) {
    items.push({
      id: "final-60",
      icon: Trophy,
      title: "Hora de atualizar seu protocolo!",
      body: "Você completou 60 dias. Responda 4 perguntas e a IA vai elaborar seu próximo ciclo com base na sua evolução.",
      cta: "Atualizar protocolo agora",
      highlight: true,
      action: () => {
        navigate("/checkin/60");
        refresh();
      },
    });
  } else if (milestone?.isFinal60Tomorrow) {
    items.push({
      id: "final-60-tomorrow",
      icon: Trophy,
      title: "Amanhã: atualização do protocolo",
      body: "Você fecha 60 dias amanhã. Prepare-se: vamos avaliar sua evolução e gerar o próximo ciclo.",
      cta: "Saber mais",
      action: () => {
        navigate("/dashboard");
        refresh();
      },
    });
  }

  // Marco 30d
  if (milestone?.isMid30Due) {
    items.push({
      id: "mid-30",
      icon: Flame,
      title: "Check-in dos 30 dias",
      body: "Metade do caminho! Conta pra gente como tá indo — a IA vai te mostrar o que já evoluiu.",
      cta: "Fazer check-in agora",
      highlight: true,
      action: () => {
        navigate("/checkin/30");
        refresh();
      },
    });
  } else if (milestone?.isMid30Tomorrow) {
    items.push({
      id: "mid-30-tomorrow",
      icon: Flame,
      title: "Amanhã: check-in dos 30 dias",
      body: "Você fecha 30 dias amanhã. Bora medir o progresso e seguir firme até o dia 60.",
      cta: "Ver dashboard",
      action: () => {
        navigate("/dashboard");
        refresh();
      },
    });
  }

  // Feedback semanal — todo múltiplo de 7 (mas não nos dias 30/60 onde já pedimos o detalhado)
  if (
    milestone?.isWeeklyDue &&
    !milestone.isMid30Due &&
    !milestone.isFinal60Due
  ) {
    const week = Math.floor(milestone.daysSinceStart / 7);
    const dismissedKey = `${WEEKLY_DISMISS_PREFIX}${user.id}:${milestone.daysSinceStart}`;
    const dismissed = localStorage.getItem(dismissedKey) === "1";
    if (!dismissed) {
      items.push({
        id: `weekly-${week}`,
        icon: Calendar,
        title: `Feedback da semana ${week}`,
        body: pickPhrase(week),
        cta: "Avaliar a semana",
        action: () => {
          localStorage.setItem(dismissedKey, "1");
          navigate("/progress");
          refresh();
        },
      });
    }
  }

  if (!tourDone) {
    items.push({
      id: "tutorial",
      icon: GraduationCap,
      title: "Faça o tutorial",
      body: "Aprenda em 1 minuto como tirar o máximo do app.",
      cta: "Abrir tutorial",
      action: () => {
        if (onOpenTour) onOpenTour();
        else navigate("/dashboard");
        refresh();
      },
    });
  }
  if (hasAssessment && !assessmentSeen) {
    items.push({
      id: "assessment",
      icon: Sparkles,
      title: "Bem-vindo!",
      body: "Sua análise corporal completa está pronta — leia agora os pontos fortes, fracos e recomendações da IA.",
      cta: "Ver minha análise",
      action: () => {
        navigate("/dashboard");
        setTimeout(() => {
          const el = document.getElementById("body-assessment-card");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
        refresh();
      },
    });
  }

  const count = items.length;
  const hasHighlight = items.some((i) => i.highlight);

  return (
    <Popover onOpenChange={(open) => open && refresh()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell size={20} />
          {count > 0 && (
            <span
              className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                hasHighlight
                  ? "bg-primary text-primary-foreground animate-pulse"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-heading font-semibold text-foreground">Notificações</p>
        </div>
        {count === 0 ? (
          <div className="p-6 text-center">
            <Check size={24} className="text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tudo em dia por aqui!</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  onClick={it.action}
                  className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors flex items-start gap-3 ${
                    it.highlight ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{it.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{it.body}</p>
                    <p className="text-[11px] text-primary font-medium mt-1.5">{it.cta} →</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
