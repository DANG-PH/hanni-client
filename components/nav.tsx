"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Brand } from "./sidebar";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/#lo-trinh", label: "Lộ trình HSK" },
  { href: "/vocabulary", label: "Từ vựng" },
  { href: "/listening", label: "Luyện tập" },
  { href: "/exams", label: "Kiểm tra" },
];

export function Nav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-lg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Đến nội dung chính
      </a>
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center gap-5 px-5 sm:px-8">
        <Link href="/" aria-label="Hanni — trang chủ" className="shrink-0">
          <Brand />
        </Link>
        <nav
          className="mx-auto hidden items-center gap-6 text-xs font-medium text-muted lg:flex"
          aria-label="Điều hướng chính"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link relative py-6 transition-colors hover:text-primary"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {loading ? (
            <div
              className="skeleton h-9 w-24"
              aria-label="Đang tải tài khoản"
            />
          ) : user ? (
            <Link
              href="/dashboard"
              className="motion-button flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-fg"
            >
              Vào học
              <Icon name="arrow" size={15} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary sm:block"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="motion-button rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-fg sm:px-4"
              >
                Đăng ký
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} size={21} />
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="site-mobile-nav"
          aria-label="Điều hướng trên điện thoại"
          className="border-t border-border bg-surface px-5 py-3 lg:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="nav-item"
            >
              {link.label}
              <Icon name="chevron" size={15} className="ml-auto" />
            </Link>
          ))}
          <Link
            href={user ? "/account" : "/login"}
            onClick={() => setOpen(false)}
            className="nav-item"
          >
            {user ? "Tài khoản của tôi" : "Đăng nhập"}
          </Link>
          <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-2 text-xs text-muted">
            <span>Giao diện sáng / tối</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
