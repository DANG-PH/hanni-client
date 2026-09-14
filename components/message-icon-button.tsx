"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icon";
import { ApiError } from "@/lib/api";
import { getOrCreateConversation } from "@/lib/messages";

/** Nút nhắn tin nhanh — mở/tạo hội thoại rồi điều hướng thẳng vào
 * `/messages`, dùng ở những nơi đã thấy tên/avatar người khác (bảng xếp
 * hạng, "So với bạn bè"...) để khỏi phải qua hồ sơ hoặc tìm lại theo tên.
 * Hội thoại MỚI (chưa từng nhắn) cần theo dõi nhau trước — báo lỗi rõ ràng
 * thay vì im lặng thất bại khi bị chặn (xem `MessagesService.getOrCreateWith()`). */
export function MessageIconButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function open() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const conversation = await getOrCreateConversation(userId);
      router.push(`/messages?c=${conversation.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "Cần theo dõi nhau trước khi nhắn tin"
          : "Chưa mở được hội thoại",
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="relative inline-flex">
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
      {error && (
        <span
          role="status"
          className="absolute top-full right-0 z-10 mt-1 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-lg"
        >
          {error}
        </span>
      )}
    </span>
  );
}
