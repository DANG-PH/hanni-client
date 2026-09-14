"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icon";
import { getOrCreateConversation } from "@/lib/messages";

/** Nút nhắn tin nhanh — mở/tạo hội thoại rồi điều hướng thẳng vào
 * `/messages`, dùng ở những nơi đã thấy tên/avatar người khác (bảng xếp
 * hạng, "So với bạn bè"...) để khỏi phải qua hồ sơ hoặc tìm lại theo tên. */
export function MessageIconButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function open() {
    if (busy) return;
    setBusy(true);
    try {
      const conversation = await getOrCreateConversation(userId);
      router.push(`/messages?c=${conversation.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void open();
      }}
      disabled={busy}
      aria-label="Nhắn tin"
      title="Nhắn tin"
      className="motion-button inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-60"
    >
      <Icon
        name={busy ? "refresh" : "message"}
        size={13}
        className={busy ? "animate-spin" : ""}
      />
    </button>
  );
}
