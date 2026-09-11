"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

/** Bố cục đăng nhập riêng; video minh họa tự phát không tiếng và lặp liên tục. */
export function LoginShell({ children }: { children: ReactNode }) {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="login-screen">
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
            {videoFailed ? (
              <div className="login-video-fallback">
                <Image
                  src="/favicon.ico"
                  alt="Logo Hanni"
                  width={120}
                  height={120}
                  unoptimized
                  className="rounded-3xl"
                />
              </div>
            ) : (
              <video
                src="/videologin.mp4"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                preload="auto"
                width={1280}
                height={720}
                aria-hidden="true"
                tabIndex={-1}
                className="login-video"
                onError={() => setVideoFailed(true)}
              >
                Trình duyệt của bạn chưa hỗ trợ video.
              </video>
            )}
          </div>
          <div className="login-story-copy">
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
          <span className="login-story-note">
            <Icon name="spark" size={15} /> Học một chút. Nhớ thêm nhiều.
          </span>
        </div>
      </aside>
    </div>
  );
}
