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
import { Plus, Trash2, Tag, RefreshCw } from "lucide-react";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, useResyncCoupon, type Coupon } from "@/hooks/useCoupons";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";

const AdminCoupons = () => {
  const { user } = useAuth();
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const resyncCoupon = useResyncCoupon();
  const logAudit = useLogAudit();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", description: "", discount_percent: "10", valid_until: "", max_uses: "" });

  const handleAdd = async () => {
    if (!user || !form.code || !form.discount_percent) {
      toast({ title: "Preencha código e desconto", variant: "destructive" });
      return;
    }
    try {
      const created = await createCoupon.mutateAsync({
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_percent: parseInt(form.discount_percent),
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        created_by: user.id,
      });
      await logAudit("create_coupon", null, { coupon_id: created.id, code: created.code, discount: created.discount_percent });
      toast({ title: "Cupom criado" });
      setForm({ code: "", description: "", discount_percent: "10", valid_until: "", max_uses: "" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await updateCoupon.mutateAsync({ id: c.id, active: !c.active });
      await logAudit("update_coupon", null, { coupon_id: c.id, active: !c.active });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCoupon.mutateAsync(deleting.id);
      await logAudit("delete_coupon", null, { coupon_id: deleting.id, code: deleting.code });
      toast({ title: "Cupom excluído" });
      setDeleting(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const getStatus = (c: Coupon): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } => {
    if (!c.active) return { label: "Inativo", variant: "secondary" };
    if (c.valid_until && new Date(c.valid_until) < new Date()) return { label: "Expirado", variant: "destructive" };
    if (c.max_uses && c.uses_count >= c.max_uses) return { label: "Esgotado", variant: "destructive" };
    return { label: "Ativo", variant: "default" };
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{coupons.length} cupons cadastrados</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Novo cupom</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cupom de desconto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Código *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Ex: BLACKFRIDAY" className="mt-1" /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Promoção de Black Friday" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Desconto (%) *</Label><Input type="number" min={1} max={100} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="mt-1" /></div>
                <div><Label>Limite usos</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="vazio = ilimitado" className="mt-1" /></div>
              </div>
              <div><Label>Válido até</Label><Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1" /></div>
              <Button onClick={handleAdd} className="w-full" disabled={createCoupon.isPending}>{createCoupon.isPending ? "Criando..." : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}
      {!isLoading && coupons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum cupom criado.</p>}

      {coupons.map((c) => {
        const st = getStatus(c);
        return (
          <Card key={c.id} className="p-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={13} className="text-primary" />
                <p className="font-mono font-semibold text-sm text-foreground">{c.code}</p>
                <Badge variant={st.variant} className="text-[9px]">{st.label}</Badge>
                <Badge variant="outline" className="text-[9px]">{c.discount_percent}% OFF</Badge>
              </div>
              {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                Usos: {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}
                {c.valid_until && ` • Válido até ${new Date(c.valid_until).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <Switch checked={c.active} onCheckedChange={() => handleToggle(c)} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Sincronizar com Paddle"
              onClick={async () => {
                try {
                  await resyncCoupon.mutateAsync(c);
                  toast({ title: "Cupom sincronizado com Paddle" });
                } catch (e: any) {
                  toast({ title: "Erro ao sincronizar", description: e.message, variant: "destructive" });
                }
              }}
              disabled={resyncCoupon.isPending}
            >
              <RefreshCw size={13} className={resyncCoupon.isPending ? "animate-spin" : ""} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(c)}><Trash2 size={13} /></Button>
          </Card>
        );
      })}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom "{deleting?.code}"?</AlertDialogTitle>
            <AlertDialogDescription>Os resgates já feitos serão removidos junto. Esta ação será registrada na auditoria.</AlertDialogDescription>
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

export default AdminCoupons;
