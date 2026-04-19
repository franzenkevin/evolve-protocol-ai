import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMyTickets, useCreateTicket, type SupportTicket } from "@/hooks/useSupportTickets";
import { Loader2, Send, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS: Record<SupportTicket["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  open: { label: "Aberto", variant: "default" },
  in_progress: { label: "Em andamento", variant: "secondary" },
  resolved: { label: "Resolvido", variant: "outline" },
  closed: { label: "Fechado", variant: "outline" },
};

const Support = () => {
  const { data: tickets = [], isLoading } = useMyTickets();
  const create = useCreateTicket();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    const s = subject.trim();
    const m = message.trim();
    if (s.length < 3 || s.length > 200) {
      toast.error("Assunto: entre 3 e 200 caracteres");
      return;
    }
    if (m.length < 10 || m.length > 5000) {
      toast.error("Mensagem: entre 10 e 5000 caracteres");
      return;
    }
    try {
      await create.mutateAsync({ subject: s, message: m });
      toast.success("Mensagem enviada! Em breve responderemos.");
      setSubject("");
      setMessage("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="pt-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">SAC / Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envie sua dúvida, sugestão ou problema. Respondemos diretamente aqui no app.
          </p>
        </div>

        {/* Form */}
        <Card className="p-4 card-gradient border-primary/30 space-y-3">
          <h3 className="font-heading font-semibold text-foreground text-sm">Nova mensagem</h3>
          <div>
            <label className="text-xs text-muted-foreground">Assunto</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Dúvida sobre cobrança"
              maxLength={200}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mensagem</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva detalhadamente..."
              maxLength={5000}
              className="mt-1 h-32 resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/5000</p>
          </div>
          <Button onClick={submit} disabled={create.isPending} className="w-full gap-1.5">
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar
          </Button>
        </Card>

        {/* My tickets */}
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-2 text-sm">
            Minhas mensagens
          </h2>
          {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}
          {!isLoading && tickets.length === 0 && (
            <Card className="p-6 text-center">
              <MessageSquareText size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
            </Card>
          )}
          <div className="space-y-2">
            {tickets.map((t) => {
              const status = STATUS_LABELS[t.status] || STATUS_LABELS.open;
              return (
                <Card key={t.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={status.variant} className="text-[10px] shrink-0">
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                    {t.message}
                  </p>
                  {t.admin_notes && (
                    <div className="mt-3 p-2 rounded-md bg-primary/10 border border-primary/20">
                      <p className="text-[10px] text-primary font-semibold mb-1">Resposta da equipe:</p>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {t.admin_notes}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Support;
