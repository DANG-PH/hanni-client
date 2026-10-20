"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icon";
import {
  markAllNotificationsRead,
  markNotificationsRead,
  useNotificationSocket,
  useNotifications,
} from "@/lib/notifications";
import { timeAgo } from "@/lib/time";
import type { AppNotification, NotificationType } from "@/lib/types";

const LOOK: Record<NotificationType, { icon: IconName; tone: string; href: string }> = {
  ACHIEVEMENT_UNLOCKED: { icon: "trophy", tone: "bg-primary/10 text-primary", href: "/achievements" },
  CLASS_ASSIGNMENT: { icon: "users", tone: "bg-lavender/12 text-lavender", href: "/lop-hoc" },
  LEAGUE_RESULT: { icon: "flag", tone: "bg-accent/10 text-accent", href: "/learn" },
  STREAK_SAVED: { icon: "shield", tone: "bg-good/10 text-good", href: "/learn" },
};

/** Huy hiệu mở cùng lúc (xong bài đầu tiên thường mở 2–3 cái) gộp thành 1 dòng. */
const GROUP_WINDOW_MS = 2 * 60_000;

function groupRows(items: AppNotification[]): AppNotification[][] {
  const rows: AppNotification[][] = [];
  for (const n of items) {
    const row = rows.at(-1);
    const prev = row?.at(-1);
    const sameBurst =
      prev?.type === "ACHIEVEMENT_UNLOCKED" &&
      n.type === "ACHIEVEMENT_UNLOCKED" &&
      Date.parse(prev.createdAt) - Date.parse(n.createdAt) <= GROUP_WINDOW_MS;
    if (row && sameBurst) row.push(n);
    else rows.push([n]);
  }
  return rows;
}

function rowText(row: AppNotification[]): string {
  const first = row[0];
  if (first.type !== "ACHIEVEMENT_UNLOCKED") return first.message ?? "Bạn có thông báo mới.";
  const names = row.map((n) => `“${n.achievement?.nameVi ?? "Huy hiệu mới"}”`);
  return row.length === 1
    ? `Bạn vừa đạt huy hiệu ${names[0]}.`
    : `Bạn vừa đạt ${row.length} huy hiệu: ${names.join(", ")}.`;
}

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
  const rows = groupRows(data?.items ?? []);

  function onRowClick(row: AppNotification[]) {
    void markNotificationsRead(row.filter((n) => !n.readAt).map((n) => n.id));
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
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        // Điện thoại: chuông nằm giữa thanh trên hẹp nên khung trải gần hết bề ngang. `fixed` ở đây tính theo
        // thanh trên (thanh có backdrop-filter nên giữ phần tử fixed bên trong) — top 72px = ngay dưới thanh 64px.
        <div className="fixed inset-x-3 top-[72px] z-40 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
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
          <div className="max-h-[min(24rem,calc(100dvh-132px))] overflow-y-auto">
            {rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm leading-6 text-muted">
                Hanni báo ở đây khi bạn đạt huy hiệu, có bài tập mới từ lớp học, có kết quả giải đấu tuần hoặc khi lá
                chắn giữ chuỗi cho bạn.
              </p>
            ) : (
              rows.map((row) => {
                const first = row[0];
                const look = LOOK[first.type];
                const isUnread = row.some((n) => !n.readAt);
                return (
                  <Link
                    key={first.id}
                    href={first.href ?? look.href}
                    onClick={() => onRowClick(row)}
                    className={`flex gap-3 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-2 ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${look.tone}`}>
                      <Icon name={look.icon} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="leading-5">{rowText(row)}</p>
                      <p className="mt-0.5 text-xs text-muted">{timeAgo(first.createdAt)}</p>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
          <Link
            href="/settings#nhac-hoc"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground"
          >
            <Icon name="settings" size={14} /> Nhận thông báo trên điện thoại, giờ nhắc học
          </Link>
        </div>
      )}
    </div>
  );
}
