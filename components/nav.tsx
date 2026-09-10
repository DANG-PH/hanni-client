"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/study", label: "Ôn tập" },
  { href: "/vocabulary", label: "Từ vựng" },
  { href: "/progress", label: "Tiến độ" },
  { href: "/achievements", label: "Huy hiệu" },
];

export function Nav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold text-lg">
          <span className="text-primary">汉</span>Hanni
        </Link>

        {user && (
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? "bg-surface-2 text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 text-sm">
          {loading ? null : user ? (
            <>
              <Link
                href="/settings"
                className="text-muted hover:text-foreground"
              >
                {user.displayName}
              </Link>
              <button
                onClick={() => void logout()}
                className="rounded-md px-2 py-1 text-muted hover:text-foreground"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-foreground">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-fg"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>

      {user && (
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                pathname.startsWith(l.href)
                  ? "bg-surface-2"
                  : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
