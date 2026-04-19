import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_BUILD_ID = "2026-04-19T18:25Z";
const BUILD_STORAGE_KEY = "app-build-id";

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
      void r.unregister();
    });

    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  } catch {
    // Ignore cache cleanup failures.
  }
};

void clearAppCaches();

// Detect stale build and hard-reload once if version changed between visits.
try {
  const previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
  if (previousBuild && previousBuild !== APP_BUILD_ID) {
    localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);
    const reloadedKey = `app-build-reloaded-${APP_BUILD_ID}`;
    if (!sessionStorage.getItem(reloadedKey) && !isInIframe && !isPreviewHost) {
      sessionStorage.setItem(reloadedKey, "1");
      window.location.reload();
    }
  } else if (!previousBuild) {
    localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);
  }
} catch {
  // Ignore storage failures (private mode, quota, etc.)
}

document.documentElement.setAttribute("data-app-build", APP_BUILD_ID);

createRoot(document.getElementById("root")!).render(<App />);
