import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateRefund, useMyRefunds } from "@/hooks/useRefunds";
import { useToast } from "@/hooks/use-toast";

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendente", variant: "default" },
  approved: { label: "Aprovado", variant: "outline" },
  denied: { label: "Negado", variant: "destructive" },
  refunded: { label: "Reembolsado", variant: "secondary" },
};

const RefundRequestDialog = () => {
  const { user } = useAuth();
  const { data: myRefunds = [] } = useMyRefunds(user?.id);
  const createRefund = useCreateRefund();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async () => {
    if (!user || !reason.trim()) {
      toast({ title: "Descreva o motivo", variant: "destructive" });
      return;
    }
    try {
      await createRefund.mutateAsync({
        user_id: user.id,
        reason: reason.trim(),
        amount_brl: amount ? parseFloat(amount) : null,
      });
      toast({ title: "Solicitação enviada", description: "Você será notificado quando for analisada." });
      setReason("");
      setAmount("");
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const hasPending = myRefunds.some((r) => r.status === "pending");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
          <Receipt size={18} className="text-muted-foreground" />
          <span className="text-sm text-foreground flex-1">Solicitar reembolso</span>
          {hasPending && <Badge variant="default" className="text-[9px]">Pendente</Badge>}
        </Card>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Solicitar reembolso</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Sua solicitação será analisada manualmente em até 5 dias úteis. Você receberá um retorno por email.
          </p>
          <div>
            <Label>Motivo *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Conte por que você gostaria de um reembolso..." className="mt-1 h-24 resize-none" />
          </div>
          <div>
            <Label>Valor solicitado (R$)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Opcional" className="mt-1" />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={createRefund.isPending}>
            {createRefund.isPending ? "Enviando..." : "Enviar solicitação"}
          </Button>

          {myRefunds.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico</p>
              <div className="space-y-2">
                {myRefunds.map((r) => {
                  const st = statusLabel[r.status];
                  return (
                    <div key={r.id} className="text-xs border border-border rounded p-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={st.variant} className="text-[9px]">{st.label}</Badge>
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="text-foreground mt-1 line-clamp-2">{r.reason}</p>
                      {r.admin_notes && <p className="text-muted-foreground mt-1 italic">Resposta: {r.admin_notes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestDialog;
