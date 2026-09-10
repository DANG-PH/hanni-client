"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";

/** Toggle sáng/tối — mặc định sáng, lưu lựa chọn vào localStorage. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("hanni-theme", next ? "dark" : "light");
    } catch {
      /* private mode */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi giao diện sáng / tối"
      title="Sáng / tối"
      className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
