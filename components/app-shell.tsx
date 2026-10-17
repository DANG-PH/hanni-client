"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useStreak } from "@/lib/hooks";
import { pageLabel } from "@/lib/nav";
import { BottomNav } from "./bottom-nav";
import { Brand, Sidebar, useSidebarCollapsed } from "./sidebar";
import { AssistantWidget } from "./assistant-widget";
import { NotificationBell } from "./notification-bell";
import { StreakCelebration } from "./streak-celebration";
import { ThemeToggle } from "./theme-toggle";
import { Icon } from "./icon";
import { Avatar } from "./avatar";
import { StudyLoader } from "./study-loader";
import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const streak = useStreak();
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const close = () => drawer.current?.close();
  if (loading)
    return (
      <StudyLoader
        variant="startup"
        label="Đang chuẩn bị không gian học của bạn…"
      />
    );
  return (
    <div
      className={`app-workspace flex min-h-screen bg-background ${styles.workspace}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Đến nội dung chính
      </a>
      <aside
        data-collapsed={collapsed}
        className={`hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 lg:block ${
          collapsed ? "w-[76px]" : "w-60"
        } ${styles.sidebar}`}
      >
        <div className="app-sidebar-scroll sticky top-0 h-dvh overflow-y-auto">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
      </aside>
      <dialog
        ref={drawer}
        aria-label="Menu học tập"
        className={`mobile-drawer ${styles.drawer}`}
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
      <div className="flex min-w-0 flex-1 flex-col pb-[var(--bottom-nav-h)]">
        <header
          className={`sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-lg sm:px-7 ${styles.topbar}`}
        >
          <Link href="/" className="sm:hidden" aria-label="Hanni — trang chủ">
            <Brand compact />
          </Link>
          <div
            className={`hidden items-center gap-2 text-xs sm:flex ${styles.breadcrumb}`}
          >
            <Link href="/learn" className="text-muted hover:text-primary">
              Góc học tập
            </Link>
            <Icon name="chevron" size={12} className="text-muted" />
            <span className="font-medium">{pageLabel(pathname)}</span>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {streak.data && (
              <Link
                href="/progress"
                title="Chuỗi ngày học"
                className={`flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-2 text-xs font-semibold text-primary ${styles.streak}`}
              >
                <Icon name="flame" size={16} />
                {streak.data.currentStreak}
                <span className="hidden md:inline">ngày</span>
                {/* Lá chắn kiếm được (mốc 7 ngày, mời bạn, mua bằng xu) trước
                 * đây KHÔNG hiện ở đâu cả — phần thưởng vô hình thì không tạo
                 * được động lực nào. `streakFreezeCount` đã có sẵn trong
                 * `GET /streak` từ lâu mà chưa UI nào đọc. */}
                {streak.data.streakFreezeCount > 0 && (
                  <span
                    title={`${streak.data.streakFreezeCount} lá chắn — giữ chuỗi nếu bạn lỡ nghỉ 1 ngày`}
                    className="ml-0.5 flex items-center gap-0.5 border-l border-primary/20 pl-1.5 text-[11px]"
                  >
                    <Icon name="heart" size={13} />
                    {streak.data.streakFreezeCount}
                  </span>
                )}
              </Link>
            )}
            <NotificationBell />
            <ThemeToggle />
            <Link
              href="/account"
              aria-label="Mở tài khoản"
              className={`flex min-w-0 items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-2 ${styles.account}`}
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
        <footer
          className={`mt-auto border-t border-border px-6 py-4 text-[10px] text-muted ${styles.footer}`}
        >
          <span>Hanni · Mỗi ngày một chút, tiến xa hơn.</span>
        </footer>
      </div>
      <BottomNav onMore={() => drawer.current?.showModal()} />
      {/* Trang chat (tin nhắn, luyện nói AI) có ô soạn ở đáy — bong bóng trợ lý đè đúng nút Gửi. */}
      {user && !/^\/(messages|roleplay)(\/|$)/.test(pathname) && <AssistantWidget />}
      {user && <StreakCelebration />}
    </div>
  );
}
