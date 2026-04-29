import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, GraduationCap, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useBodyAssessments } from "@/hooks/useBodyAssessments";

interface NotifItem {
  id: "tutorial" | "assessment";
  icon: typeof Bell;
  title: string;
  body: string;
  cta: string;
  action: () => void;
}

interface HeaderNotificationsProps {
  /** Optional callback to re-open the in-app tutorial. */
  onOpenTour?: () => void;
}

const TOUR_KEY_PREFIX = "hypertrophy:tour:done:";
const ASSESS_KEY_PREFIX = "hypertrophy:assessment:seen:";

/**
 * Sininho do header — exibe notificações contextuais reais:
 * 1. "Faça o tutorial" enquanto o usuário não tiver concluído.
 * 2. "Veja sua avaliação corporal completa" no primeiro acesso pós-compra.
 */
export default function HeaderNotifications({ onOpenTour }: HeaderNotificationsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assessments = [] } = useBodyAssessments();
  const [tick, setTick] = useState(0); // re-render quando localStorage muda

  // Re-checa flags ao abrir o popover ou após interação
  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    // Reage a mudanças no localStorage (ex: tutorial fechou em outra aba)
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!user) return null;

  const tourDone = localStorage.getItem(`${TOUR_KEY_PREFIX}${user.id}`) === "1";
  const hasAssessment = assessments.length > 0;
  const assessmentSeen = localStorage.getItem(`${ASSESS_KEY_PREFIX}${user.id}`) === "1";

  const items: NotifItem[] = [];
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
        // Garante que ao chegar no dashboard, a avaliação será visível.
        // O Dashboard marca como visto após exibir.
        setTimeout(() => {
          const el = document.getElementById("body-assessment-card");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
        refresh();
      },
    });
  }

  const count = items.length;

  return (
    <Popover onOpenChange={(open) => open && refresh()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell size={20} />
          {count > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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
          <div className="divide-y divide-border">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  onClick={it.action}
                  className="w-full text-left p-3 hover:bg-secondary/50 transition-colors flex items-start gap-3"
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
