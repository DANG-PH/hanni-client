"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "./icon";
import { useVideos } from "@/lib/hooks";
import type { VideoCard } from "@/lib/types";

/**
 * Kệ video ngang: TỰ TRƯỢT sang trái ~40px/giây, và người dùng KÉO / LĂN CHUỘT
 * để tự xem được. Rê chuột / chạm vào là auto dừng; rời ra thì chạy tiếp từ
 * đúng vị trí. Tắt hẳn khi bật "giảm chuyển động".
 */
const SPEED = 40; // px / giây

export function VideoShelf({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useVideos();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resume = useRef(0);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });

  const videos = (data ?? []).slice(0, limit);
  const canLoop = videos.length >= 4;
  const list = canLoop ? [...videos, ...videos] : videos;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !canLoop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    let pos = el.scrollLeft;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 100);
      last = now;
      if (
        document.hidden ||
        paused.current ||
        (resume.current && now < resume.current)
      ) {
        pos = el.scrollLeft; // đồng bộ lại nếu user vừa tự kéo
        return;
      }
      resume.current = 0;
      const half = el.scrollWidth / 2;
      if (half <= el.clientWidth) return;
      pos += (dt / 1000) * SPEED;
      if (pos >= half) pos -= half;
      el.scrollLeft = pos;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [canLoop, list.length]);

  if (isLoading || videos.length === 0) return null;

  const hold = () => {
    paused.current = true;
  };
  const release = () => {
    paused.current = false;
    resume.current = performance.now() + 1200; // nghỉ 1.2s rồi chạy tiếp
  };

  // Kéo chuột để lướt (như vuốt trên điện thoại).
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || e.button !== 0) return;
    drag.current = { on: true, x: e.clientX, left: el.scrollLeft, moved: false };
    paused.current = true;
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!d.on || !el) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.left - dx;
  };
  const onUp = () => {
    drag.current.on = false;
    release();
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <section className="reveal overflow-hidden tint-good rounded-3xl border border-border p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-good/15 text-good">
          <Icon name="play" size={20} />
        </span>
        <h2 className="text-lg font-bold">Học qua video</h2>
        <span className="rounded-full bg-good/15 px-2 py-0.5 text-[11px] font-bold text-good">
          MIỄN PHÍ
        </span>
        <span className="hidden gap-1.5 sm:flex">
          {["Phụ đề đồng bộ", "Máy nhắc chữ", "Dịch tiếng Việt"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted"
            >
              {t}
            </span>
          ))}
        </span>
        <Link
          href="/watch"
          className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Tất cả video <Icon name="arrow" size={15} />
        </Link>
      </div>

      <div
        ref={scrollerRef}
        onPointerEnter={hold}
        onPointerLeave={onUp}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClickCapture={onClickCapture}
        className="-mx-1 flex cursor-grab touch-pan-x select-none gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        {list.map((v, i) => (
          <ShelfCard key={`${v.id}-${i}`} v={v} dup={i >= videos.length} />
        ))}
      </div>
    </section>
  );
}

function ShelfCard({ v, dup }: { v: VideoCard; dup: boolean }) {
  return (
    <Link
      href={`/watch/${v.id}`}
      aria-hidden={dup || undefined}
      tabIndex={dup ? -1 : undefined}
      className="group block w-44 shrink-0 sm:w-48"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            v.thumbnailUrl ??
            `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`
          }
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-primary-fg shadow-lg transition-transform group-hover:scale-110">
            <Icon name="play" size={16} />
          </span>
        </span>
        {v.hskLevel != null && (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            HSK {v.hskLevel}
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug">
        {v.title}
      </p>
    </Link>
  );
}
