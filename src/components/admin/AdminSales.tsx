import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminSubscriptions, useAdminProfiles } from "@/hooks/useAdminData";
import { Download, Search } from "lucide-react";

const toCSV = (rows: Record<string, any>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
};

const downloadCSV = (filename: string, rows: Record<string, any>[]) => {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminSales = () => {
  const { data: subs = [], isLoading } = useAdminSubscriptions();
  const { data: profiles = [] } = useAdminProfiles();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "canceled" | "past_due">("all");

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const filtered = subs.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (!search) return true;
    const p = profileMap.get(s.user_id);
    const q = search.toLowerCase();
    return (
      p?.full_name?.toLowerCase().includes(q) ||
      s.user_id.toLowerCase().includes(q) ||
      s.plan_type?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const rows = filtered.map((s) => {
      const p = profileMap.get(s.user_id);
      return {
        user_id: s.user_id,
        nome: p?.full_name || "",
        plano: s.plan_type,
        status: s.status,
        inicio: s.start_date,
        proxima_cobranca: s.next_billing_date,
        metodo: s.payment_method,
        bandeira: s.payment_brand,
        last4: s.payment_last4,
      };
    });
    downloadCSV(`vendas-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário/plano..." className="pl-9" />
        </div>
        {(["all", "active", "canceled", "past_due"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "canceled" ? "Cancelados" : "Em atraso"}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
          <Download size={14} /> CSV
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} assinatura(s)</p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((s) => {
          const p = profileMap.get(s.user_id);
          return (
            <Card key={s.id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{p?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.plan_type} • Início {s.start_date} {s.next_billing_date && `• Próx. ${s.next_billing_date}`}
                </p>
                {s.payment_brand && (
                  <p className="text-[10px] text-muted-foreground">{s.payment_brand} •••• {s.payment_last4}</p>
                )}
              </div>
              <Badge variant={s.status === "active" ? "default" : "outline"} className="shrink-0">
                {s.status}
              </Badge>
            </Card>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma assinatura encontrada.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSales;
