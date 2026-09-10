"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Brand } from "./sidebar";
import { Icon } from "./icon";

/** Top-nav cho các trang công khai ((site) group). */
export function Nav() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Đến nội dung chính
      </a>
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Hanni — trang chủ">
          <Brand />
        </Link>
        <nav className="ml-4 hidden gap-6 text-sm font-medium text-muted md:flex">
          <Link href="/#cach-hoc" className="hover:text-primary">
            Cách học
          </Link>
          <Link href="/#lo-trinh" className="hover:text-primary">
            Lộ trình HSK
          </Link>
          <Link href="/nguon-du-lieu" className="hover:text-primary">
            Nguồn dữ liệu
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {loading ? null : user ? (
            <Link
              href="/dashboard"
              className="motion-button inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg"
            >
              Vào học <Icon name="arrow" size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2 py-2 text-sm font-medium text-muted hover:text-primary"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="motion-button rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg"
              >
                Bắt đầu học
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
