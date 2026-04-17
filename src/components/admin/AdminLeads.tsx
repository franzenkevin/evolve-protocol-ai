import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useLeads, useUpdateLead, useDeleteLead, useCreateLead, type Lead } from "@/hooks/useLeads";
import { useLogAudit } from "@/hooks/useAuditLog";
import { useToast } from "@/hooks/use-toast";
import { Download, Search, Plus, Trash2, Pencil, Mail, Phone } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contatado" },
  { value: "qualified", label: "Qualificado" },
  { value: "converted", label: "Convertido" },
  { value: "lost", label: "Perdido" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "default",
  contacted: "secondary",
  qualified: "default",
  converted: "default",
  lost: "outline",
};

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

const emptyDraft: Partial<Lead> = {
  name: "",
  email: "",
  phone: "",
  source: "manual",
  goal: "",
  notes: "",
  status: "new",
};

const AdminLeads = () => {
  const { data: leads = [], isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createLead = useCreateLead();
  const logAudit = useLogAudit();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [draft, setDraft] = useState<Partial<Lead>>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.email.toLowerCase().includes(q) ||
      l.name?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.goal?.toLowerCase().includes(q)
    );
  });

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setDraft({ ...lead });
  };

  const handleSave = async () => {
    if (!draft.email) {
      toast({ title: "Email obrigatório", variant: "destructive" });
      return;
    }
    try {
      if (editing) {
        await updateLead.mutateAsync({ id: editing.id, ...draft });
        await logAudit("update_lead", null, { lead_id: editing.id, email: draft.email });
        toast({ title: "Lead atualizado" });
      } else {
        await createLead.mutateAsync(draft as any);
        await logAudit("create_lead", null, { email: draft.email });
        toast({ title: "Lead criado" });
      }
      setEditing(null);
      setCreating(false);
      setDraft(emptyDraft);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const lead = leads.find((l) => l.id === deletingId);
      await deleteLead.mutateAsync(deletingId);
      await logAudit("delete_lead", null, { lead_id: deletingId, email: lead?.email });
      toast({ title: "Lead removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const rows = filtered.map((l) => ({
      nome: l.name || "",
      email: l.email,
      telefone: l.phone || "",
      origem: l.source || "",
      objetivo: l.goal || "",
      status: l.status,
      notas: l.notes || "",
      criado_em: l.created_at,
    }));
    downloadCSV(`leads-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logAudit("export_leads", null, { count: rows.length });
  };

  const dialogOpen = !!editing || creating;
  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setDraft(emptyDraft);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email, telefone, objetivo..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1" onClick={handleExport}>
          <Download size={14} /> CSV
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setCreating(true)}>
          <Plus size={14} /> Novo lead
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} lead(s) {leads.length !== filtered.length && `de ${leads.length}`}
      </p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((l) => (
          <Card key={l.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-foreground truncate">
                    {l.name || "(sem nome)"}
                  </p>
                  <Badge variant={(STATUS_COLORS[l.status] as any) || "outline"} className="text-[9px]">
                    {STATUS_OPTIONS.find((s) => s.value === l.status)?.label || l.status}
                  </Badge>
                  {l.source && (
                    <Badge variant="outline" className="text-[9px]">
                      {l.source}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                  <Mail size={10} /> {l.email}
                </p>
                {l.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone size={10} /> {l.phone}
                  </p>
                )}
                {l.goal && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">🎯 {l.goal}</p>
                )}
                {l.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">📝 {l.notes}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(l.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}>
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDeletingId(l.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum lead encontrado.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lead" : "Novo lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={draft.email || ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={draft.phone || ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Origem</Label>
                <Input
                  value={draft.source || ""}
                  onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                  placeholder="landing, instagram..."
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input
                value={draft.goal || ""}
                onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
                placeholder="Hipertrofia, emagrecer..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={draft.status || "new"}
                onValueChange={(v) => setDraft({ ...draft, status: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas internas</Label>
              <Textarea
                value={draft.notes || ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className="mt-1 h-24 resize-none"
                placeholder="Histórico de contato, preferências..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateLead.isPending || createLead.isPending}>
              {updateLead.isPending || createLead.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLeads;
