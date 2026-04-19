import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAllTicketsAdmin,
  useUpdateTicket,
  type SupportTicket,
  type SupportTicketWithProfile,
} from "@/hooks/useSupportTickets";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import { MessageSquareText, Mail, Reply } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_OPTIONS: { value: SupportTicket["status"]; label: string }[] = [
  { value: "open", label: "Aberto" },
  { value: "in_progress", label: "Em andamento" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

const STATUS_VARIANT: Record<SupportTicket["status"], "default" | "secondary" | "outline"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

const AdminSupport = () => {
  const { data: tickets = [], isLoading } = useAllTicketsAdmin();
  const update = useUpdateTicket();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const [filter, setFilter] = useState<"all" | SupportTicket["status"]>("all");
  const [editing, setEditing] = useState<SupportTicketWithProfile | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftStatus, setDraftStatus] = useState<SupportTicket["status"]>("open");

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const openEdit = (t: SupportTicketWithProfile) => {
    setEditing(t);
    setDraftNotes(t.admin_notes || "");
    setDraftStatus(t.status);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await update.mutateAsync({
        id: editing.id,
        admin_notes: draftNotes,
        status: draftStatus,
      });
      await logAudit("update_support_ticket", editing.user_id, {
        ticket_id: editing.id,
        status: draftStatus,
      });
      toast({ title: "Ticket atualizado" });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({counts.all})</SelectItem>
            <SelectItem value="open">Abertos ({counts.open})</SelectItem>
            <SelectItem value="in_progress">Em andamento ({counts.in_progress})</SelectItem>
            <SelectItem value="resolved">Resolvidos ({counts.resolved})</SelectItem>
            <SelectItem value="closed">Fechados ({counts.closed})</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <MessageSquareText size={12} /> {filtered.length} de {tickets.length}
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((t) => (
          <Card key={t.id} className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.subject}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <Mail size={10} />
                  <span>{t.user_email}</span>
                  {t.profile?.full_name && <span>• {t.profile.full_name}</span>}
                  <span>• {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[t.status]} className="text-[10px] shrink-0">
                {STATUS_OPTIONS.find((s) => s.value === t.status)?.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">
              {t.message}
            </p>
            {t.admin_notes && (
              <div className="mt-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-primary font-semibold mb-0.5">Resposta:</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {t.admin_notes}
                </p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 gap-1.5 h-8"
              onClick={() => openEdit(t)}
            >
              <Reply size={12} /> Responder / Mudar status
            </Button>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum ticket nesta categoria.
          </p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Responder ticket</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">De: {editing.user_email}</p>
                <p className="text-sm font-medium mt-1">{editing.subject}</p>
                <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                  {editing.message}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Resposta interna (visível para o aluno)
                </label>
                <Textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  className="mt-1 h-32 resize-none"
                  placeholder="Escreva a resposta..."
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                💡 O aluno verá esta resposta diretamente no app, na tela do SAC dele.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
