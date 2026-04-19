import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAllTestimonialsAdmin,
  useApproveTestimonial,
  useDeleteTestimonial,
} from "@/hooks/useTestimonials";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const initials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
};

const AdminTestimonials = () => {
  const { data: items = [], isLoading } = useAllTestimonialsAdmin();
  const approve = useApproveTestimonial();
  const del = useDeleteTestimonial();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await approve.mutateAsync({ id, approved });
      await logAudit(approved ? "approve_testimonial" : "unapprove_testimonial", null, { id });
      toast({ title: approved ? "Depoimento publicado" : "Depoimento despublicado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar este depoimento permanentemente?")) return;
    try {
      await del.mutateAsync(id);
      await logAudit("delete_testimonial", null, { id });
      toast({ title: "Depoimento apagado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const pending = items.filter((t) => !t.approved);
  const approved = items.filter((t) => t.approved);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <MessageSquare size={12} /> {items.length} depoimentos · {pending.length} pendente(s)
      </p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-warning uppercase tracking-wider">
            Pendentes de aprovação ({pending.length})
          </h3>
          {pending.map((t) => (
            <Card key={t.id} className="p-3 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={t.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px]">
                    {initials(t.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {t.profile?.full_name || "Aluno"}
                  </p>
                  <div className="flex items-center gap-0.5">
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
                  </div>
                </div>
              </div>
              <p className="text-sm text-foreground italic mb-3">"{t.text}"</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1 h-8"
                  onClick={() => handleApprove(t.id, true)}
                  disabled={approve.isPending}
                >
                  <Check size={12} /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-8 text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 size={12} /> Apagar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Publicados ({approved.length})
        </h3>
        {approved.map((t) => (
          <Card key={t.id} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={t.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[9px]">
                  {initials(t.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {t.profile?.full_name || "Aluno"}
                </p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={10}
                      className={s <= t.rating ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                  ))}
                  <Badge variant="default" className="ml-2 text-[9px] h-4 px-1">
                    Publicado
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-foreground italic mb-2">"{t.text}"</p>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-xs"
                onClick={() => handleApprove(t.id, false)}
              >
                <X size={11} /> Despublicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 h-7 text-xs text-destructive"
                onClick={() => handleDelete(t.id)}
              >
                <Trash2 size={11} /> Apagar
              </Button>
            </div>
          </Card>
        ))}
        {!isLoading && approved.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum depoimento publicado.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminTestimonials;
