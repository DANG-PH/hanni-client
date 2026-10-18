"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getPwaState, updatePwaState, usePwaState } from "@/lib/pwa/store";

const SNOOZE_KEY = "hanni-pwa-prompt-dismissed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // tắt rồi thì 14 ngày sau mới mời lại
const VIEWS_KEY = "hanni-page-views";
/** Xem chừng này trang (dồn qua các lần ghé) mới mời — đủ thấy người này dùng thật. */
const VIEWS_BEFORE_PROMPT = 4;
export const INSTALL_MOMENT_EVENT = "hanni:install-moment";

/** Gọi ở khoảnh khắc vui (vừa xong bài, xem kết quả thi) — lúc dễ đồng ý cài nhất. */
export function signalInstallMoment() {
  window.dispatchEvent(new Event(INSTALL_MOMENT_EVENT));
}

/** Không chen lời mời vào lúc đang đăng nhập/đăng ký, đang học, đang làm đề. */
const QUIET_PATHS =
  /^\/(login|register|forgot-password|reset-password|auth|bai-hoc|bat-dau|onboarding|install)(\/|$)|^\/thi-thu-hsk\/(?!dang-bai)[^/]+$/;

function read(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}
function write(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* trình duyệt có thể chặn bộ nhớ cục bộ */
  }
}

/** Trình duyệt trong app Zalo/Facebook/Instagram không cài được PWA — link Hanni hay được chia sẻ qua đó. */
export function inAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Zalo|Line\//i.test(navigator.userAgent);
}

/**
 * Lời mời cài ứng dụng (PWA) — gắn ở MỌI trang (root layout), kể cả trang công
 * khai: trước 2026-10-17 nó chỉ nằm trong khung app (người đã đăng nhập) và chỉ
 * hiện từ ngày ghé thứ hai, nên người mới vào từ Google (trang chủ, từ điển,
 * thi thử) không bao giờ thấy gợi ý cài.
 *
 * Hiện ĐÚNG LÚC: ngay sau khoảnh khắc vui (`signalInstallMoment()` — xong bài,
 * kết quả thi) hoặc khi đã xem `VIEWS_BEFORE_PROMPT` trang; KHÔNG hiện lúc đang
 * đăng nhập, đang học/làm đề (`QUIET_PATHS`); tắt thì ẩn `SNOOZE_MS`. Trên điện
 * thoại là thanh mảnh trên thanh tab dưới đáy, không che màn hình:
 * - Android Chrome/Edge có `beforeinstallprompt` → nút "Cài" 1 chạm.
 * - iOS Safari (không có sự kiện đó) → 2 bước Chia sẻ → Thêm vào Màn hình chính.
 * - Trình duyệt trong Zalo/Facebook → mở bằng Safari/Chrome (kèm nút chép link).
 * - Trình duyệt Android khác → mở menu ⋮ → Cài đặt ứng dụng.
 * Máy tính chỉ mời khi có lời mời cài 1 chạm thật.
 */
export function InstallPrompt() {
  const { initialized, standalone, installed, ios, online, installPrompt } = usePwaState();
  const pathname = usePathname();
  const [eligible, setEligible] = useState(false);
  // Đọc 1 lần lúc tạo state (chỉ có trên trình duyệt; lúc server render thì
  // component luôn rỗng vì `initialized` còn false, nên không lệch hydrate).
  const [snoozed, setSnoozed] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = read(SNOOZE_KEY);
    return Boolean(saved) && Date.now() - saved < SNOOZE_MS;
  });
  const [mobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [inApp] = useState(() => typeof window !== "undefined" && inAppBrowser());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onMoment = () => setEligible(true);
    window.addEventListener(INSTALL_MOMENT_EVENT, onMoment);
    return () => window.removeEventListener(INSTALL_MOMENT_EVENT, onMoment);
  }, []);

  // Đếm trang đã xem (dồn qua các lần ghé) — đủ ngưỡng thì phát đúng tín hiệu như
  // khoảnh khắc vui (effect trên đã đăng ký nghe trước, vì effect chạy theo thứ tự).
  useEffect(() => {
    const views = read(VIEWS_KEY) + 1;
    write(VIEWS_KEY, views);
    if (views >= VIEWS_BEFORE_PROMPT) signalInstallMoment();
  }, [pathname]);

  function dismiss() {
    write(SNOOZE_KEY, Date.now());
    setSnoozed(true);
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
      if (getPwaState().installPrompt === prompt) updatePwaState({ installPrompt: null });
      dismiss();
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const mode: "prompt" | "ios" | "in-app" | "menu" | null = installPrompt
    ? "prompt"
    : !mobile
      ? null
      : inApp
        ? "in-app"
        : ios
          ? "ios"
          : "menu";

  const show =
    initialized &&
    online &&
    !standalone &&
    !installed &&
    !snoozed &&
    eligible &&
    !QUIET_PATHS.test(pathname) &&
    mode !== null;

  // Báo trạng thái hiện/ẩn THẬT ra store dùng chung — assistant-widget.tsx đọc
  // giá trị này để tự tránh đè lên lời mời.
  useEffect(() => {
    updatePwaState({ promptDialogVisible: show });
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cài ứng dụng Hanni"
      className="fixed inset-x-3 bottom-[calc(var(--bottom-nav-h,0px)_+_0.75rem)] z-[60] sm:left-auto sm:right-5 sm:w-[22rem]"
      style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
    >
      <div className="rounded-2xl border border-primary/20 bg-surface p-3 shadow-2xl ring-1 ring-primary/10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl border border-border" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Cài Hanni lên màn hình chính</p>
            <p className="text-xs leading-5 text-muted">Mở 1 chạm, toàn màn hình, nhận nhắc học mỗi ngày.</p>
          </div>
          {mode === "prompt" ? (
            <Button className="h-9 shrink-0 px-3.5! text-xs!" disabled={busy} onClick={() => void install()}>
              {busy ? "Đang mở…" : "Cài"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-9 shrink-0 px-3! text-xs!"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              Cách cài
            </Button>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Để sau"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {open && mode === "ios" && (
          <ol className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs leading-5">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
              <span>
                Bấm nút <strong>Chia sẻ</strong>{" "}
                <Icon name="share-ios" size={15} className="inline align-text-bottom text-primary" /> ở thanh dưới của Safari.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
              <span>
                Chọn <strong>Thêm vào MH chính</strong> rồi bấm <strong>Thêm</strong>.
              </span>
            </li>
          </ol>
        )}
        {open && mode === "in-app" && (
          <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs leading-5">
            <p>
              Trình duyệt trong Zalo/Facebook không cài được ứng dụng. Bấm <strong>⋯</strong> ở góc trên, chọn{" "}
              <strong>Mở bằng trình duyệt</strong> (Safari hoặc Chrome) rồi cài từ đó.
            </p>
            <Button variant="secondary" className="h-9 px-3! text-xs!" onClick={() => void copyLink()}>
              <Icon name={copied ? "check" : "share"} size={14} /> {copied ? "Đã chép liên kết" : "Chép liên kết"}
            </Button>
          </div>
        )}
        {open && mode === "menu" && (
          <p className="mt-3 border-t border-border pt-3 text-xs leading-5">
            Mở menu <strong>⋮</strong> của trình duyệt (góc trên bên phải), chọn <strong>Cài đặt ứng dụng</strong> hoặc{" "}
            <strong>Thêm vào Màn hình chính</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
