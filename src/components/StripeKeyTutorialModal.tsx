import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StripeKeyTutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    n: 1,
    title: "Abrir o Stripe no celular",
    body: (
      <>
        Abra o app <strong>Stripe</strong> ou, no navegador do celular, acesse{" "}
        <a
          href="https://dashboard.stripe.com/test/apikeys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline inline-flex items-center gap-1"
        >
          dashboard.stripe.com <ExternalLink className="w-3 h-3" />
        </a>
        . Faça login se pedir.
      </>
    ),
  },
  {
    n: 2,
    title: "Confirmar Modo Teste",
    body: (
      <>
        No topo da tela, verifique se o toggle <Badge variant="secondary">Test mode</Badge> /{" "}
        <Badge variant="secondary">Modo de teste</Badge> está <strong>ativado</strong>. Vamos usar
        chave de teste primeiro, sem mexer em dinheiro real.
      </>
    ),
  },
  {
    n: 3,
    title: "Ir em Desenvolvedores",
    body: (
      <>
        Toque no ícone de menu (☰) → <strong>Desenvolvedores</strong> (ou{" "}
        <em>Developers</em>) → <strong>Chaves de API</strong> (<em>API keys</em>).
      </>
    ),
  },
  {
    n: 4,
    title: "Revelar a Secret Key",
    body: (
      <>
        Procure o card <strong>“Secret key”</strong> (Chave secreta). A chave começa com{" "}
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sk_test_...</code>. Toque em{" "}
        <strong>Reveal</strong> / <strong>Revelar</strong> e depois em{" "}
        <strong>Copy</strong> / <strong>Copiar</strong>.
      </>
    ),
  },
  {
    n: 5,
    title: "Voltar pro Lovable e me avisar",
    body: (
      <>
        Volte aqui no chat e digite <strong>"copiei"</strong>. Vou abrir um formulário seguro
        pra você colar a chave — ela é guardada criptografada e <strong>nunca</strong> aparece no
        código.
      </>
    ),
  },
];

export function StripeKeyTutorialModal({ open, onOpenChange }: StripeKeyTutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Conectar Stripe pelo celular</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 mt-1">
                <Smartphone className="w-3.5 h-3.5" />
                Passo a passo rápido (~2 min)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-5">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {step.n}
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-100 leading-relaxed">
                <strong>Importante:</strong> use a chave que começa com{" "}
                <code className="bg-black/30 px-1 rounded">sk_test_</code>. A{" "}
                <code className="bg-black/30 px-1 rounded">sk_live_</code> só depois de testar tudo.
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Segurança:</strong> a chave fica em variável de ambiente criptografada
                no backend. Nunca aparece no código nem no navegador.
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30 flex flex-col gap-2">
          <Button
            asChild
            className="w-full"
            size="lg"
          >
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Stripe agora
            </a>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
