import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_BUILD_ID = "2026-04-27T16:30Z";
const BUILD_STORAGE_KEY = "app-build-id";
const RELOAD_FLAG = `app-build-reloaded-${APP_BUILD_ID}`;

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

// ---------------------------------------------------------------------------
// Aggressive cache & service-worker eviction for returning visitors.
// Runs BEFORE React renders so users never see the stale UI.
// ---------------------------------------------------------------------------
async function purgeStaleRuntime(): Promise<boolean> {
  let didPurge = false;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        // Only unregister non-push workers (push SW lives at /sw-push.js).
        const scriptURL = reg.active?.scriptURL || "";
        if (!scriptURL.includes("sw-push.js")) {
          await reg.unregister();
          didPurge = true;
        }
      }
    }
    if ("caches" in self) {
      const keys = await caches.keys();
      if (keys.length) {
        await Promise.all(keys.map((k) => caches.delete(k)));
        didPurge = true;
      }
    }
  } catch {
    // Ignore — best effort.
  }
  return didPurge;
}

async function bootstrap() {
  // Detect previously-seen build that does not match current.
  let staleBuild = false;
  try {
    const previous = localStorage.getItem(BUILD_STORAGE_KEY);
    if (previous && previous !== APP_BUILD_ID) staleBuild = true;
    if (!previous) localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);
  } catch { /* private mode */ }

  // Always check for stale SW/cache on every load (cheap when nothing exists).
  // Skip in preview/iframe to avoid breaking Lovable editor.
  if (!isPreviewHost && !isInIframe) {
    const purged = await purgeStaleRuntime();

    // If we cleaned anything OR detected a build mismatch, hard-reload once
    // so the user gets the fresh HTML/JS bundle from the network.
    if ((purged || staleBuild) && !sessionStorage.getItem(RELOAD_FLAG)) {
      try {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID);
      } catch { /* ignore */ }
      window.location.reload();
      return; // Stop bootstrap — page is reloading.
    }

    // Persist current build marker for future visits.
    try { localStorage.setItem(BUILD_STORAGE_KEY, APP_BUILD_ID); } catch { /* ignore */ }

    // Re-register the push SW (if previously used) with fresh URL so the
    // browser bypasses any cached copy.
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register(`/sw-push.js?v=${encodeURIComponent(APP_BUILD_ID)}`, {
          updateViaCache: "none",
        });
      } catch { /* ignore — push is optional */ }
    }
  }

  document.documentElement.setAttribute("data-app-build", APP_BUILD_ID);
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
