import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useApprovedTestimonials,
  useMyTestimonial,
  useUpsertTestimonial,
} from "@/hooks/useTestimonials";
import { Star, Loader2, Pencil, Send, Quote } from "lucide-react";
import { toast } from "sonner";

const initials = (name: string | null | undefined) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

const Feedback = () => {
  const { data: testimonials = [], isLoading } = useApprovedTestimonials();
  const { data: mine } = useMyTestimonial();
  const upsert = useUpsertTestimonial();

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(mine?.rating || 0);
  const [text, setText] = useState(mine?.text || "");

  const startEdit = () => {
    setRating(mine?.rating || 0);
    setText(mine?.text || "");
    setEditing(true);
  };

  const submit = async () => {
    if (rating === 0) {
      toast.error("Escolha uma nota de 1 a 5");
      return;
    }
    if (text.trim().length < 10) {
      toast.error("Escreva pelo menos 10 caracteres");
      return;
    }
    if (text.trim().length > 1000) {
      toast.error("Máximo de 1000 caracteres");
      return;
    }
    try {
      await upsert.mutateAsync({ rating, text: text.trim(), id: mine?.id });
      toast.success(
        mine ? "Depoimento atualizado! Aguarde a aprovação da equipe." : "Depoimento enviado! Será revisado e publicado em breve.",
      );
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar depoimento");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Mural de feedbacks</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Veja o que outros alunos estão dizendo do programa e compartilhe sua experiência.
        </p>

        {/* My testimonial / form */}
        <Card className="p-4 card-gradient border-primary/30">
          {!editing && mine ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-foreground text-sm">
                  Seu depoimento
                </h3>
                <Badge
                  variant={mine.approved ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {mine.approved ? "Publicado" : "Aguardando aprovação"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={s <= mine.rating ? "fill-primary text-primary" : "text-muted-foreground"}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground italic">"{mine.text}"</p>
              <Button size="sm" variant="outline" className="gap-1.5 mt-2" onClick={startEdit}>
                <Pencil size={12} />
                Editar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-heading font-semibold text-foreground text-sm">
                {mine ? "Editar seu depoimento" : "Deixe seu depoimento"}
              </h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5">
                    <Star
                      size={26}
                      className={s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">{rating}/5</span>
              </div>
              <Textarea
                placeholder="Conte sua experiência com o programa, sua evolução, o que mais gosta..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                className="h-28 text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{text.length}/1000</p>
              <div className="flex gap-2">
                {editing && mine && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditing(false)}
                    disabled={upsert.isPending}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={submit}
                  disabled={upsert.isPending}
                >
                  {upsert.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  {mine ? "Salvar" : "Enviar"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Os depoimentos passam por aprovação antes de aparecerem no mural público.
              </p>
            </div>
          )}
        </Card>

        {/* Public wall */}
        <div>
          <h2 className="font-heading font-semibold text-foreground mb-2 text-sm">
            Depoimentos da comunidade
          </h2>
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          )}
          {!isLoading && testimonials.length === 0 && (
            <Card className="p-6 text-center">
              <Quote size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum depoimento publicado ainda. Seja o primeiro!
              </p>
            </Card>
          )}
          <div className="space-y-3">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={t.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
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
                          className={
                            s <= t.rating ? "fill-primary text-primary" : "text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feedback;
