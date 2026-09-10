"use client";

import { useEffect } from "react";
import { updatePwaState, type InstallPromptEvent } from "@/lib/pwa/store";

/** Giữ install prompt trong phiên; chỉ đăng ký worker ở production qua HTTPS/localhost. */
export function PwaRuntime() {
  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const standalone = () =>
      displayMode.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const syncDisplay = () => updatePwaState({ standalone: standalone() });
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      updatePwaState({ installPrompt: event as InstallPromptEvent });
    };
    const onInstalled = () =>
      updatePwaState({ standalone: true, installPrompt: null });
    const onOnline = () => updatePwaState({ online: true });
    const onOffline = () => updatePwaState({ online: false });
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    displayMode.addEventListener("change", syncDisplay);
    updatePwaState({
      initialized: true,
      standalone: standalone(),
      ios:
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      online: navigator.onLine,
    });

    if (process.env.NODE_ENV !== "production")
      updatePwaState({ workerStatus: "development" });
    else if (!window.isSecureContext || !("serviceWorker" in navigator))
      updatePwaState({ workerStatus: "unsupported" });
    else {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (disposed) return;
          updatePwaState({
            workerStatus: "ready",
            updateAvailable: Boolean(registration.waiting),
          });
          const inspectWorker = () => {
            const installing = registration.installing;
            if (!installing) return;
            const changed = () => {
              if (!disposed && installing.state === "installed")
                updatePwaState({
                  updateAvailable: Boolean(
                    navigator.serviceWorker.controller && registration.waiting,
                  ),
                });
            };
            installing.addEventListener("statechange", changed);
            cleanups.push(() =>
              installing.removeEventListener("statechange", changed),
            );
          };
          const checkUpdate = () => {
            if (document.visibilityState === "visible" && navigator.onLine)
              void registration.update().catch(() => undefined);
          };
          const onControllerChange = () =>
            updatePwaState({ updateAvailable: Boolean(registration.waiting) });
          inspectWorker();
          registration.addEventListener("updatefound", inspectWorker);
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            onControllerChange,
          );
          document.addEventListener("visibilitychange", checkUpdate);
          cleanups.push(
            () =>
              registration.removeEventListener("updatefound", inspectWorker),
            () =>
              navigator.serviceWorker.removeEventListener(
                "controllerchange",
                onControllerChange,
              ),
            () => document.removeEventListener("visibilitychange", checkUpdate),
          );
        })
        .catch(() => {
          if (!disposed) updatePwaState({ workerStatus: "error" });
        });
    }
    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      displayMode.removeEventListener("change", syncDisplay);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);
  return null;
}
