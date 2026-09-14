"use client";

import { useState } from "react";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import { ApiError } from "@/lib/api";
import { useUserSearch } from "@/lib/hooks";
import { getOrCreateConversation, sendDirectMessage } from "@/lib/messages";

/** Gửi thẳng nội dung (huy hiệu, hồ sơ...) cho 1 người bạn Hanni dưới dạng
 * tin nhắn — khác `ShareButton` (chia sẻ RA NGOÀI qua Web Share API/sao
 * chép link). Tìm người nhận theo tên hoặc mã người dùng, dùng lại đúng
 * `GET /users/search` + hạ tầng nhắn tin đã có (kể cả yêu cầu theo dõi
 * nhau trước khi nhắn nếu chưa từng có hội thoại). */
export function SendToFriendButton({
  text,
  compact,
}: {
  text: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useUserSearch(q);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function sendTo(userId: string) {
    if (sendingTo) return;
    setSendingTo(userId);
    setError("");
    try {
      const conversation = await getOrCreateConversation(userId);
      await sendDirectMessage(conversation.id, text);
      setSentTo(userId);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "Cần theo dõi nhau trước khi nhắn tin"
          : "Chưa gửi được, thử lại nhé.",
      );
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`motion-button inline-flex items-center gap-1.5 rounded-full bg-surface-2 font-semibold text-muted hover:bg-primary/10 hover:text-primary ${
          compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        <Icon name="message" size={13} />
        Gửi cho bạn
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <input
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Tìm theo tên hoặc mã…"
            className="field w-full text-sm"
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          {q.trim() && isLoading && (
            <p className="mt-2 text-xs text-muted">Đang tìm…</p>
          )}
          <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto">
            {data?.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={sendingTo !== null}
                onClick={() => void sendTo(u.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 disabled:opacity-60"
              >
                <Avatar user={u} size={24} />
                <span className="min-w-0 flex-1 truncate">
                  {u.displayName}
                </span>
                {sendingTo === u.id && (
                  <Icon name="refresh" size={13} className="animate-spin" />
                )}
                {sentTo === u.id && (
                  <Icon name="check" size={13} className="text-good" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
