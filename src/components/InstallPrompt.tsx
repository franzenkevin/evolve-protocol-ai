import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import InstallInstructionsModal from "./InstallInstructionsModal";
import logo from "@/assets/logo.png";

// Routes where the floating prompt should NOT appear (avoid disrupting critical flows)
const HIDDEN_ROUTES = [
  "/onboarding",
  "/welcome",
  "/plans",
  "/checkout",
  "/accept-terms",
  "/instalar",
  "/install",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/admin",
];

export default function InstallPrompt() {
  const location = useLocation();
  const {
    platform,
    installed,
    inAppBrowser,
    canInstallNatively,
    shouldShowBanner,
    triggerInstall,
    dismissBanner,
    markAsInstalled,
  } = useInstallPrompt();

  const [modalVariant, setModalVariant] = useState<"ios" | "in-app" | "android-manual" | null>(null);

  // Hide on critical routes
  const isHiddenRoute = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));

  if (installed) return null;
  if (isHiddenRoute) return null;
  if (!shouldShowBanner) return null;
  if (platform !== "ios" && platform !== "android") return null;

  const handleInstall = async () => {
    const result = await triggerInstall();
    if (result === "ios-manual") {
      setModalVariant("ios");
    } else if (result === "in-app") {
      setModalVariant("in-app");
    } else if (result === "dismissed" && platform === "android" && !canInstallNatively) {
      setModalVariant("android-manual");
    }
    // "accepted" → app installs, banner disappears via `appinstalled` event
  };

  const handleAlreadyInstalled = () => {
    markAsInstalled();
    setModalVariant(null);
  };

  return (
    <>
      <div
        className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-500"
        role="dialog"
        aria-label="Instalar EVORIA como app"
      >
        <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 p-4 backdrop-blur-xl">
          <button
            onClick={dismissBanner}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 mb-3 pr-7">
            <img src={logo} alt="" className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-foreground text-sm leading-tight mb-0.5">
                Instale o EVORIA no celular
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                Acesso rápido com 1 toque, sem abrir o navegador.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 h-10 font-semibold"
            >
              <Download size={16} className="mr-1.5" />
              {platform === "ios" ? "Como instalar" : "Instalar agora"}
            </Button>
            <Button
              onClick={dismissBanner}
              size="sm"
              variant="ghost"
              className="h-10 text-muted-foreground"
            >
              Agora não
            </Button>
          </div>

          {inAppBrowser && (
            <p className="text-[10px] text-amber-500/90 mt-2 text-center">
              ⚠️ Para instalar, abra no Safari ou Chrome
            </p>
          )}
        </div>
      </div>

      <InstallInstructionsModal
        open={modalVariant !== null}
        onClose={() => setModalVariant(null)}
        onAlreadyInstalled={handleAlreadyInstalled}
        variant={modalVariant ?? "ios"}
      />
    </>
  );
}
