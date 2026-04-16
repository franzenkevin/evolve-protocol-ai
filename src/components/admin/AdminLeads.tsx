import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminProfiles } from "@/hooks/useAdminData";
import { useLogAudit } from "@/hooks/useAuditLog";
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

const AdminLeads = () => {
  const { data: profiles = [], isLoading } = useAdminProfiles();
  const logAudit = useLogAudit();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "onboarded" | "incomplete">("all");

  const filtered = profiles.filter((p) => {
    if (filter === "onboarded" && !p.onboarding_complete) return false;
    if (filter === "incomplete" && p.onboarding_complete) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.goal?.toLowerCase().includes(q);
  });

  const handleExport = () => {
    const rows = filtered.map((p) => ({
      user_id: p.user_id,
      nome: p.full_name || "",
      idade: p.age || "",
      sexo: p.sex || "",
      objetivo: p.goal || "",
      experiencia: p.experience || "",
      onboarding_completo: p.onboarding_complete ? "sim" : "não",
      consentimento_ai: p.ai_data_consent ? "sim" : "não",
      termos_aceitos_em: p.terms_accepted_at || "",
      criado_em: p.created_at,
    }));
    downloadCSV(`leads-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logAudit("export_leads", null, { count: rows.length, filter });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nome/objetivo..." className="pl-9" />
        </div>
        {(["all", "onboarded", "incomplete"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f === "onboarded" ? "Onboarded" : "Incompletos"}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
          <Download size={14} /> CSV
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} lead(s)</p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((p) => (
          <Card key={p.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{p.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.age && `${p.age}a`} {p.sex && `• ${p.sex}`} {p.goal && `• ${p.goal}`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Cadastro: {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <Badge variant={p.onboarding_complete ? "default" : "outline"} className="text-[9px]">
                  {p.onboarding_complete ? "OK" : "Pendente"}
                </Badge>
                {p.ai_data_consent && <Badge variant="outline" className="text-[9px]">AI ✓</Badge>}
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum lead encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;
