import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAdminProfiles } from "@/hooks/useAdminData";
import { ScrollText, Download, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; icon: any; variant: "default" | "outline" | "destructive" }> = {
  export_leads: { label: "Exportou leads", icon: Download, variant: "outline" },
  export_sales: { label: "Exportou vendas", icon: Download, variant: "outline" },
  promote_admin: { label: "Promoveu admin", icon: ShieldCheck, variant: "default" },
  demote_admin: { label: "Rebaixou admin", icon: ShieldOff, variant: "destructive" },
  delete_article: { label: "Apagou artigo", icon: Trash2, variant: "destructive" },
  delete_exercise: { label: "Apagou exercício", icon: Trash2, variant: "destructive" },
  delete_food: { label: "Apagou alimento", icon: Trash2, variant: "destructive" },
};

const AdminAuditLog = () => {
  const { data: entries = [], isLoading } = useAuditLog(200);
  const { data: profiles = [] } = useAdminProfiles();
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ScrollText size={14} />
        <span>{entries.length} ação(ões) registradas (últimas 200)</span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {entries.map((e) => {
          const meta = ACTION_LABELS[e.action] ?? { label: e.action, icon: ScrollText, variant: "outline" as const };
          const Icon = meta.icon;
          const adminName = profileMap.get(e.admin_id)?.full_name || e.admin_id.slice(0, 8);
          const targetName = e.target_user_id
            ? profileMap.get(e.target_user_id)?.full_name || e.target_user_id.slice(0, 8)
            : null;
          return (
            <Card key={e.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.variant} className="text-[9px] gap-1">
                      <Icon size={10} />
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mt-1 truncate">
                    <span className="font-medium">{adminName}</span>
                    {targetName && <> → <span className="text-muted-foreground">{targetName}</span></>}
                  </p>
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">
                      {JSON.stringify(e.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </Card>
          );
        })}
        {!isLoading && entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma ação registrada ainda.</p>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
