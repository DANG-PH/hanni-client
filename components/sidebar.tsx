"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon, type IconName } from "./icon";

export const NAV_GROUPS: {
  title: string;
  links: { href: string; label: string; icon: IconName }[];
}[] = [
  {
    title: "KHÔNG GIAN HỌC TẬP",
    links: [
      { href: "/dashboard", label: "Tổng quan", icon: "home" },
      { href: "/learn", label: "Lộ trình HSK", icon: "route" },
      { href: "/study", label: "Ôn tập flashcard", icon: "cards" },
      { href: "/watch", label: "Học qua video", icon: "play" },
    ],
  },
  {
    title: "LUYỆN TẬP MỖI NGÀY",
    links: [
      { href: "/vocabulary", label: "Từ vựng", icon: "book" },
      { href: "/grammar", label: "Ngữ pháp & mẫu câu", icon: "cards" },
      { href: "/listening", label: "Luyện nghe", icon: "headphones" },
      { href: "/pronunciation", label: "Luyện phát âm", icon: "mic" },
      { href: "/exams", label: "Kiểm tra HSK", icon: "target" },
    ],
  },
  {
    title: "HÀNH TRÌNH CỦA BẠN",
    links: [
      { href: "/progress", label: "Tiến độ học tập", icon: "chart" },
      { href: "/achievements", label: "Huy hiệu", icon: "trophy" },
      { href: "/leaderboard", label: "Bảng xếp hạng", icon: "flame" },
      { href: "/account", label: "Tài khoản", icon: "user" },
      { href: "/settings", label: "Cài đặt", icon: "settings" },
    ],
  },
];

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
  return (
    <div className="flex min-h-full flex-col p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-7 px-2 pt-2"
        aria-label="Hanni — trang chủ"
      >
        <Brand />
      </Link>
      <nav aria-label="Điều hướng học tập" className="space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[.12em] text-muted">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/")
                      ? "page"
                      : undefined
                  }
                  className="nav-item text-[13px]!"
                >
                  <Icon name={link.icon} size={18} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="mb-4 rounded-xl border border-primary/10 bg-primary/4 px-3 py-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icon name="spark" size={15} /> Một chút mỗi ngày
          </p>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            Mỗi từ bạn nhớ là một bước tiến.
          </p>
        </div>
        <div className="border-t border-border pt-3">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await logout();
              onNavigate?.();
              setBusy(false);
            }}
            className="nav-item w-full text-left text-xs! disabled:opacity-50"
          >
            <Icon name="logout" size={16} />
            {busy ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
