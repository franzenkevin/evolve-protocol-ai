import { Card } from "@/components/ui/card";
import { useAdminMetrics } from "@/hooks/useAdminData";
import { Users, UserPlus, Activity, Dumbbell, ClipboardCheck, CreditCard, Calendar, TrendingUp } from "lucide-react";
import RevenueChart from "./RevenueChart";

const AdminMetrics = () => {
  const { data, isLoading } = useAdminMetrics();

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Carregando métricas...</p>;
  if (!data) return <p className="text-sm text-destructive py-4">Erro ao carregar métricas.</p>;

  const cards = [
    { icon: Users, label: "Usuários totais", value: data.total_users, color: "text-primary" },
    { icon: UserPlus, label: "Novos (30d)", value: data.new_users_30d, color: "text-success" },
    { icon: Activity, label: "Ativos (7d)", value: data.active_users_7d, color: "text-info" },
    { icon: ClipboardCheck, label: "Onboarded", value: data.onboarded_users, color: "text-foreground" },
    { icon: Dumbbell, label: "Treinos registrados", value: data.total_workouts, color: "text-warning" },
    { icon: ClipboardCheck, label: "Check-ins", value: data.total_checkins, color: "text-info" },
    { icon: CreditCard, label: "Assinaturas ativas", value: data.active_subscriptions, color: "text-success" },
    { icon: Calendar, label: "Renovações (30d)", value: data.renewals_next_30d, color: "text-warning" },
    { icon: TrendingUp, label: "Protocolos gerados", value: data.total_protocols, color: "text-primary" },
  ];

  const plans = data.subscriptions_by_plan || {};

  return (
    <div className="space-y-4">
      <RevenueChart />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4 card-gradient border-border">
            <Icon size={18} className={color} />
            <p className="text-2xl font-bold text-foreground mt-1">{value ?? 0}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {Object.keys(plans).length > 0 && (
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Distribuição por plano</h3>
          <div className="space-y-2">
            {Object.entries(plans).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{plan}</span>
                <span className="text-foreground font-semibold">{String(count)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminMetrics;
