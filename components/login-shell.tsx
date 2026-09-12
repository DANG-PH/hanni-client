"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

/** Bố cục đăng nhập riêng với hình minh họa tĩnh, ổn định khi chuyển màn. */
export function LoginShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const authMode = pathname.startsWith("/register")
    ? "register"
    : pathname.startsWith("/login")
      ? "login"
      : undefined;

  return (
    <div className="login-screen" data-auth-mode={authMode}>
      <section className="login-entry">
        <header className="login-header">
          <Link
            href="/"
            aria-label="Hanni — trang chủ"
            className="flex items-center gap-2.5"
          >
            <Image
              src="/favicon.ico"
              alt=""
              width={42}
              height={42}
              unoptimized
              priority
              className="h-[42px] w-[42px] rounded-xl"
            />
            <span className="text-lg font-bold tracking-tight">
              Hanni<span className="text-primary">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              aria-label="Ngôn ngữ: Tiếng Việt"
              className="rounded-md bg-primary/8 px-2 py-1 text-[10px] font-bold tracking-wider text-primary"
            >
              VI
            </span>
          </div>
        </header>
        <main id="main-content" className="login-main">
          {children}
        </main>
        <footer className="login-footer">
          <span>© {new Date().getFullYear()} Hanni</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Icon name="back" size={13} />
            Về trang chủ
          </Link>
        </footer>
      </section>
      <aside
        className="login-story"
        aria-label="Cùng Hanni học tiếng Trung mỗi ngày"
      >
        <div className="login-story-pattern hanzi" aria-hidden="true">
          学
        </div>
        <div className="login-story-content">
          <div className="login-video-frame">
            <div className="login-video-fallback login-static-visual">
              <Image
                src="/favicon.ico"
                alt="Logo Hanni"
                width={120}
                height={120}
                unoptimized
                className="rounded-3xl"
              />
            </div>
          </div>
          <div className="login-story-copy-stack">
            <div className="login-story-copy login-story-copy-login">
              <p
                lang="zh"
                className="hanzi text-lg tracking-[.18em] text-white/75"
              >
                每天进步一点点
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                Mỗi lần quay lại,
                <br />
                một bước tiến xa hơn.
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-white/75">
                Tiếp nối những từ đã học, khám phá điều mới.
                <br />
                Hanni luôn sẵn sàng đồng hành cùng bạn.
              </p>
            </div>
            <div className="login-story-copy login-story-copy-register">
              <p
                lang="zh"
                className="hanzi text-lg tracking-[.18em] text-white/75"
              >
                千里之行，始于足下
              </p>
              <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                Bắt đầu từ một chữ,
                <br />
                mở ra cả hành trình.
              </h2>
              <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-white/75">
                Tạo tài khoản để lưu từng cột mốc nhỏ.
                <br />
                Hanni sẽ cùng bạn biến chúng thành tiến bộ lớn.
              </p>
            </div>
          </div>
          <span className="login-story-note">
            <Icon name="spark" size={15} /> Học một chút. Nhớ thêm nhiều.
          </span>
        </div>
      </aside>
    </div>
  );
}
