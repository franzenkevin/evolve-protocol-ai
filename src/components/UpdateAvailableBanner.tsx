import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CURRENT_BUILD = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";
const CHECK_INTERVAL_MS = 60_000; // 1 min

const isPreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com"));

export function UpdateAvailableBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);

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
          setHasUpdate(true);
        }
      } catch {
        // network errors ignored
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

  if (!hasUpdate) return null;

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
            Atualize para receber as últimas melhorias.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0"
          onClick={() => {
            // Limpa caches e recarrega forçando network
            (async () => {
              try {
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
              } catch {
                /* ignore */
              }
              window.location.reload();
            })();
          }}
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}
