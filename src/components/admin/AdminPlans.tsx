import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan, type Plan } from "@/hooks/usePlans";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";

const AdminPlans = () => {
  const { data: plans = [], isLoading } = usePlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const logAudit = useLogAudit();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [form, setForm] = useState({ code: "", name: "", price_brl: "", interval_months: "1" });
  const [seeding, setSeeding] = useState(false);

  const handleSeedStripe = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-seed");
      if (error) throw error;
      toast({
        title: "Stripe sincronizado",
        description: `${data?.prices?.length ?? 0} preços e ${data?.promos?.length ?? 0} cupons OK (${data?.environment})`,
      });
      console.log("stripe-seed result", data);
    } catch (err: any) {
      toast({ title: "Erro ao sincronizar", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleAdd = async () => {
    if (!form.code || !form.name || !form.price_brl) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    try {
      const created = await createPlan.mutateAsync({
        code: form.code.toLowerCase().trim(),
        name: form.name,
        price_brl: parseFloat(form.price_brl),
        interval_months: parseInt(form.interval_months) || 1,
        active: true,
      });
      await logAudit("create_plan", null, { plan_id: created.id, code: created.code });
      toast({ title: "Plano criado" });
      setForm({ code: "", name: "", price_brl: "", interval_months: "1" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (p: Plan) => {
    try {
      await updatePlan.mutateAsync({ id: p.id, active: !p.active });
      await logAudit("update_plan", null, { plan_id: p.id, active: !p.active });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deletePlan.mutateAsync(deleting.id);
      await logAudit("delete_plan", null, { plan_id: deleting.id, code: deleting.code });
      toast({ title: "Plano excluído" });
      setDeleting(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 flex items-center justify-between gap-3 border-primary/30 bg-primary/5">
        <div>
          <p className="text-sm font-medium text-foreground">Sincronizar com Stripe</p>
          <p className="text-[11px] text-muted-foreground">Cria produtos, preços (mensal R$97, anual R$897, avulso R$19,90) e cupons LANCAMENTO/LANCAMENTOANUAL na sua conta Stripe.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleSeedStripe} disabled={seeding} className="gap-1 shrink-0">
          <RefreshCw size={14} className={seeding ? "animate-spin" : ""} />{seeding ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{plans.length} planos cadastrados</p>
          <p className="text-[11px] text-muted-foreground">Usado para calcular MRR e LTV no painel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Novo plano</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo plano</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Código (único, sem espaços) *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ex: monthly" className="mt-1" /></div>
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mensal" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (R$) *</Label><Input type="number" step="0.01" value={form.price_brl} onChange={(e) => setForm({ ...form, price_brl: e.target.value })} className="mt-1" /></div>
                <div><Label>Intervalo (meses) *</Label><Input type="number" value={form.interval_months} onChange={(e) => setForm({ ...form, interval_months: e.target.value })} className="mt-1" /></div>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={createPlan.isPending}>{createPlan.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      {plans.map((p) => (
        <Card key={p.id} className="p-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm text-foreground">{p.name}</p>
              <Badge variant="outline" className="text-[9px]">{p.code}</Badge>
              {!p.active && <Badge variant="secondary" className="text-[9px]">Inativo</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {Number(p.price_brl).toFixed(2)} a cada {p.interval_months} {p.interval_months === 1 ? "mês" : "meses"}
              {" "}• MRR: R$ {(Number(p.price_brl) / p.interval_months).toFixed(2)}/mês
            </p>
          </div>
          <Switch checked={p.active} onCheckedChange={() => handleToggle(p)} />
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(p)}><Trash2 size={13} /></Button>
        </Card>
      ))}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Assinaturas existentes não serão afetadas, mas MRR/LTV deste plano deixarão de ser calculados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlans;
