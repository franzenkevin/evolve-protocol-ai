import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CURRENT_BUILD = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";
const CHECK_INTERVAL_MS = 60_000; // 1 min

const isPreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com"));

// Rotas onde NÃO devemos recarregar silenciosamente (interromperia o usuário)
const SENSITIVE_ROUTES = [
  "/training",
  "/onboarding",
  "/checkin",
  "/feedback",
  "/criar-senha",
  "/reset-password",
  "/checkout",
  "/new-protocol",
];

function isSensitiveRoute(pathname: string) {
  return SENSITIVE_ROUTES.some((p) => pathname.startsWith(p));
}

async function clearCachesAndReload() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export function UpdateAvailableBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const location = useLocation();
  const hasUpdateRef = useRef(false);
  const reloadingRef = useRef(false);

  // Polling de versão
  useEffect(() => {
    if (isPreview || CURRENT_BUILD === "dev") return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (!cancelled && data.buildId && data.buildId !== CURRENT_BUILD) {
          hasUpdateRef.current = true;
          setHasUpdate(true);
        }
      } catch {
        /* ignora erros de rede */
      }
    }

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  // Auto-reload silencioso quando seguro
  useEffect(() => {
    if (!hasUpdate || reloadingRef.current) return;

    const tryAutoReload = () => {
      if (reloadingRef.current) return;
      // Não recarrega em rota sensível
      if (isSensitiveRoute(window.location.pathname)) return;
      // Não recarrega se a aba está visível e o usuário interagiu recentemente
      // (recarrega quando a aba está oculta = experiência silenciosa)
      if (document.visibilityState !== "hidden") return;
      reloadingRef.current = true;
      void clearCachesAndReload();
    };

    // Tenta logo
    tryAutoReload();

    const onVisibility = () => tryAutoReload();
    document.addEventListener("visibilitychange", onVisibility);

    // Fallback: quando o usuário navega entre rotas e a nova rota não é sensível,
    // recarrega na próxima troca de rota silenciosa.
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasUpdate, location.pathname]);

  // Tenta recarregar ao trocar de rota (se a nova rota não for sensível)
  useEffect(() => {
    if (!hasUpdate || reloadingRef.current) return;
    if (isSensitiveRoute(location.pathname)) return;
    // Recarrega silenciosamente após pequena espera (deixa a navegação completar)
    const t = window.setTimeout(() => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      void clearCachesAndReload();
    }, 800);
    return () => window.clearTimeout(t);
  }, [hasUpdate, location.pathname]);

  // Mostra banner apenas em rotas sensíveis (onde não fizemos auto-reload)
  if (!hasUpdate) return null;
  if (!isSensitiveRoute(location.pathname)) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-[92vw] sm:max-w-md w-full px-4 sm:px-0">
      <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-elevated p-3 sm:p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <RefreshCw size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">
            Nova versão disponível
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Atualize quando terminar para receber as últimas melhorias.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            reloadingRef.current = true;
            void clearCachesAndReload();
          }}
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}
