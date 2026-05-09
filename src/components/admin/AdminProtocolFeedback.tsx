import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAdminProtocolFeedback,
  useUpdateAdminFeedbackNotes,
  useSendFeedbackEmail,
} from "@/hooks/useProtocolFeedback";
import { useAdminEmails } from "@/hooks/useAdminData";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, Mail, Save, MessageSquare, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const initials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
};

const AdminProtocolFeedback = () => {
  const { data: items = [], isLoading } = useAdminProtocolFeedback();
  const { data: emails = {} } = useAdminEmails();
  const updateNotes = useUpdateAdminFeedbackNotes();
  const sendEmail = useSendFeedbackEmail();
  const { toast } = useToast();

  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [emailDialog, setEmailDialog] = useState<null | {
    id: string;
    to: string;
    name: string;
  }>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const stats = useMemo(() => {
    if (!items.length) return { avg: 0, count: 0 };
    const avg = items.reduce((s, i) => s + i.rating, 0) / items.length;
    return { avg: Math.round(avg * 10) / 10, count: items.length };
  }, [items]);

  const handleSaveNotes = async (id: string) => {
    try {
      await updateNotes.mutateAsync({ id, admin_notes: notesDraft[id] || "" });
      toast({ title: "Notas salvas" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const openEmail = (id: string, userId: string, name: string) => {
    const to = emails[userId];
    if (!to) {
      toast({ title: "E-mail do usuário não encontrado", variant: "destructive" });
      return;
    }
    setEmailSubject(`Sobre seu feedback do protocolo - Evoria`);
    setEmailMessage(
      `Olá ${name?.split(" ")[0] || ""},\n\nRecebemos seu feedback sobre o protocolo e queremos te ajudar.\n\n`,
    );
    setEmailDialog({ id, to, name });
  };

  const handleSendEmail = async () => {
    if (!emailDialog) return;
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({ title: "Preencha assunto e mensagem", variant: "destructive" });
      return;
    }
    try {
      await sendEmail.mutateAsync({
        id: emailDialog.id,
        to: emailDialog.to,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      toast({ title: "E-mail enviado" });
      setEmailDialog(null);
    } catch (e: any) {
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.count}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Nota média</p>
          <p className="text-2xl font-bold text-primary">{stats.avg || "—"}</p>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      {!isLoading && items.length === 0 && (
        <Card className="p-6 text-center">
          <MessageSquare size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum feedback de protocolo ainda.</p>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((t) => {
          const name = t.profile?.full_name || "Aluno";
          const draft = notesDraft[t.id] ?? t.admin_notes ?? "";
          return (
            <Card key={t.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={t.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px]">{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        className={s <= t.rating ? "fill-primary text-primary" : "text-muted-foreground"}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {t.protocol_version && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        v{t.protocol_version}
                      </Badge>
                    )}
                    {t.admin_email_sent_at && (
                      <Badge className="bg-success/15 text-success border-success/30 text-[9px] h-4 px-1 gap-0.5">
                        <CheckCircle2 size={8} /> e-mail enviado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {t.text && (
                <p className="text-sm text-foreground italic leading-relaxed">"{t.text}"</p>
              )}

              <Textarea
                placeholder="Notas internas (não vão para o usuário)..."
                value={draft}
                onChange={(e) => setNotesDraft((p) => ({ ...p, [t.id]: e.target.value }))}
                className="h-16 text-xs resize-none"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-7 text-xs"
                  onClick={() => handleSaveNotes(t.id)}
                  disabled={updateNotes.isPending}
                >
                  <Save size={11} /> Salvar nota
                </Button>
                <Button
                  size="sm"
                  className="gap-1 h-7 text-xs"
                  onClick={() => openEmail(t.id, t.user_id, name)}
                >
                  <Mail size={11} /> Enviar e-mail
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!emailDialog} onOpenChange={(o) => !o && setEmailDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar e-mail para {emailDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Para</p>
              <Input value={emailDialog?.to || ""} disabled />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Assunto</p>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Mensagem</p>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="h-40"
                maxLength={4000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sendEmail.isPending} className="gap-1.5">
              {sendEmail.isPending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProtocolFeedback;
