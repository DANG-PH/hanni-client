"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon, type IconName } from "./icon";

const MAIN: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "home" },
  { href: "/learn", label: "Lộ trình học", icon: "route" },
  { href: "/study", label: "Ôn tập", icon: "cards" },
  { href: "/vocabulary", label: "Từ vựng", icon: "book" },
  { href: "/progress", label: "Tiến độ", icon: "chart" },
  { href: "/achievements", label: "Huy hiệu", icon: "trophy" },
];

const SOON = ["Luyện nghe", "Luyện nói", "Luyện thi HSK"];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-2xl text-primary-fg hanzi">
        汉
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-bold tracking-tight">
            Hanni<span className="text-primary">.</span>
          </span>
          <span className="block text-[11px] text-muted">
            Học tiếng Trung dễ dàng
          </span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/dashboard" onClick={onNavigate} className="px-2 pt-2">
        <Brand />
      </Link>

      <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Học tập
        </p>
        {MAIN.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            aria-current={active(l.href) ? "page" : undefined}
            className="nav-item"
          >
            <Icon name={l.icon} size={18} />
            {l.label}
          </Link>
        ))}
      </nav>

      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Tài khoản
        </p>
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={active("/settings") ? "page" : undefined}
          className="nav-item"
        >
          <Icon name="settings" size={18} />
          Cài đặt
        </Link>
        <button
          onClick={() => void logout()}
          className="nav-item w-full text-left"
        >
          <Icon name="logout" size={18} />
          Đăng xuất
        </button>
      </nav>

      <div className="mt-auto">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Sắp có
        </p>
        {SOON.map((s) => (
          <span
            key={s}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted/70"
          >
            <Icon name="lock" size={16} />
            {s}
          </span>
        ))}
        <Link
          href="/nguon-du-lieu"
          onClick={onNavigate}
          className="mt-2 block px-3 text-xs text-muted hover:text-primary"
        >
          Nguồn dữ liệu
        </Link>
      </div>
    </div>
  );
}
