import { useReferrals, useMyReferralCode } from "@/hooks/useReferrals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SectionReferrals = () => {
  const { data: referrals = [] } = useReferrals();
  const { data: code } = useMyReferralCode();
  const { toast } = useToast();

  const paidCount = referrals.filter((r) => r.paid).length;
  const pendingCount = referrals.filter((r) => !r.paid).length;
  const totalCashback = referrals.reduce((sum, r) => sum + Number(r.cashback_amount || 0), 0);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!", description: "Compartilhe com seus amigos." });
  };

  const shareCode = async () => {
    if (!code) return;
    const text = `Use meu cupom ${code} no app Hypertrophy e treine com IA + acompanhamento personalizado! 💪`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hypertrophy", text });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Mensagem copiada!", description: "Cole para seus amigos." });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Indicações & Cashback</h3>
      <Card className="p-3 card-gradient border-border space-y-3">
        <div className="flex items-start gap-2">
          <Sparkles size={16} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Compartilhe seu cupom e ganhe <span className="text-primary font-semibold">10% de cashback</span> sobre a primeira compra de cada amigo indicado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Gift size={14} className="text-primary shrink-0" />
          <span className="text-xs text-foreground font-medium">Seu cupom</span>
        </div>

        {code ? (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-sm text-primary font-mono font-semibold tracking-wider text-center">{code}</code>
              <Button variant="ghost" size="icon" onClick={copyCode} className="shrink-0 h-9 w-9" aria-label="Copiar código">
                <Copy size={14} />
              </Button>
            </div>
            <Button onClick={shareCode} size="sm" className="w-full h-8 text-xs gap-1.5">
              <Share2 size={12} />
              Compartilhar com amigos
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Gerando seu cupom...</p>
        )}

        <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
          <div className="bg-secondary rounded p-2">
            <p className="text-base font-bold text-foreground">{paidCount}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Pagas</p>
          </div>
          <div className="bg-secondary rounded p-2">
            <p className="text-base font-bold text-muted-foreground">{pendingCount}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Pendentes</p>
          </div>
          <div className="bg-primary/15 rounded p-2">
            <p className="text-base font-bold text-primary">R${totalCashback.toFixed(0)}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">Cashback</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SectionReferrals;
