import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw, Users, Zap, XCircle, TrendingUp,
} from "lucide-react";

interface HealthMetrics {
  total_calls_24h: number;
  error_count_24h: number;
  error_rate_pct: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  active_users_24h: number;
  rate_limited_24h: number;
  calls_by_function: Record<string, number>;
  errors_by_function: Record<string, number>;
  hourly_volume_24h: Array<{ hour: string; count: number }>;
  top_users_24h: Array<{ user_id: string; full_name: string; calls: number; errors: number }>;
  recent_errors: Array<{ function_name: string; status: string; error_message: string | null; created_at: string }>;
}

type AlertLevel = "ok" | "warn" | "critical";

interface Alert {
  level: AlertLevel;
  title: string;
  description: string;
}

const computeAlerts = (m: HealthMetrics): Alert[] => {
  const alerts: Alert[] = [];

  if (m.error_rate_pct >= 10) {
    alerts.push({ level: "critical", title: "Taxa de erro alta", description: `${m.error_rate_pct}% das chamadas falharam nas últimas 24h. Investigar imediatamente.` });
  } else if (m.error_rate_pct >= 3) {
    alerts.push({ level: "warn", title: "Taxa de erro elevada", description: `${m.error_rate_pct}% de erro. Acompanhar de perto.` });
  }

  if (m.p95_latency_ms >= 15000) {
    alerts.push({ level: "critical", title: "Latência crítica", description: `p95 em ${(m.p95_latency_ms / 1000).toFixed(1)}s. Usuários sentindo lentidão.` });
  } else if (m.p95_latency_ms >= 8000) {
    alerts.push({ level: "warn", title: "Latência elevada", description: `p95 em ${(m.p95_latency_ms / 1000).toFixed(1)}s.` });
  }

  if (m.rate_limited_24h >= 50) {
    alerts.push({ level: "warn", title: "Muitos rate limits", description: `${m.rate_limited_24h} bloqueios por limite nas últimas 24h. Considerar ajustar limites.` });
  }

  const heavyUser = m.top_users_24h?.[0];
  if (heavyUser && heavyUser.calls >= 100) {
    alerts.push({ level: "warn", title: "Usuário com uso anormal", description: `${heavyUser.full_name} fez ${heavyUser.calls} chamadas em 24h.` });
  }

  if (alerts.length === 0) {
    alerts.push({ level: "ok", title: "Sistema saudável", description: "Sem anomalias detectadas nas últimas 24h." });
  }
  return alerts;
};

const StatCard = ({ icon: Icon, label, value, sub, tone = "default" }: any) => {
  const toneCls = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-yellow-500" : tone === "good" ? "text-primary" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${toneCls}`}>{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon size={18} className="text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

const AdminAIHealth = () => {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_ai_health_metrics");
    if (!error && data) setMetrics(data as unknown as HealthMetrics);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [autoRefresh]);

  if (loading && !metrics) return <p className="text-muted-foreground">Carregando métricas…</p>;
  if (!metrics) return <p className="text-muted-foreground">Sem dados.</p>;

  const alerts = computeAlerts(metrics);
  const errorTone = metrics.error_rate_pct >= 10 ? "danger" : metrics.error_rate_pct >= 3 ? "warn" : "good";
  const latencyTone = metrics.p95_latency_ms >= 15000 ? "danger" : metrics.p95_latency_ms >= 8000 ? "warn" : "good";

  const maxHourly = Math.max(1, ...metrics.hourly_volume_24h.map((h) => h.count));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold">IA & Saúde do Sistema</h2>
          <p className="text-xs text-muted-foreground">Janela: últimas 24h • Atualiza a cada 30s</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? "Pausar auto-refresh" : "Retomar auto-refresh"}
          </Button>
          <Button variant="ghost" size="sm" onClick={load} className="gap-1">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const Icon = a.level === "ok" ? CheckCircle2 : a.level === "warn" ? AlertTriangle : XCircle;
          const tone = a.level === "ok" ? "border-primary/40 bg-primary/5" : a.level === "warn" ? "border-yellow-500/40 bg-yellow-500/5" : "border-destructive/50 bg-destructive/10";
          const iconTone = a.level === "ok" ? "text-primary" : a.level === "warn" ? "text-yellow-500" : "text-destructive";
          return (
            <Card key={i} className={`border ${tone}`}>
              <CardContent className="p-3 flex items-start gap-3">
                <Icon size={18} className={`${iconTone} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Chamadas (24h)" value={metrics.total_calls_24h.toLocaleString("pt-BR")} />
        <StatCard icon={Users} label="Usuários ativos" value={metrics.active_users_24h.toLocaleString("pt-BR")} />
        <StatCard
          icon={Clock}
          label="Latência média"
          value={`${(metrics.avg_latency_ms / 1000).toFixed(2)}s`}
          sub={`p95: ${(metrics.p95_latency_ms / 1000).toFixed(2)}s`}
          tone={latencyTone}
        />
        <StatCard
          icon={AlertTriangle}
          label="Taxa de erro"
          value={`${metrics.error_rate_pct}%`}
          sub={`${metrics.error_count_24h} erros • ${metrics.rate_limited_24h} bloqueios`}
          tone={errorTone}
        />
      </div>

      {/* Gráfico horário */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp size={14} /> Volume por hora (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-24">
            {metrics.hourly_volume_24h.map((h, i) => {
              const heightPct = (h.count / maxHourly) * 100;
              const hourLabel = new Date(h.hour).getHours();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/30 hover:bg-primary/50 rounded-sm transition-colors relative group"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${hourLabel}h: ${h.count} chamadas`}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 whitespace-nowrap bg-popover px-1 rounded">
                      {h.count}
                    </span>
                  </div>
                  {i % 3 === 0 && <span className="text-[9px] text-muted-foreground">{hourLabel}h</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Por função */}
      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity size={14} /> Chamadas por função</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(metrics.calls_by_function).length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma chamada nas últimas 24h.</p>
            )}
            {Object.entries(metrics.calls_by_function).map(([fn, count]) => {
              const errors = metrics.errors_by_function[fn] || 0;
              const errPct = count > 0 ? (errors / count) * 100 : 0;
              return (
                <div key={fn}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{fn}</span>
                    <span className="text-muted-foreground">{count} • {errors} erros ({errPct.toFixed(1)}%)</span>
                  </div>
                  <Progress value={errPct} className="h-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users size={14} /> Top 10 usuários (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.top_users_24h.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem usuários ativos.</p>
            ) : (
              <div className="space-y-1.5">
                {metrics.top_users_24h.map((u) => (
                  <div key={u.user_id} className="flex justify-between text-xs">
                    <span className="truncate">{u.full_name}</span>
                    <div className="flex gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{u.calls} chamadas</Badge>
                      {u.errors > 0 && <Badge variant="destructive" className="text-[10px]">{u.errors} erros</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Erros recentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><XCircle size={14} /> Últimos erros</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recent_errors.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum erro nas últimas 24h. 🎉</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {metrics.recent_errors.map((e, i) => (
                <div key={i} className="text-xs p-2 rounded border border-border bg-muted/30">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-medium">{e.function_name}</span>
                    <Badge variant="outline" className="text-[10px]">{e.status}</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{e.error_message || "—"}</p>
                  <p className="text-muted-foreground/70 text-[10px] mt-0.5">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIHealth;
