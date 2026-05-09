import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageCircleHeart, Check } from "lucide-react";
import { useActiveProtocol } from "@/hooks/useProtocol";
import {
  useProtocolFeedbackForProtocol,
  useSubmitProtocolFeedback,
} from "@/hooks/useProtocolFeedback";
import { toast } from "sonner";

const ProtocolFeedbackPrompt = () => {
  const { data: protocol } = useActiveProtocol();
  const { data: existing, isLoading } = useProtocolFeedbackForProtocol(protocol?.id);
  const submit = useSubmitProtocolFeedback();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  if (!protocol || isLoading) return null;
  if (existing) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Escolha uma nota de 1 a 5");
      return;
    }
    try {
      await submit.mutateAsync({
        protocol_id: protocol.id,
        protocol_version: protocol.version,
        rating,
        text: text.trim(),
      });
      toast.success("Obrigado! Seu feedback foi enviado.");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar");
    }
  };

  return (
    <Card className="p-4 card-gradient border-primary/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <MessageCircleHeart size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground text-sm">
            O que achou do protocolo que recebeu?
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Ajude-nos a sempre estar otimizando o processo.
          </p>

          {!open ? (
            <Button size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Avaliar agora
            </Button>
          ) : (
            <div className="space-y-3 mt-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5">
                    <Star
                      size={24}
                      className={s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">{rating}/5</span>
              </div>
              <Textarea
                placeholder="O que funcionou bem? O que podemos melhorar?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                className="h-24 text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={submit.isPending}
                >
                  Depois
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleSubmit}
                  disabled={submit.isPending}
                >
                  {submit.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProtocolFeedbackPrompt;
