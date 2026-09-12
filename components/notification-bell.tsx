"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { Icon } from "./icon";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotificationSocket,
  useNotifications,
} from "@/lib/notifications";
import { timeAgo } from "@/lib/time";
import type { AppNotification } from "@/lib/types";

const MESSAGE: Record<AppNotification["type"], (n: AppNotification) => string> = {
  COMMENT_REPLY: (n) =>
    `${n.actor?.displayName ?? "Ai đó"} đã trả lời bình luận của bạn`,
  VIDEO_COMMENT: (n) =>
    `${n.actor?.displayName ?? "Ai đó"} đã bình luận video "${n.video?.title ?? ""}"`,
  VIDEO_LIKE: (n) =>
    `${n.actor?.displayName ?? "Ai đó"} đã thích video "${n.video?.title ?? ""}"`,
};

export function NotificationBell() {
  useNotificationSocket();
  const { data } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unread = data?.unreadCount ?? 0;

  function onItemClick(n: AppNotification) {
    if (!n.readAt) void markNotificationRead(n.id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Thông báo"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground"
      >
        <Icon name="bell" size={19} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-bold">Thông báo</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllNotificationsRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Chưa có thông báo nào.
              </p>
            ) : (
              data.items.map((n) => (
                <Link
                  key={n.id}
                  href={n.video ? `/watch/${n.video.id}` : "#"}
                  onClick={() => onItemClick(n)}
                  className={`flex gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-2 ${
                    n.readAt ? "" : "bg-primary/5"
                  }`}
                >
                  <Avatar user={n.actor ?? { displayName: "H" }} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="leading-5">{MESSAGE[n.type](n)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
