"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { useUnreadMessageCount } from "@/lib/messages";

/** Tin nhắn ở thanh trên (cạnh chuông) thay cho mục menu — chỗ trong menu nhường cho "Lớp học" (2026-10-19). */
export function MessagesButton() {
  const pathname = usePathname();
  const { data } = useUnreadMessageCount();
  const count = data?.count ?? 0;
  return (
    <Link
      href="/messages"
      aria-label={count ? `Tin nhắn, ${count} chưa đọc` : "Tin nhắn"}
      aria-current={pathname.startsWith("/messages") ? "page" : undefined}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground aria-[current=page]:text-primary"
    >
      <Icon name="message" size={19} />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-fg">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
