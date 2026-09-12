"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useStreak } from "@/lib/hooks";
import { Brand, NAV_GROUPS, Sidebar } from "./sidebar";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "./icon";
import { Avatar } from "./avatar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const streak = useStreak();
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const pageLabel =
    NAV_GROUPS.flatMap((group) => group.links).find(
      (link) => pathname === link.href || pathname.startsWith(link.href + "/"),
    )?.label ?? "Góc học tập";
  const close = () => drawer.current?.close();
  return (
    <div className="app-workspace flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Đến nội dung chính
      </a>
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
        <div className="app-sidebar-scroll sticky top-0 h-dvh overflow-y-auto">
          <Sidebar />
        </div>
      </aside>
      <dialog
        ref={drawer}
        aria-label="Menu học tập"
        className="mobile-drawer"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="relative min-h-full bg-surface">
          <button
            type="button"
            onClick={close}
            aria-label="Đóng menu"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted"
          >
            <Icon name="close" size={18} />
          </button>
          <Sidebar onNavigate={close} />
        </div>
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-lg sm:px-7">
          <button
            type="button"
            onClick={() => drawer.current?.showModal()}
            aria-label="Mở menu"
            aria-haspopup="dialog"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 lg:hidden"
          >
            <Icon name="menu" />
          </button>
          <Link href="/" className="sm:hidden" aria-label="Hanni — trang chủ">
            <Brand compact />
          </Link>
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <Link href="/dashboard" className="text-muted hover:text-primary">
              Góc học tập
            </Link>
            <Icon name="chevron" size={12} className="text-muted" />
            <span className="font-medium">{pageLabel}</span>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {streak.data && (
              <Link
                href="/progress"
                title="Chuỗi ngày học"
                className="flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-2 text-xs font-semibold text-primary"
              >
                <Icon name="flame" size={16} />
                {streak.data.currentStreak}
                <span className="hidden md:inline">ngày</span>
              </Link>
            )}
            <NotificationBell />
            <ThemeToggle />
            <Link
              href="/account"
              aria-label="Mở tài khoản"
              className="flex min-w-0 items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-2"
            >
              {user ? (
                <Avatar user={user} size={36} />
              ) : (
                <span className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
              )}
              <span className="hidden max-w-40 truncate text-xs font-medium md:block">
                {user?.displayName}
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-border px-6 py-4 text-[10px] text-muted">
          <span>Hanni · Mỗi ngày một chút, tiến xa hơn.</span>
        </footer>
      </div>
    </div>
  );
}
