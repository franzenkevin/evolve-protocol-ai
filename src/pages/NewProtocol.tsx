import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, ShieldCheck, ArrowLeft } from "lucide-react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import {
  useProtocolRegenStatus,
  useConsumeRegenCredit,
} from "@/hooks/useProtocolRegeneration";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const NewProtocol = () => {
  const navigate = useNavigate();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const { data: status, isLoading } = useProtocolRegenStatus();
  const { data: profile } = useProfile();
  const consume = useConsumeRegenCredit();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handlePay = () => {
    openCheckout({
      priceId: "hypertrophy_new_protocol_once",
      successUrl: `${window.location.origin}/checkout/success?type=new_protocol`,
      customData: { purchaseType: "new_protocol" },
    });
  };

  const handleGenerate = async () => {
    if (!status?.availableCredit) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-protocol", {
        body: { force_regenerate: true },
      });
      if (error) throw error;
      await consume.mutateAsync(status.availableCredit.id);
      qc.invalidateQueries({ queryKey: ["protocol"] });
      toast.success("Novo protocolo gerado com sucesso!");
      setConfirming(false);
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar protocolo");
    } finally {
      setGenerating(false);
    }
  };

  const hasCredit = !!status?.availableCredit;
  const blockedThisYear = status && !status.canPurchase && !hasCredit;

  return (
    <AppLayout>
      <PaymentTestModeBanner />
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-24 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={14} /> Voltar
        </Button>

        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Quero novo protocolo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Refaça o questionário e gere um protocolo novo de treino e dieta
            antes do próximo ciclo de 60 dias.
          </p>
        </div>

        <Card className="p-4 card-gradient border-primary/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">
                R$ 19,90 — pagamento único
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Disponível <strong className="text-foreground">1 vez ao ano</strong>.
                Após pagar, você refaz o quiz e a IA gera um novo protocolo
                imediatamente.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 card-gradient border-border space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" />
            <p className="text-sm font-medium text-foreground">
              Quando faz sentido pedir?
            </p>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• Mudou drasticamente de objetivo (cutting → bulking ou vice-versa)</li>
            <li>• Sentiu estagnação clara no progresso</li>
            <li>• Mudança importante de rotina (academia, dias livres, lesão)</li>
            <li>• Cardio, refeições ou suplementos mudaram</li>
          </ul>
        </Card>

        {isLoading ? (
          <Card className="p-6 flex justify-center">
            <Loader2 className="animate-spin text-primary" />
          </Card>
        ) : hasCredit ? (
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground">Crédito disponível</Badge>
            </div>
            <p className="text-sm text-foreground mb-3">
              Você tem 1 regeneração disponível. Clique abaixo para refazer
              seu quiz e gerar um novo protocolo.
            </p>
            <Button
              className="w-full glow gap-2"
              onClick={() => setConfirming(true)}
              disabled={generating}
            >
              <RefreshCw size={14} /> Refazer quiz e gerar novo protocolo
            </Button>
          </Card>
        ) : blockedThisYear ? (
          <Card className="p-4 border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Você já usou sua regeneração antecipada deste ano. Você poderá
              comprar uma nova daqui a 12 meses, ou aguardar o próximo ciclo
              de 60 dias para um recálculo automático.
            </p>
          </Card>
        ) : (
          <Button
            className="w-full glow gap-2 h-12 text-base"
            onClick={handlePay}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>Pagar R$ 19,90 e liberar regeneração</>
            )}
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Pagamento único, sem assinatura. Após confirmação, o crédito ficará
          disponível imediatamente para você refazer o quiz.
        </p>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir protocolo atual?</AlertDialogTitle>
            <AlertDialogDescription>
              Vamos gerar um novo protocolo de treino e dieta com base nos seus
              dados atuais ({profile?.full_name || "seu perfil"}). O protocolo
              anterior será arquivado e você não poderá voltar atrás. Esse
              crédito será consumido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "Gerar agora"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default NewProtocol;
