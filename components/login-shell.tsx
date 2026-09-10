"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

/** Bố cục đăng nhập riêng; video minh họa tự phát không tiếng và lặp liên tục. */
export function LoginShell({ children }: { children: ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [touchControls, setTouchControls] = useState(false);

  async function toggleVideo() {
    if (!video.current) return;
    if (video.current.paused) {
      try {
        await video.current.play();
      } catch {
        setPlaying(false);
      }
    } else video.current.pause();
  }

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
          <p className="login-story-eyebrow">
            <span className="h-1 w-1 rounded-full bg-current" /> MỘT NGÔN NGỮ
            MỚI. MỘT HÀNH TRÌNH MỚI.
          </p>
          <div
            className="login-video-frame"
            data-controls-visible={touchControls || undefined}
            onPointerDown={(event) => {
              if (
                event.pointerType === "touch" ||
                event.pointerType === "pen"
              ) {
                setTouchControls(true);
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setTouchControls(false);
              }
            }}
          >
            {videoFailed ? (
              <div className="flex aspect-video items-center justify-center bg-primary/20">
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
                id="login-brand-video"
                ref={video}
                src="/videologin.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                width={1280}
                height={720}
                aria-hidden="true"
                tabIndex={-1}
                className="login-video"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => setVideoFailed(true)}
              >
                Trình duyệt của bạn chưa hỗ trợ video.
              </video>
            )}
            {!videoFailed && (
              <button
                type="button"
                onClick={() => void toggleVideo()}
                className="login-video-control"
                aria-controls="login-brand-video"
                aria-label={
                  playing ? "Tạm dừng video minh họa" : "Phát video minh họa"
                }
                title={playing ? "Tạm dừng" : "Phát video"}
              >
                <Icon name={playing ? "pause" : "play"} size={15} />
              </button>
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
