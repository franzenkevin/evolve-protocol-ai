import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useActiveProtocol } from "@/hooks/useProtocol";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Dumbbell, UtensilsCrossed, Camera, Activity, Calendar, Bell } from "lucide-react";

const QUICK_ACTIONS = [
  { to: "/training", icon: Dumbbell, label: "Treino", color: "text-primary" },
  { to: "/diet", icon: UtensilsCrossed, label: "Dieta", color: "text-warning" },
  { to: "/progress", icon: Camera, label: "Fotos", color: "text-info" },
  { to: "/progress", icon: Activity, label: "Check-in", color: "text-success" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: protocol, isLoading: loadingProtocol } = useActiveProtocol();

  const name = profile?.full_name || user?.user_metadata?.full_name || "Atleta";

  const daysLeft = protocol
    ? Math.max(0, Math.ceil((new Date(protocol.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  const trainingDays = profile?.training_days || 0;
  const diet = protocol?.diet as any;
  const training = protocol?.training as any;
  const todayTraining = training?.[0];

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-muted-foreground text-sm">Bem-vindo de volta</p>
            <h1 className="text-2xl font-heading font-bold text-foreground">{name}</h1>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          </Button>
        </div>

        {loadingProtocol ? (
          <Skeleton className="h-28 w-full" />
        ) : protocol ? (
          <Card className="p-5 card-gradient border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-foreground">Protocolo Atual</h3>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">Ativo</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{trainingDays}x</p>
                <p className="text-xs text-muted-foreground">Dias/semana</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{daysLeft}</p>
                <p className="text-xs text-muted-foreground">Dias restantes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">v{protocol.version}</p>
                <p className="text-xs text-muted-foreground">Versão</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 card-gradient border-border text-center">
            <p className="text-muted-foreground mb-3">Nenhum protocolo ativo</p>
            <Link to="/onboarding"><Button className="glow">Criar protocolo</Button></Link>
          </Card>
        )}

        <div>
          <h3 className="font-heading font-semibold text-foreground mb-3">Ações rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ to, icon: Icon, label, color }) => (
              <Link key={label} to={to}>
                <Card className="p-3 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors cursor-pointer">
                  <Icon size={22} className={color} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {todayTraining && (
          <Card className="p-5 card-gradient border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-foreground">Treino de Hoje</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>{todayTraining.label}</span>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground mb-3">
              {todayTraining.muscleGroup} — {todayTraining.exercises?.length || 0} exercícios
            </p>
            <Link to="/training">
              <Button className="w-full glow">Iniciar Treino</Button>
            </Link>
          </Card>
        )}

        {diet && (
          <Card className="p-5 card-gradient border-border">
            <h3 className="font-heading font-semibold text-foreground mb-3">Macros do Dia</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Kcal", value: diet.totalCalories, color: "text-primary" },
                { label: "Prot", value: `${diet.protein}g`, color: "text-info" },
                { label: "Carb", value: `${diet.carbs}g`, color: "text-warning" },
                { label: "Gord", value: `${diet.fat}g`, color: "text-destructive" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
