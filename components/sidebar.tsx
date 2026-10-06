"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStudyStats } from "@/lib/hooks";
import { useMessagesSocket, useUnreadMessageCount } from "@/lib/messages";
import { Icon, type IconName } from "./icon";

type NavLink = { href: string; label: string; icon: IconName };
type NavGroup = { label: string; icon: IconName; children: NavLink[] };
type NavItem = NavLink | NavGroup;

/** Điều hướng kiểu Hanbeego (user chỉ đích danh làm mẫu, 2026-10-06): mục
 * chính luôn hiện, công cụ phụ gom thành NHÓM THU GỌN (tự mở khi đang ở trang
 * trong nhóm) — thấy hết tính năng ngay ở sidebar mà không thành 16 dòng rời
 * rạc như trước, cũng không giấu sau một trang "Khám phá" phải bấm thêm. */
export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "HỌC TẬP",
    items: [
      { href: "/learn", label: "Trang chủ", icon: "home" },
      { href: "/study", label: "Ôn tập & flashcard", icon: "cards" },
      { href: "/thi-thu-hsk", label: "Luyện thi HSK", icon: "target" },
      {
        label: "Kỹ năng",
        icon: "headphones",
        children: [
          { href: "/listening", label: "Luyện nghe", icon: "headphones" },
          { href: "/pronunciation", label: "Luyện phát âm", icon: "mic" },
          { href: "/roleplay", label: "Luyện nói với AI", icon: "sound" },
          { href: "/writing", label: "Luyện viết chữ Hán", icon: "pencil" },
        ],
      },
      {
        label: "Từ vựng & ngữ pháp",
        icon: "book",
        children: [
          { href: "/tu-dien", label: "Từ điển", icon: "search" },
          { href: "/ngu-phap", label: "Ngữ pháp & mẫu câu", icon: "book" },
          { href: "/tu-da-biet", label: "Từ bạn đã biết sẵn", icon: "heart" },
        ],
      },
    ],
  },
  {
    title: "GIẢI TRÍ & CỘNG ĐỒNG",
    items: [
      {
        label: "Video & trò chơi",
        icon: "play",
        children: [
          { href: "/watch", label: "Học qua video", icon: "play" },
          { href: "/minigame", label: "Trò chơi & Đấu 1v1", icon: "spark" },
        ],
      },
      { href: "/leaderboard", label: "Xếp hạng", icon: "trophy" },
      { href: "/messages", label: "Tin nhắn", icon: "message" },
    ],
  },
  {
    title: "CỦA BẠN",
    items: [
      { href: "/progress", label: "Tiến độ", icon: "chart" },
      { href: "/account", label: "Tài khoản", icon: "user" },
    ],
  },
];

/** Mọi đường dẫn trong menu (trải phẳng nhóm) — để thanh trên biết tên trang. */
export const NAV_LINKS: NavLink[] = NAV_SECTIONS.flatMap((s) =>
  s.items.flatMap((i) => ("children" in i ? i.children : [i])),
);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/hanni.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl"
        sizes="40px"
      />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight">
            Hanni<span className="text-primary">.</span>
          </span>
          <span className="mt-0.5 block text-[10px] text-muted">
            Học tiếng Trung mỗi ngày
          </span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const { data: unread } = useUnreadMessageCount();
  const { data: stats } = useStudyStats();
  const due = stats?.dueNow ?? 0;
  // Sidebar nằm trong app-shell nên luôn mount ở mọi trang — nghe socket ở
  // đây để badge chưa đọc cập nhật realtime dù đang không mở /messages
  // (trang /messages tự nghe thêm 1 lần nữa cho đúng hội thoại đang xem,
  // 2 listener cùng lúc trên 1 event vô hại, socket.io-client tự dedupe kết
  // nối theo URL).
  useMessagesSocket(null);
  // Nhóm nào người dùng đã tự bấm mở/đóng thì theo lựa chọn đó; chưa bấm thì
  // tự mở nếu đang ở 1 trang trong nhóm.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  function badge(href: string) {
    if (href === "/messages" && unread?.count)
      return (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-fg shadow-2xs">
          {unread.count > 9 ? "9+" : unread.count}
        </span>
      );
    if (href === "/study" && due > 0)
      return (
        <span
          title={`${due} từ cần ôn`}
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 text-[10px] font-bold text-primary"
        >
          {due > 99 ? "99+" : due}
        </span>
      );
    return null;
  }

  return (
    <div className="flex min-h-full flex-col p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-6 px-2 pt-2"
        aria-label="Hanni — trang chủ"
      >
        <Brand />
      </Link>
      <nav aria-label="Điều hướng học tập" className="space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[.14em] text-muted/80 uppercase">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                if (!("children" in item))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className="nav-item text-[13px]!"
                    >
                      <Icon name={item.icon} size={18} />
                      <span>{item.label}</span>
                      {badge(item.href)}
                    </Link>
                  );
                const inside = item.children.some((c) => isActive(pathname, c.href));
                const open = toggled[item.label] ?? inside;
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => setToggled((t) => ({ ...t, [item.label]: !open }))}
                      aria-expanded={open}
                      className={`nav-item w-full text-left text-[13px]! ${inside ? "font-semibold text-foreground" : ""}`}
                    >
                      <Icon name={item.icon} size={18} />
                      <span>{item.label}</span>
                      <Icon
                        name="chevron"
                        size={14}
                        className={`ml-auto text-muted transition-transform ${open ? "rotate-90" : ""}`}
                      />
                    </button>
                    {open && (
                      <div className="mt-1 ml-[22px] space-y-0.5 border-l border-border/80 pl-2.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            aria-current={isActive(pathname, child.href) ? "page" : undefined}
                            className="nav-item py-2! text-[12.5px]!"
                          >
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 to-accent/5 px-3 py-2.5 shadow-2xs">
          <Image
            src="/anhloading.png"
            alt=""
            width={48}
            height={40}
            className="h-10 w-12 shrink-0 object-contain"
          />
          <p className="text-[11px] leading-snug text-muted">
            <span className="block font-bold text-primary">Mỗi ngày một chút</span>
            Mỗi từ bạn nhớ là một bước tiến.
          </p>
        </div>
        <div className="border-t border-border/70 pt-3">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await logout();
              onNavigate?.();
              setBusy(false);
            }}
            className="nav-item w-full text-left text-xs! hover:text-danger hover:bg-danger/8 disabled:opacity-50"
          >
            <Icon name="logout" size={16} />
            {busy ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
