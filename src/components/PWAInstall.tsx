"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14; // re-show after 2 weeks

export default function PWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Register the service worker once the page is ready.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((e) => console.warn("[sw] registration failed", e));
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Listen for the install prompt + appinstalled.
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferred(ev);
      // Respect a recent dismissal.
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
      const ageDays = (Date.now() - dismissed) / (1000 * 60 * 60 * 24);
      if (!dismissed || ageDays > DISMISS_DAYS) setVisible(true);
    }
    function onInstalled() {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } finally {
      setDeferred(null);
      setVisible(false);
    }
  }

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode — ignore */
    }
  }

  if (installed || !visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="התקנת האפליקציה"
      className="fixed bottom-3 left-3 right-3 z-[60] mx-auto max-w-md bg-white border-2 border-primary rounded-2xl shadow-2xl p-4 flex items-center gap-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 1rem)" }}
    >
      <img src="/icons/icon-192.png" alt="" width={48} height={48} className="rounded-xl" />
      <div className="flex-1 text-right">
        <div className="font-bold text-primary">להתקין את האפליקציה?</div>
        <div className="text-xs text-text-secondary">
          גישה מהירה ממסך הבית, בלי לפתוח דפדפן
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={dismiss}
          className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-gray-50"
        >
          לא עכשיו
        </button>
        <button
          onClick={install}
          className="text-sm bg-primary text-white px-3 py-2 rounded-lg font-semibold hover:bg-primary-light"
        >
          התקנה
        </button>
      </div>
    </div>
  );
}
