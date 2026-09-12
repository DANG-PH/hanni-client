"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icon";

function isDarkNow(): boolean {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark") return true;
  if (explicit === "light") return false;
  // Chưa từng bấm toggle thì theo prefers-color-scheme của hệ điều hành.
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** Đồng bộ mọi nút sáng/tối, kể cả khi menu desktop và mobile cùng tồn tại. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("hanni-theme", next);
    } catch {
      /* Chế độ riêng tư có thể chặn lưu tùy chọn. */
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      aria-pressed={dark}
      title="Sáng / tối"
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
