"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icon";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** Đồng bộ mọi nút sáng/tối, kể cả khi menu desktop và mobile cùng tồn tại. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
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
