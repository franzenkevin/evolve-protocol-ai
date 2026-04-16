import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Calendar, Link as LinkIcon } from "lucide-react";
import { useAllMeetings, useCreateMeeting, useUpdateMeeting, useDeleteMeeting, type LiveMeeting } from "@/hooks/useLiveMeetings";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";

const emptyForm = { title: "", description: "", scheduled_at: "", duration_minutes: "60", meeting_url: "" };

const AdminMeetings = () => {
  const { data: meetings = [], isLoading } = useAllMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();
  const logAudit = useLogAudit();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiveMeeting | null>(null);
  const [deleting, setDeleting] = useState<LiveMeeting | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (m: LiveMeeting) => {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description ?? "",
      scheduled_at: m.scheduled_at.slice(0, 16),
      duration_minutes: String(m.duration_minutes ?? 60),
      meeting_url: m.meeting_url ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.scheduled_at) {
      toast({ title: "Preencha título e data", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: parseInt(form.duration_minutes) || 60,
      meeting_url: form.meeting_url || null,
    };
    try {
      if (editing) {
        await updateMeeting.mutateAsync({ id: editing.id, ...payload });
        await logAudit("update_meeting", null, { meeting_id: editing.id, title: payload.title });
        toast({ title: "Reunião atualizada" });
      } else {
        const created = await createMeeting.mutateAsync(payload);
        await logAudit("create_meeting", null, { meeting_id: created.id, title: payload.title });
        toast({ title: "Reunião criada" });
      }
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMeeting.mutateAsync(deleting.id);
      await logAudit("delete_meeting", null, { meeting_id: deleting.id, title: deleting.title });
      toast({ title: "Reunião excluída" });
      setDeleting(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{meetings.length} reuniões cadastradas</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={openCreate}><Plus size={14} />Nova reunião</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar reunião" : "Nova reunião ao vivo"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 h-20 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data/hora *</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="mt-1" /></div>
                <div><Label>Duração (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label>URL (Zoom/Meet)</Label><Input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://..." className="mt-1" /></div>
              <Button onClick={handleSave} className="w-full" disabled={createMeeting.isPending || updateMeeting.isPending}>
                {(createMeeting.isPending || updateMeeting.isPending) ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}
      {!isLoading && meetings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma reunião cadastrada.</p>}

      {meetings.map((m) => {
        const isPast = new Date(m.scheduled_at) < new Date();
        return (
          <Card key={m.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-foreground">{m.title}</p>
                  {isPast ? <Badge variant="outline" className="text-[9px]">Passada</Badge> : <Badge className="text-[9px]">Próxima</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(m.scheduled_at).toLocaleString("pt-BR")} • {m.duration_minutes ?? 60}min
                </p>
                {m.meeting_url && (
                  <a href={m.meeting_url} target="_blank" rel="noreferrer" className="text-xs text-primary mt-1 flex items-center gap-1 truncate">
                    <LinkIcon size={11} />{m.meeting_url}
                  </a>
                )}
                {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil size={13} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(m)}><Trash2 size={13} /></Button>
              </div>
            </div>
          </Card>
        );
      })}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.title}" será removida. Esta ação será registrada na auditoria.</AlertDialogDescription>
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

export default AdminMeetings;
