import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAdminProfiles, useAdminUserRoles, usePromoteAdmin } from "@/hooks/useAdminData";
import { ShieldCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";

const AdminUsers = () => {
  const { data: profiles = [], isLoading } = useAdminProfiles();
  const { data: roles = [] } = useAdminUserRoles();
  const promote = usePromoteAdmin();
  const { toast } = useToast();
  const logAudit = useLogAudit();
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<{ userId: string; name: string } | null>(null);

  const adminIds = new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id));

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.user_id.toLowerCase().includes(q);
  });

  const confirmPromote = async () => {
    if (!confirming) return;
    const target = confirming;
    setConfirming(null);
    try {
      await promote.mutateAsync(target.userId);
      await logAudit("promote_admin", target.userId, { name: target.name });
      toast({ title: "Promovido a admin!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário..." className="pl-9" />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} usuário(s)</p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((p) => {
          const isAdmin = adminIds.has(p.user_id);
          return (
            <Card key={p.id} className="p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground truncate">{p.full_name || "—"}</p>
                  {isAdmin && <Badge variant="default" className="text-[9px] gap-1"><ShieldCheck size={10} />admin</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{p.user_id}</p>
              </div>
              {!isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setConfirming({ userId: p.user_id, name: p.full_name || "usuário" })}
                  disabled={promote.isPending}
                >
                  Promover
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover {confirming?.name} a administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuário ganhará acesso total ao painel admin (vendas, leads, usuários, configurações).
              A ação será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromote}>Confirmar promoção</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
