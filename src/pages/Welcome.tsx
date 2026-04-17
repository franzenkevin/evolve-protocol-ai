import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarClock, Dumbbell, UtensilsCrossed, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // If onboarding already complete, send to real dashboard
  if (!isLoading && profile?.onboarding_complete) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const firstName = (profile?.full_name || user?.user_metadata?.full_name || "Atleta").split(" ")[0];

  const features = [
    { icon: Dumbbell, label: "Treino personalizado pela sua metodologia" },
    { icon: UtensilsCrossed, label: "Dieta calculada com seus alimentos preferidos" },
    { icon: TrendingUp, label: "Progressão e revisão automática a cada 60 dias" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Hypertrophy" className="w-16 h-16 mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Bem-vindo, <span className="text-gradient">{firstName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Vamos criar seu primeiro protocolo personalizado
          </p>
        </div>

        {/* Features card */}
        <Card className="p-5 mb-4 card-gradient border-border space-y-3">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-sm text-foreground pt-1.5">{label}</p>
            </div>
          ))}
        </Card>

        {/* Important notice */}
        <Card className="p-4 mb-6 border-primary/40 bg-primary/5">
          <div className="flex gap-3">
            <CalendarClock size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Quiz único e definitivo
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você responderá um questionário <strong className="text-foreground">uma única vez</strong>.
                Suas respostas vão definir seu treino e dieta pelos próximos{" "}
                <strong className="text-primary">60 dias</strong>.
                Após esse período, faremos a revisão automática com base na sua evolução.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full glow gap-2 h-14 text-base"
          onClick={() => setConfirmOpen(true)}
        >
          Iniciar meu primeiro quiz <ArrowRight size={18} />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Tempo estimado: 5 a 8 minutos · Responda com calma e sinceridade
        </p>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
              <AlertTriangle size={22} className="text-primary" />
            </div>
            <AlertDialogTitle>Confirma iniciar o quiz?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Este questionário é <strong className="text-foreground">único</strong> e suas respostas
                montarão seu protocolo pelos próximos <strong className="text-primary">60 dias</strong>.
              </span>
              <span className="block">
                Reserve alguns minutos sem pressa. Você não poderá refazê-lo até o próximo ciclo.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Agora não</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/onboarding")}>
              Sim, vamos começar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Welcome;
