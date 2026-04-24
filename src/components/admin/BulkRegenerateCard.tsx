import { useState } from "react";
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
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Admin tool to regenerate every active user's protocol.
 * Use after global rule/system-prompt changes (e.g. fasting, schedules,
 * diet equivalence fixes) so existing students get the corrected plan.
 */
export default function BulkRegenerateCard() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [eligible, setEligible] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastResult, setLastResult] = useState<
    { success: number; failed: number; total: number } | null
  >(null);

  const dryRun = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-bulk-regenerate",
        { body: { dryRun: true } },
      );
      if (error) throw error;
      setEligible(data?.eligible_users ?? 0);
      toast({
        title: "Pré-visualização",
        description: `${data?.eligible_users ?? 0} aluno(s) com protocolo ativo serão regerados.`,
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const runBulk = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "admin-bulk-regenerate",
        {
          body: {
            reason:
              "Reajuste global pós-correções de jejum, horários de refeição e equivalência da dieta.",
          },
        },
      );
      if (error) throw error;
      setLastResult({
        success: data?.success ?? 0,
        failed: data?.failed ?? 0,
        total: data?.total ?? 0,
      });
      toast({
        title: "Reajuste concluído",
        description: `${data?.success ?? 0}/${data?.total ?? 0} protocolos regerados com sucesso.`,
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <RefreshCw size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold text-foreground">
            Reajustar protocolos dos alunos ativos
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Roda a IA novamente pra todos os alunos com protocolo ativo, aplicando as
            últimas correções (jejum, horários, equivalência da dieta). O protocolo antigo
            é arquivado e um novo de 60 dias é criado.
          </p>

          {eligible !== null && !lastResult && (
            <Badge variant="outline" className="mt-2 text-[10px]">
              {eligible} aluno(s) elegíveis
            </Badge>
          )}

          {lastResult && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                {lastResult.success} ok
              </Badge>
              {lastResult.failed > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {lastResult.failed} falharam
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                de {lastResult.total} total
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={dryRun}
              disabled={running}
              className="h-8 text-xs"
            >
              {running && eligible === null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Pré-visualizar"
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={running}
              className="h-8 text-xs"
            >
              {running && eligible !== null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Regerar todos"
              )}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-destructive" />
              Regerar protocolos em massa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai chamar a IA pra cada aluno com protocolo ativo
              {eligible !== null ? ` (${eligible} aluno(s))` : ""} e substituir o protocolo
              atual por um novo de 60 dias. Os logs de treino e check-ins continuam
              preservados. Pode levar alguns minutos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={runBulk}>Confirmar e regerar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
