import { useReferrals, useMyReferralCode } from "@/hooks/useReferrals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SectionReferrals = () => {
  const { data: referrals = [] } = useReferrals();
  const { data: code } = useMyReferralCode();
  const { toast } = useToast();

  const paidCount = referrals.filter((r) => r.paid).length;
  const totalCashback = referrals.reduce((sum, r) => sum + Number(r.cashback_amount || 0), 0);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast({ title: "Código copiado!" });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Indicações</h3>
      <Card className="p-3 card-gradient border-border space-y-3">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-primary" />
          <span className="text-sm text-foreground font-medium">Seu código</span>
        </div>
        {code ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-sm text-primary font-mono">{code}</code>
            <Button variant="ghost" size="icon" onClick={copyCode} className="shrink-0">
              <Copy size={14} />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum código disponível</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-secondary rounded p-2">
            <p className="text-lg font-bold text-foreground">{paidCount}</p>
            <p className="text-[10px] text-muted-foreground">Pagas</p>
          </div>
          <div className="bg-secondary rounded p-2">
            <p className="text-lg font-bold text-primary">R$ {totalCashback.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Cashback</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SectionReferrals;
