"use client";

import { Icon } from "@/components/icon";
import { usePwaState } from "@/lib/pwa/store";

export function ConnectivityNotice() {
  const { online } = usePwaState();
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-start gap-2 rounded-xl border border-warn/25 bg-surface px-4 py-3 text-xs leading-6 text-foreground shadow-lg"
    >
      <Icon name="info" size={17} className="mt-0.5 shrink-0 text-warn" />
      <span>
        Thiết bị đang mất mạng. Kết nối lại trước khi gửi bài hoặc lưu thay đổi.
      </span>
    </div>
  );
}
