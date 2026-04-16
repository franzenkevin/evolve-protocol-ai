import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, DollarSign } from "lucide-react";
import { useAllRefunds, useUpdateRefund, type RefundRequest } from "@/hooks/useRefunds";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";

const statusBadge: Record<RefundRequest["status"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendente", variant: "default" },
  approved: { label: "Aprovado", variant: "outline" },
  denied: { label: "Negado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
};

const AdminRefunds = () => {
  const { user } = useAuth();
  const { data: refunds = [], isLoading } = useAllRefunds();
  const updateRefund = useUpdateRefund();
  const logAudit = useLogAudit();
  const { toast } = useToast();

  const [acting, setActing] = useState<{ refund: RefundRequest; action: "approve" | "deny" | "refunded" } | null>(null);
  const [notes, setNotes] = useState("");

  const handleConfirm = async () => {
    if (!acting || !user) return;
    const statusMap = { approve: "approved", deny: "denied", refunded: "refunded" } as const;
    const auditMap = { approve: "approve_refund", deny: "deny_refund", refunded: "mark_refunded" } as const;
    try {
      await updateRefund.mutateAsync({
        id: acting.refund.id,
        status: statusMap[acting.action],
        admin_notes: notes || undefined,
        reviewed_by: user.id,
      });
      await logAudit(auditMap[acting.action], acting.refund.user_id, { refund_id: acting.refund.id, amount: acting.refund.amount_brl });
      toast({ title: "Status atualizado" });
      setActing(null);
      setNotes("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const filterByStatus = (status: RefundRequest["status"] | "all") =>
    status === "all" ? refunds : refunds.filter((r) => r.status === status);

  const renderList = (list: RefundRequest[]) => {
    if (isLoading) return <p className="text-sm text-muted-foreground py-4">Carregando...</p>;
    if (list.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido nesta categoria.</p>;
    return list.map((r) => {
      const st = statusBadge[r.status];
      return (
        <Card key={r.id} className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={st.variant} className="text-[9px]">{st.label}</Badge>
                {r.amount_brl != null && (
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <DollarSign size={12} />R$ {Number(r.amount_brl).toFixed(2)}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">User ID: <span className="font-mono">{r.user_id.slice(0, 8)}...</span></p>
              <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{r.reason}</p>
              {r.admin_notes && <p className="text-xs text-muted-foreground mt-2 border-l-2 border-border pl-2">Nota admin: {r.admin_notes}</p>}
            </div>
          </div>
          {r.status === "pending" && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => setActing({ refund: r, action: "approve" })}>
                <Check size={13} />Aprovar
              </Button>
              <Button size="sm" variant="outline" className="gap-1 flex-1 text-destructive" onClick={() => setActing({ refund: r, action: "deny" })}>
                <X size={13} />Negar
              </Button>
            </div>
          )}
          {r.status === "approved" && (
            <Button size="sm" variant="outline" className="gap-1 mt-3 w-full" onClick={() => setActing({ refund: r, action: "refunded" })}>
              <DollarSign size={13} />Marcar como reembolsado
            </Button>
          )}
        </Card>
      );
    });
  };

  return (
    <div className="space-y-3">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({filterByStatus("approved").length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({refunds.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-3 space-y-3">{renderList(filterByStatus("pending"))}</TabsContent>
        <TabsContent value="approved" className="mt-3 space-y-3">{renderList(filterByStatus("approved"))}</TabsContent>
        <TabsContent value="all" className="mt-3 space-y-3">{renderList(filterByStatus("all"))}</TabsContent>
      </Tabs>

      <AlertDialog open={!!acting} onOpenChange={(o) => { if (!o) { setActing(null); setNotes(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {acting?.action === "approve" && "Aprovar reembolso?"}
              {acting?.action === "deny" && "Negar reembolso?"}
              {acting?.action === "refunded" && "Confirmar reembolso processado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {acting?.action === "approve" && "O usuário será notificado da aprovação. Você precisa processar o reembolso no gateway de pagamento manualmente."}
              {acting?.action === "deny" && "O usuário será notificado da negação. Adicione um motivo nas notas abaixo."}
              {acting?.action === "refunded" && "Marque apenas após processar o reembolso no gateway."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label className="text-xs">Notas internas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 h-20 resize-none" placeholder="Motivo, ID da transação no gateway, etc." />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRefunds;
