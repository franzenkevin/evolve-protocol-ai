import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, CheckCircle2, AlertTriangle, MoreVertical } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAlreadyInstalled: () => void;
  variant: "ios" | "in-app" | "android-manual";
}

export default function InstallInstructionsModal({ open, onClose, onAlreadyInstalled, variant }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        {variant === "ios" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Instalar EVORIA no iPhone</DialogTitle>
              <DialogDescription>3 passos rápidos no Safari</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Share size={18} className="text-primary" />
                    <p className="font-semibold text-foreground">Toque em Compartilhar</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Na barra inferior do Safari, toque no ícone de compartilhamento (quadrado com seta para cima ↑).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PlusSquare size={18} className="text-primary" />
                    <p className="font-semibold text-foreground">"Adicionar à Tela de Início"</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Role o menu pra baixo até encontrar essa opção e toque nela.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-primary" />
                    <p className="font-semibold text-foreground">Toque em "Adicionar"</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O ícone do EVORIA vai aparecer na sua tela inicial. Pronto!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={onAlreadyInstalled} variant="default">
                Já instalei
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                Fechar
              </Button>
            </div>
          </>
        )}

        {variant === "android-manual" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Instalar EVORIA no Android</DialogTitle>
              <DialogDescription>Use o menu do navegador</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MoreVertical size={18} className="text-primary" />
                    <p className="font-semibold text-foreground">Abra o menu do navegador</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Toque nos 3 pontinhos (⋮) no canto superior direito do Chrome.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Escolha "Instalar app"</p>
                  <p className="text-sm text-muted-foreground">
                    Ou "Adicionar à tela inicial" — o nome muda dependendo do navegador.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-primary" />
                    <p className="font-semibold text-foreground">Confirme em "Instalar"</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O EVORIA vai aparecer na sua tela inicial como um app normal.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={onAlreadyInstalled} variant="default">Já instalei</Button>
              <Button onClick={onClose} variant="ghost" size="sm">Fechar</Button>
            </div>
          </>
        )}

        {variant === "in-app" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading flex items-center gap-2">
                <AlertTriangle size={20} className="text-primary" />
                Abra no navegador
              </DialogTitle>
              <DialogDescription>
                Você está num navegador interno (Instagram, Facebook ou similar). Pra instalar o app, precisa abrir no navegador real.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <p className="text-sm font-semibold text-foreground mb-2">Como fazer:</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>Toque no menu (⋯ ou •••) no canto da tela</li>
                  <li>Escolha <strong>"Abrir no navegador"</strong> ou <strong>"Abrir no Chrome/Safari"</strong></li>
                  <li>Quando o site abrir no navegador, este aviso vai aparecer de novo</li>
                </ol>
              </div>
            </div>

            <Button onClick={onClose} variant="default">Entendi</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
