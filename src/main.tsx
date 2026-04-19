import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const APP_BUILD_ID = "2026-04-19T16:10Z";

// Guard: never register SW in iframes or preview hosts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

document.documentElement.setAttribute("data-app-build", APP_BUILD_ID);

createRoot(document.getElementById("root")!).render(<App />);
