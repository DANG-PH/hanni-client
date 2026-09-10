"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { Icon } from "./icon";
import { useVideos } from "@/lib/hooks";
import type { VideoCard } from "@/lib/types";

/**
 * Kệ video ngang, TỰ TRƯỢT SANG TRÁI theo chu kỳ (kiểu băng chuyền vô tận).
 * Dừng khi rê chuột / chạm / focus, và khi người dùng bật giảm chuyển động.
 */
export function VideoShelf({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useVideos();
  const trackRef = useRef<HTMLUListElement>(null);
  const paused = useRef(false);

  const videos = (data ?? []).slice(0, limit);
  // Nhân đôi để cuộn vòng không thấy điểm nối.
  const loop = videos.length ? [...videos, ...videos] : [];

  useEffect(() => {
    const el = trackRef.current;
    if (!el || loop.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const step = () => {
      if (paused.current) return;
      const half = el.scrollWidth / 2;
      // gần hết nửa đầu → nhảy về đầu (không hiệu ứng) rồi đẩy tiếp.
      if (el.scrollLeft >= half - 4) {
        el.scrollTo({ left: el.scrollLeft - half });
      }
      const card = el.querySelector<HTMLElement>("li");
      el.scrollBy({ left: (card?.offsetWidth ?? 180) + 12, behavior: "smooth" });
    };

    const id = window.setInterval(step, 3200);
    return () => window.clearInterval(id);
  }, [loop.length]);

  const setPaused = useCallback((v: boolean) => {
    paused.current = v;
  }, []);

  if (isLoading || videos.length === 0) return null;

  return (
    <section className="reveal overflow-hidden rounded-3xl border border-border bg-[linear-gradient(180deg,#f1fbf6,#ffffff)] p-5 sm:p-6">
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

      <ul
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((v, i) => (
          <ShelfCard key={`${v.id}-${i}`} v={v} />
        ))}
      </ul>
    </section>
  );
}

function ShelfCard({ v }: { v: VideoCard }) {
  return (
    <li className="w-44 shrink-0 sm:w-48">
      <Link href={`/watch/${v.id}`} className="group block">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              v.thumbnailUrl ??
              `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`
            }
            alt=""
            loading="lazy"
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
    </li>
  );
}
