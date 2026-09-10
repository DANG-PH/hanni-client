"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getPwaState, updatePwaState, usePwaState } from "@/lib/pwa/store";

const SNOOZE_KEY = "hanni-pwa-prompt-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

function snoozed(): boolean {
  try {
    const saved = Number(localStorage.getItem(SNOOZE_KEY));
    return Boolean(saved) && Date.now() - saved < SNOOZE_MS;
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  } catch {
    /* trình duyệt có thể chặn bộ nhớ cục bộ */
  }
}

/**
 * Popup mời cài ứng dụng, nổi ở góc phải dưới. Chỉ hiện khi có sự kiện cài
 * thật của trình duyệt (hoặc hướng dẫn cho iOS). Người dùng tắt được — tạm ẩn
 * 7 ngày.
 */
export function InstallPrompt() {
  const { initialized, standalone, ios, online, installPrompt, workerStatus } =
    usePwaState();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(
    () => typeof window === "undefined" || snoozed(),
  );
  const [busy, setBusy] = useState(false);

  function dismiss() {
    remember();
    setHidden(true);
  }

  async function install() {
    const prompt = getPwaState().installPrompt;
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      /* trình duyệt tự báo lỗi nếu có */
    } finally {
      if (getPwaState().installPrompt === prompt)
        updatePwaState({ installPrompt: null });
      remember();
      setBusy(false);
      setHidden(true);
    }
  }

  const iosHint = ios && !installPrompt;
  const devPreview =
    process.env.NODE_ENV !== "production" &&
    workerStatus === "development" &&
    !installPrompt &&
    !ios;

  const show =
    initialized &&
    online &&
    !standalone &&
    !hidden &&
    pathname !== "/install" &&
    (Boolean(installPrompt) || iosHint || devPreview);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cài ứng dụng Hanni"
      className="fixed inset-x-4 bottom-4 z-[60] sm:left-auto sm:right-5 sm:bottom-5 sm:w-[21rem]"
      style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
    >
      <div className="relative rounded-2xl border border-primary/20 bg-surface p-4 shadow-2xl ring-1 ring-primary/10">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng lời mời cài đặt"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-border"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Cài Hanni về máy</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              Mở nhanh từ màn hình chính, học mượt như một ứng dụng thật.
            </p>
          </div>
        </div>

        {iosHint ? (
          <>
            <p className="mt-3 text-xs leading-5 text-muted">
              Trên iPhone/iPad: mở bằng Safari, chọn{" "}
              <strong className="text-foreground">Chia sẻ</strong> rồi{" "}
              <strong className="text-foreground">Thêm vào Màn hình chính</strong>
              .
            </p>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" onClick={dismiss}>
                Đã hiểu
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1"
                disabled={busy || devPreview}
                onClick={() => void install()}
              >
                <Icon name="home" size={16} />
                {busy ? "Đang mở…" : "Cài đặt"}
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                Để sau
              </Button>
            </div>
            {devPreview && (
              <p className="mt-2 text-[11px] leading-4 text-muted">
                Bản xem thử — lời mời cài thật chỉ xuất hiện ở bản đã triển khai
                (HTTPS).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
