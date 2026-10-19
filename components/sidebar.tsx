"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth";
import { useStudyStats } from "@/lib/hooks";
import { ACCOUNT_LINK, INSTALL_LINK, isNavActive, NAV_MAIN, NAV_MORE, type NavLink } from "@/lib/nav";
import { usePwaState } from "@/lib/pwa/store";
import { Icon } from "./icon";

const COLLAPSE_KEY = "hanni:sidebar-collapsed";
const collapseListeners = new Set<() => void>();

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void) {
  collapseListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    collapseListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Sidebar máy tính thu về dải biểu tượng hay không — nhớ trên máy này
 * (Wikimedia đo: ai đã thu gọn thì phần lớn giữ nguyên như vậy). */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const setCollapsed = (value: boolean) => {
    try {
      localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
    } catch {
      /* bỏ qua — chỉ là tuỳ chọn hiển thị */
    }
    collapseListeners.forEach((l) => l());
  };
  return [collapsed, setCollapsed] as const;
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
          <span className="mt-0.5 block text-xs text-muted">
            Học tiếng Trung mỗi ngày
          </span>
        </span>
      )}
    </span>
  );
}

/** Số nhỏ cạnh mục menu: từ cần ôn (tin nhắn chưa đọc nằm ở nút tin nhắn trên thanh trên). */
export function useNavBadges() {
  const { data: stats } = useStudyStats();
  return { due: stats?.dueNow ?? 0 };
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  /** Máy tính: chỉ còn dải biểu tượng (rê chuột thấy tên mục). */
  collapsed?: boolean;
  /** Có thì hiện nút thu gọn/mở rộng (chỉ sidebar máy tính). */
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const { due } = useNavBadges();
  const pwa = usePwaState();
  const canInstall = pwa.initialized && !pwa.standalone && !pwa.installed;

  function badge(href: string) {
    const count = href === "/study" ? due : 0;
    if (!count) return null;
    const text = count > 99 ? "99+" : count;
    return (
      <span
        title={`${count} từ cần ôn`}
        className={`flex items-center justify-center rounded-full font-bold bg-primary/12 text-primary ${
          collapsed
            ? "absolute top-1 right-1.5 h-4 min-w-4 px-1 text-[9px]"
            : "ml-auto h-5 min-w-5 px-1.5 text-xs"
        }`}
      >
        {text}
      </span>
    );
  }

  const item = (link: NavLink, small = false) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={onNavigate}
      title={collapsed ? link.label : undefined}
      aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
      className={`nav-item ${small ? "text-xs!" : "text-[13px]!"} ${collapsed ? "justify-center px-0!" : ""}`}
    >
      <Icon name={link.icon} size={small ? 16 : 18} />
      <span className={collapsed ? "sr-only" : ""}>{link.label}</span>
      {badge(link.href)}
    </Link>
  );

  return (
    <div className={`flex min-h-full flex-col ${collapsed ? "items-stretch px-2.5 py-4" : "p-4"}`}>
      <Link
        href="/"
        onClick={onNavigate}
        className={`mb-6 pt-2 ${collapsed ? "flex justify-center" : "px-2"}`}
        aria-label="Hanni — trang chủ"
      >
        <Brand compact={collapsed} />
      </Link>
      <nav aria-label="Điều hướng học tập">
        <div className="space-y-1">{NAV_MAIN.map((l) => item(l))}</div>
        <div className="my-4 border-t border-border/70" />
        <div className="space-y-1">{NAV_MORE.map((l) => item(l))}</div>
      </nav>
      <div className="mt-auto pt-6">
        <div className="space-y-0.5 border-t border-border/70 pt-3">
          {canInstall && item(INSTALL_LINK, true)}
          {!user && (
            // Khách: lối đăng nhập/tạo tài khoản thay cho Tài khoản/Đăng xuất.
            <>
              {item({ href: `/login?next=${encodeURIComponent(pathname)}`, label: "Đăng nhập", icon: "user" }, true)}
              {item({ href: `/register?next=${encodeURIComponent(pathname)}`, label: "Tạo tài khoản miễn phí", icon: "plus" }, true)}
            </>
          )}
          {user && item(ACCOUNT_LINK, true)}
          {user && <button
            disabled={busy}
            title={collapsed ? "Đăng xuất" : undefined}
            onClick={async () => {
              setBusy(true);
              await logout();
              onNavigate?.();
              setBusy(false);
            }}
            className={`nav-item w-full text-left text-xs! hover:text-danger hover:bg-danger/8 disabled:opacity-50 ${
              collapsed ? "justify-center px-0!" : ""
            }`}
          >
            <Icon name="logout" size={16} />
            <span className={collapsed ? "sr-only" : ""}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</span>
          </button>}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              title={collapsed ? "Mở rộng menu" : undefined}
              aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
              className={`nav-item w-full text-left text-xs! ${collapsed ? "justify-center px-0!" : ""}`}
            >
              <Icon name="sidebar" size={16} />
              {!collapsed && <span>Thu gọn menu</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
