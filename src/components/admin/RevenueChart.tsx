import { Card } from "@/components/ui/card";
import { useAdminSubscriptions } from "@/hooks/useAdminData";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

// Preço por plano (BRL). Ajuste conforme sua tabela real.
const PLAN_PRICES: Record<string, number> = {
  monthly: 97,
  quarterly: 247,
  semiannual: 447,
  annual: 797,
};

const planMonthlyValue = (planType: string | null | undefined): number => {
  const key = (planType || "monthly").toLowerCase();
  const price = PLAN_PRICES[key] ?? PLAN_PRICES.monthly;
  // Normaliza para receita mensal equivalente
  if (key === "quarterly") return price / 3;
  if (key === "semiannual") return price / 6;
  if (key === "annual") return price / 12;
  return price;
};

const RevenueChart = () => {
  const { data: subs = [], isLoading } = useAdminSubscriptions();

  // Gera 12 meses: do mês 11 atrás até o mês atual
  const now = new Date();
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  // Para cada mês, soma a receita mensal equivalente das assinaturas
  // ativas que já tinham começado naquele mês.
  const data = months.map((m) => {
    const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
    let mrr = 0;
    let activeCount = 0;
    for (const sub of subs) {
      if (sub.status !== "active") continue;
      const start = sub.start_date ? new Date(sub.start_date) : null;
      if (!start || start > monthEnd) continue;
      mrr += planMonthlyValue(sub.plan_type);
      activeCount += 1;
    }
    return { month: m.label, receita: Math.round(mrr), assinantes: activeCount };
  });

  const totalNow = data[data.length - 1]?.receita ?? 0;
  const totalPrev = data[data.length - 2]?.receita ?? 0;
  const delta = totalPrev > 0 ? ((totalNow - totalPrev) / totalPrev) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="p-4 card-gradient border-border">
        <p className="text-sm text-muted-foreground">Carregando receita...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 card-gradient border-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground text-sm">Receita mensal (MRR)</h3>
          <p className="text-xs text-muted-foreground">Últimos 12 meses · estimativa baseada no plano</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">
            R$ {totalNow.toLocaleString("pt-BR")}
          </p>
          <p className={`text-[10px] flex items-center gap-1 justify-end ${delta >= 0 ? "text-success" : "text-destructive"}`}>
            <TrendingUp size={10} />
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs mês ant.
          </p>
        </div>
      </div>

      <ChartContainer
        config={{
          receita: { label: "Receita (R$)", color: "hsl(var(--primary))" },
        }}
        className="h-[200px] w-full"
      >
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v) => `${v}`} width={40} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground font-mono">R$ {Number(value).toLocaleString("pt-BR")}</span>
                    <span className="text-[10px] text-muted-foreground">{item.payload.assinantes} assinantes ativos</span>
                  </div>
                )}
              />
            }
          />
          <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillReceita)" />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
};

export default RevenueChart;
