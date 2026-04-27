import { useEffect, useState, useCallback } from "react";

type Platform = "ios" | "android" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "evoria_install_prompt_v1";
// Reaparece a cada 24h, no máximo 5 vezes; depois para definitivamente
const DISMISS_COOLDOWN_HOURS = 24;
const MAX_DISMISSALS = 5;
const SHOW_DELAY_MS = 15000;

interface PromptState {
  dismissals: number;
  lastDismissedAt: number | null;
  installedAt: number | null;
}

function loadState(): PromptState {
  if (typeof localStorage === "undefined") {
    return { dismissals: 0, lastDismissedAt: null, installedAt: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dismissals: 0, lastDismissedAt: null, installedAt: null };
    return JSON.parse(raw) as PromptState;
  } catch {
    return { dismissals: 0, lastDismissedAt: null, installedAt: null };
  }
}

function saveState(state: PromptState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || navigator.vendor || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Instagram, Facebook, Line, WhatsApp, TikTok, Twitter in-app browsers
  return /Instagram|FBAN|FBAV|FB_IAB|Line\/|WhatsApp|MicroMessenger|TikTok|Twitter/i.test(ua);
}

export function useInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShowBanner, setShouldShowBanner] = useState(false);

  // Initial detection
  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    setInAppBrowser(isInAppBrowser());
  }, []);

  // Listen for native install prompt (Android/Desktop Chrome/Edge)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      const state = loadState();
      saveState({ ...state, installedAt: Date.now() });
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // Decide whether to show the floating banner (after delay)
  useEffect(() => {
    if (installed) return;
    if (platform !== "ios" && platform !== "android") return;

    const state = loadState();

    // Already installed before? Never show again.
    if (state.installedAt) return;

    // Hit max dismissals?
    if (state.dismissals >= MAX_DISMISSALS) return;

    // Recently dismissed? Wait cooldown.
    if (state.lastDismissedAt) {
      const daysSince = (Date.now() - state.lastDismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_COOLDOWN_DAYS) return;
    }

    const timer = setTimeout(() => setShouldShowBanner(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [platform, installed]);

  const triggerInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "ios-manual" | "in-app"> => {
    if (inAppBrowser) return "in-app";
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        const state = loadState();
        saveState({ ...state, installedAt: Date.now() });
      }
      return outcome;
    }
    // iOS or no native prompt available → manual instructions
    return "ios-manual";
  }, [deferredPrompt, inAppBrowser]);

  const dismissBanner = useCallback(() => {
    const state = loadState();
    saveState({
      ...state,
      dismissals: state.dismissals + 1,
      lastDismissedAt: Date.now(),
    });
    setShouldShowBanner(false);
  }, []);

  const markAsInstalled = useCallback(() => {
    const state = loadState();
    saveState({ ...state, installedAt: Date.now() });
    setInstalled(true);
    setShouldShowBanner(false);
  }, []);

  return {
    platform,
    installed,
    inAppBrowser,
    canInstallNatively: !!deferredPrompt,
    shouldShowBanner,
    triggerInstall,
    dismissBanner,
    markAsInstalled,
  };
}
