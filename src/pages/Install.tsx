import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Share, PlusSquare, Download, CheckCircle2, Smartphone, Monitor, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Platform = "ios" | "android" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || navigator.vendor || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const Step = ({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex gap-4">
    <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-heading font-bold text-sm">
      {n}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-primary">{icon}</div>
        <h4 className="font-heading font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function Install() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      toast.success("EVORIA instalado com sucesso!");
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.info("Seu navegador não suporta instalação automática. Use o menu do navegador para 'Adicionar à tela inicial'.");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("Instalação iniciada!");
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <img src={logo} alt="EVORIA" className="w-8 h-8" />
          <span className="font-heading font-bold text-foreground tracking-tight">EVORIA</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary font-medium mb-4">
            <Download size={14} /> Instalar no celular
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-3">
            Tenha o <span className="text-gradient">EVORIA</span> <br className="md:hidden" />
            na tela inicial
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Acesse seu treino, dieta e progresso com 1 toque — como um app nativo, sem passar pela App Store.
          </p>
        </div>

        {installed && (
          <Card className="p-6 mb-6 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={22} />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">EVORIA já está instalado</h3>
                <p className="text-sm text-muted-foreground">
                  Você já está usando o app instalado. É só abrir pelo ícone na sua tela inicial.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!installed && (
          <>
            <div className="flex gap-2 mb-6 p-1 bg-card border border-border rounded-xl">
              <button
                onClick={() => setPlatform("ios")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  platform === "ios" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone size={16} /> iPhone
              </button>
              <button
                onClick={() => setPlatform("android")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  platform === "android" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone size={16} /> Android
              </button>
              <button
                onClick={() => setPlatform("desktop")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  platform === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor size={16} /> Computador
              </button>
            </div>

            {platform === "ios" && (
              <Card className="p-6 md:p-8 surface-elevated">
                <div className="mb-6">
                  <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">iPhone / iPad — Safari</p>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Instale em 3 passos rápidos</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Importante: abra esta página no <strong>Safari</strong> (não no Chrome ou Instagram).
                  </p>
                </div>

                <div className="space-y-6">
                  <Step n={1} icon={<Share size={18} />} title="Toque no botão Compartilhar" desc="Na barra inferior do Safari, toque no ícone de compartilhamento (quadrado com seta para cima)." />
                  <Step n={2} icon={<PlusSquare size={18} />} title="Escolha 'Adicionar à Tela de Início'" desc="Role o menu para baixo até encontrar essa opção e toque nela." />
                  <Step n={3} icon={<CheckCircle2 size={18} />} title="Toque em 'Adicionar'" desc="O ícone do EVORIA vai aparecer na sua tela inicial. Pronto, é só abrir!" />
                </div>

                <div className="mt-8 p-5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">Como vai parecer no Safari:</p>
                  <div className="flex items-center justify-center gap-3 text-foreground">
                    <Share size={20} className="text-primary" />
                    <span className="text-xl">→</span>
                    <PlusSquare size={20} className="text-primary" />
                    <span className="text-xl">→</span>
                    <CheckCircle2 size={20} className="text-primary" />
                  </div>
                </div>
              </Card>
            )}

            {platform === "android" && (
              <Card className="p-6 md:p-8 surface-elevated">
                <div className="mb-6">
                  <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Android — Chrome / Edge / Brave</p>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Instale com 1 toque</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toque no botão abaixo. Se não aparecer, siga o passo a passo manual.
                  </p>
                </div>

                <Button onClick={handleInstallClick} size="lg" className="w-full h-14 text-base font-semibold mb-6" disabled={!deferredPrompt}>
                  <Download size={20} className="mr-2" />
                  {deferredPrompt ? "Instalar EVORIA agora" : "Aguardando navegador..."}
                </Button>

                {!deferredPrompt && (
                  <p className="text-xs text-muted-foreground text-center mb-6">
                    Seu navegador ainda não liberou o instalador automático. Use o passo a passo manual abaixo.
                  </p>
                )}

                <div className="border-t border-border pt-6 space-y-6">
                  <p className="text-sm font-semibold text-foreground">Passo a passo manual:</p>
                  <Step n={1} icon={<MoreVertical size={18} />} title="Abra o menu do navegador" desc="Toque nos 3 pontinhos no canto superior direito do Chrome." />
                  <Step n={2} icon={<Download size={18} />} title="Escolha 'Instalar app' ou 'Adicionar à tela inicial'" desc="O nome pode variar dependendo do navegador." />
                  <Step n={3} icon={<CheckCircle2 size={18} />} title="Confirme tocando em 'Instalar'" desc="O EVORIA vai aparecer na sua gaveta de apps e na tela inicial." />
                </div>
              </Card>
            )}

            {platform === "desktop" && (
              <Card className="p-6 md:p-8 surface-elevated">
                <div className="mb-6">
                  <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Computador — Chrome / Edge</p>
                  <h2 className="text-2xl font-heading font-bold text-foreground">Instale como aplicativo de desktop</h2>
                </div>

                <Button onClick={handleInstallClick} size="lg" className="w-full h-14 text-base font-semibold mb-6" disabled={!deferredPrompt}>
                  <Download size={20} className="mr-2" />
                  {deferredPrompt ? "Instalar EVORIA" : "Aguardando navegador..."}
                </Button>

                <div className="border-t border-border pt-6 space-y-6">
                  <Step n={1} icon={<Download size={18} />} title="Procure o ícone de instalação" desc="Na barra de endereço, à direita, aparece um ícone de instalação (computador com seta)." />
                  <Step n={2} icon={<CheckCircle2 size={18} />} title="Clique em 'Instalar'" desc="O EVORIA abre em uma janela própria, separada do navegador." />
                </div>
              </Card>
            )}

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Acesso rápido", desc: "1 toque na tela inicial" },
                { title: "Tela cheia", desc: "Sem barras do navegador" },
                { title: "Notificações", desc: "Lembretes de treino e check-in" },
              ].map((b) => (
                <div key={b.title} className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-heading font-semibold text-foreground mb-1">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
