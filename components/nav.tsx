"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon, type IconName } from "./icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "home" },
  { href: "/study", label: "Ôn tập", icon: "cards" },
  { href: "/vocabulary", label: "Từ vựng", icon: "book" },
  { href: "/progress", label: "Tiến độ", icon: "chart" },
  { href: "/achievements", label: "Huy hiệu", icon: "trophy" },
];

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-2xl text-primary-fg hanzi">
        汉
      </span>
      <span className="text-[23px] font-bold tracking-tight">
        hanni<span className="text-primary">.</span>
      </span>
    </span>
  );
}

export function Nav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-lg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Chuyển đến nội dung chính
      </a>
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href={user ? "/dashboard" : "/"} aria-label="Hanni — trang chủ">
          <Brand />
        </Link>
        {user ? (
          <nav
            aria-label="Điều hướng chính"
            className="ml-5 hidden items-center gap-1 lg:flex"
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${pathname === l.href ? "bg-primary/8 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"}`}
              >
                <Icon name={l.icon} size={17} />
                {l.label}
              </Link>
            ))}
          </nav>
        ) : (
          <nav
            aria-label="Điều hướng chính"
            className="ml-8 hidden gap-7 text-sm font-medium text-muted md:flex"
          >
            <Link href="/#cach-hoc" className="hover:text-primary">
              Cách học
            </Link>
            <Link href="/#lo-trinh" className="hover:text-primary">
              Lộ trình HSK
            </Link>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {loading ? (
            <span className="h-9 w-20 animate-pulse rounded-xl bg-surface-2" />
          ) : user ? (
            <>
              <Link
                href="/settings"
                aria-label="Cài đặt tài khoản"
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user.displayName?.slice(0, 1).toUpperCase() || "H"}
                </span>
                <span className="hidden max-w-24 truncate text-sm font-medium xl:block">
                  {user.displayName}
                </span>
              </Link>
              <button
                onClick={() => void logout()}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="hidden rounded-xl p-3 text-muted hover:bg-surface-2 lg:block"
              >
                <Icon name="logout" size={18} />
              </button>
              <button
                onClick={() => setOpen(!open)}
                aria-label={open ? "Đóng menu" : "Mở menu"}
                aria-expanded={open}
                aria-controls="mobile-nav"
                className="rounded-xl p-3 hover:bg-surface-2 lg:hidden"
              >
                <Icon name={open ? "close" : "menu"} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 py-3 text-sm font-medium text-muted hover:text-primary"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-fg sm:px-5"
              >
                Bắt đầu học
              </Link>
            </>
          )}
        </div>
      </div>
      {user && open && (
        <nav
          id="mobile-nav"
          aria-label="Điều hướng trên điện thoại"
          className="grid grid-cols-2 gap-2 border-t border-border bg-surface p-4 lg:hidden"
        >
          {[
            ...LINKS,
            { href: "/settings", label: "Cài đặt", icon: "settings" as const },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl p-3 text-sm ${pathname === l.href ? "bg-primary/8 text-primary" : "text-muted"}`}
            >
              <Icon name={l.icon} size={18} />
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="flex items-center gap-3 rounded-xl p-3 text-sm text-muted"
          >
            <Icon name="logout" size={18} />
            Đăng xuất
          </button>
        </nav>
      )}
    </header>
  );
}
