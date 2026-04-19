import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_BUILD_ID = "2026-04-19T16:38Z";

// Guard: never register SW in iframes or preview hosts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

const clearAppCaches = async () => {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    regs?.forEach((r) => {
      const scriptUrl = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || "";
      if (isPreviewHost || isInIframe || scriptUrl.includes("/sw.js") || scriptUrl.includes("registerSW.js")) {
        void r.unregister();
      }
    });

    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.includes("workbox") || key.includes("precache") || key.includes("vite-plugin-pwa"))
        .map((key) => caches.delete(key)),
    );
  } catch {
    // Ignore cache cleanup failures.
  }
};

void clearAppCaches();

document.documentElement.setAttribute("data-app-build", APP_BUILD_ID);

createRoot(document.getElementById("root")!).render(<App />);
