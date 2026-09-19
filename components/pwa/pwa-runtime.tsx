"use client";

import { useEffect } from "react";
import { updatePwaState, type InstallPromptEvent } from "@/lib/pwa/store";

const INSTALLED_KEY = "hanni-pwa-installed";

/** Đọc cờ "đã từng cài" lưu ở lần trước — best-effort, có thể sai trên iOS vì
 * ứng dụng Thêm-vào-MHC dùng vùng nhớ RIÊNG với tab Safari thường (không đọc
 * lại được cờ đã lưu lúc chạy trong app), chấp nhận đánh đổi này. */
function readInstalledFlag(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}
function persistInstalledFlag() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* trình duyệt có thể chặn bộ nhớ cục bộ */
  }
}

/** Giữ install prompt trong phiên; chỉ đăng ký worker ở production qua HTTPS/localhost. */
export function PwaRuntime() {
  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const standalone = () =>
      displayMode.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // `installed` khác `standalone` (đang CHẠY ở chế độ app ngay lúc này) —
    // true cả khi đã cài nhưng đang xem ở tab trình duyệt thường, để không
    // hiện lại lời mời cài cho người ĐÃ cài (xem ghi chú kiểu ở store.ts).
    const markInstalled = () => {
      persistInstalledFlag();
      updatePwaState({ installed: true });
    };
    const syncDisplay = () => {
      const isStandalone = standalone();
      updatePwaState({ standalone: isStandalone });
      if (isStandalone) markInstalled();
    };
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      updatePwaState({ installPrompt: event as InstallPromptEvent });
    };
    const onInstalled = () => {
      updatePwaState({ standalone: true, installPrompt: null });
      markInstalled();
    };
    const onOnline = () => updatePwaState({ online: true });
    const onOffline = () => updatePwaState({ online: false });
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    displayMode.addEventListener("change", syncDisplay);
    const isStandaloneNow = standalone();
    updatePwaState({
      initialized: true,
      standalone: isStandaloneNow,
      installed: isStandaloneNow || readInstalledFlag(),
      ios:
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
      online: navigator.onLine,
    });
    if (isStandaloneNow) persistInstalledFlag();

    // Chrome/Edge: tín hiệu ĐÁNG TIN CẬY hơn cờ tự lưu ở trên, không cần đợi
    // từng thấy `standalone`/`appinstalled` trên ĐÚNG trình duyệt này trước
    // đó — cần khai `related_applications` tự tham chiếu trong manifest.ts.
    const relatedApps = (
      navigator as Navigator & {
        getInstalledRelatedApps?: () => Promise<unknown[]>;
      }
    ).getInstalledRelatedApps;
    if (relatedApps) {
      void relatedApps
        .call(navigator)
        .then((apps) => {
          if (!disposed && apps.length > 0) markInstalled();
        })
        .catch(() => undefined);
    }

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
