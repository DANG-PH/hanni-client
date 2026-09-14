"use client";

import { useState } from "react";
import { Icon } from "./icon";

/** Web Share API trên di động (mở hộp thoại chia sẻ thật của hệ điều hành);
 * máy tính không hỗ trợ thì rơi về sao chép vào clipboard. `path` (không phải
 * URL đầy đủ) để tránh đụng `window` lúc render — trang này được prerender
 * tĩnh lúc build, `window` chỉ có thật lúc bấm nút ở trình duyệt. */
export function ShareButton({
  title,
  text,
  path,
  compact,
}: {
  title: string;
  text: string;
  path: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Người dùng tự huỷ hộp thoại chia sẻ — không phải lỗi, bỏ qua.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard — im lặng bỏ qua.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={`motion-button inline-flex items-center gap-1.5 rounded-full bg-primary/10 font-semibold text-primary hover:bg-primary/15 ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <Icon name={copied ? "check" : "share"} size={13} />
      {copied ? "Đã sao chép" : "Chia sẻ"}
    </button>
  );
}
