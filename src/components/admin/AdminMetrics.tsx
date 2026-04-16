import { Card } from "@/components/ui/card";
import { useAdminMetrics } from "@/hooks/useAdminData";
import { Users, UserPlus, Activity, Dumbbell, ClipboardCheck, CreditCard, Calendar, TrendingUp, DollarSign, Percent, Repeat, Gift, AlertCircle } from "lucide-react";
import RevenueChart from "./RevenueChart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AdminMetrics = () => {
  const { data, isLoading } = useAdminMetrics();

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Carregando métricas...</p>;
  if (!data) return <p className="text-sm text-destructive py-4">Erro ao carregar métricas.</p>;

  const fmtBRL = (n: number) => `R$ ${Number(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (n: number) => `${Number(n ?? 0).toFixed(1)}%`;

  const businessCards = [
    { icon: DollarSign, label: "MRR", value: fmtBRL(data.mrr), color: "text-success" },
    { icon: TrendingUp, label: "LTV médio", value: fmtBRL(data.ltv_avg), color: "text-primary" },
    { icon: Repeat, label: "Churn 30d", value: fmtPct(data.churn_30d_pct), color: "text-destructive" },
    { icon: Percent, label: "Conversão onboarding", value: fmtPct(data.conversion_rate_pct), color: "text-info" },
    { icon: Activity, label: "Retenção 7d", value: fmtPct(data.retention_7d_pct), color: "text-success" },
    { icon: Activity, label: "Retenção 30d", value: fmtPct(data.retention_30d_pct), color: "text-warning" },
  ];

  const usageCards = [
    { icon: Users, label: "Usuários totais", value: data.total_users, color: "text-primary" },
    { icon: UserPlus, label: "Novos (30d)", value: data.new_users_30d, color: "text-success" },
    { icon: Activity, label: "Ativos (7d)", value: data.active_users_7d, color: "text-info" },
    { icon: ClipboardCheck, label: "Onboarded", value: data.onboarded_users, color: "text-foreground" },
    { icon: Dumbbell, label: "Treinos registrados", value: data.total_workouts, color: "text-warning" },
    { icon: ClipboardCheck, label: "Check-ins", value: data.total_checkins, color: "text-info" },
    { icon: CreditCard, label: "Assinaturas ativas", value: data.active_subscriptions, color: "text-success" },
    { icon: Calendar, label: "Renovações (30d)", value: data.renewals_next_30d, color: "text-warning" },
    { icon: TrendingUp, label: "Protocolos gerados", value: data.total_protocols, color: "text-primary" },
    { icon: AlertCircle, label: "Reembolsos pendentes", value: data.pending_refunds, color: "text-destructive" },
    { icon: Gift, label: "Cupons ativos", value: data.active_coupons, color: "text-info" },
  ];

  const plans = data.subscriptions_by_plan || {};
  const dailySignups = (data.daily_signups_30d || []) as Array<{ date: string; count: number }>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Negócio</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {businessCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4 card-gradient border-border">
              <Icon size={18} className={color} />
              <p className="text-xl font-bold text-foreground mt-1">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      </div>

      <RevenueChart />

      {dailySignups.length > 0 && (
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Novos cadastros (últimos 30 dias)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Uso & Engajamento</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {usageCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4 card-gradient border-border">
              <Icon size={18} className={color} />
              <p className="text-2xl font-bold text-foreground mt-1">{value ?? 0}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
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
