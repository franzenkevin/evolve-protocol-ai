import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminSubscriptions, useAdminProfiles } from "@/hooks/useAdminData";
import { AlertTriangle, Calendar } from "lucide-react";

const AdminRenewals = () => {
  const { data: subs = [], isLoading } = useAdminSubscriptions();
  const { data: profiles = [] } = useAdminProfiles();
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);

  const upcoming = subs
    .filter((s) => s.status === "active" && s.next_billing_date)
    .map((s) => ({
      ...s,
      _date: new Date(s.next_billing_date!),
    }))
    .filter((s) => s._date >= today && s._date <= in30)
    .sort((a, b) => a._date.getTime() - b._date.getTime());

  const overdue = subs.filter((s) => {
    if (!s.next_billing_date || s.status !== "active") return false;
    return new Date(s.next_billing_date) < today;
  });

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider px-1 flex items-center gap-1">
            <AlertTriangle size={12} /> Em atraso ({overdue.length})
          </h3>
          {overdue.map((s) => {
            const p = profileMap.get(s.user_id);
            return (
              <Card key={s.id} className="p-3 border-destructive/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{p?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencido em {s.next_billing_date} • {s.plan_type}
                    </p>
                  </div>
                  <Badge variant="destructive">Em atraso</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1">
          <Calendar size={12} /> Próximos 30 dias ({upcoming.length})
        </h3>
        {isLoading && <p className="text-sm text-muted-foreground py-2">Carregando...</p>}
        {upcoming.map((s) => {
          const p = profileMap.get(s.user_id);
          const daysUntil = Math.ceil((s._date.getTime() - today.getTime()) / 86400000);
          return (
            <Card key={s.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{p?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {s.next_billing_date} • {s.plan_type}
                </p>
              </div>
              <Badge variant="outline">em {daysUntil}d</Badge>
            </Card>
          );
        })}
        {!isLoading && upcoming.length === 0 && overdue.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma renovação próxima.</p>
        )}
      </div>
    </div>
  );
};

export default AdminRenewals;
