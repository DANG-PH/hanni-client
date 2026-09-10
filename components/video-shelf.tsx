"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { useVideos } from "@/lib/hooks";

/** Kệ video ngang cho Tổng quan — vài video mới nhất, bấm vào là xem. */
export function VideoShelf({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useVideos();
  if (isLoading || !data?.length) return null;
  const videos = data.slice(0, limit);

  return (
    <section className="reveal rounded-3xl border border-border bg-[linear-gradient(180deg,#f2fbf6,#ffffff)] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-good/15 text-good">
          <Icon name="play" size={20} />
        </span>
        <h2 className="text-lg font-bold">Học qua video</h2>
        <span className="rounded-full bg-good/15 px-2 py-0.5 text-[11px] font-bold text-good">
          MIỄN PHÍ
        </span>
        <span className="hidden gap-1.5 sm:flex">
          {["Phụ đề đồng bộ", "Luyện nghe", "Gõ nghe"].map((t) => (
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

      <ul className="flex snap-x gap-3 overflow-x-auto pb-1">
        {videos.map((v) => (
          <li key={v.id} className="w-40 shrink-0 snap-start sm:w-44">
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
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
        ))}
      </ul>
    </section>
  );
}
