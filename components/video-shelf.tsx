"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui";
import { VideoCard } from "@/components/video-card";
import { useVideos } from "@/lib/hooks";

export function VideoShelf({ level }: { level?: number }) {
  const { data } = useVideos();
  const rail = useRef<HTMLUListElement>(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const suitable = data?.filter((video) => video.hskLevel === null || !level || video.hskLevel <= level + 1) ?? [];
  const byLevel = (a: (typeof suitable)[number], b: (typeof suitable)[number]) =>
    (a.hskLevel ?? 1) - (b.hskLevel ?? 1);
  const videos = (level && suitable.length >= 2 ? suitable : [...(data ?? [])].sort(byLevel)).slice(0, 6);

  function move(direction: 1 | -1) {
    const list = rail.current;
    const item = list?.firstElementChild;
    if (!list || !item) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({
      left: direction * (item.getBoundingClientRect().width + 12),
      behavior: reduce ? "instant" : "smooth",
    });
  }

  useEffect(() => {
    if (!autoScroll) return;
    const timer = window.setInterval(() => {
      const list = rail.current;
      if (!list || document.hidden || list.matches(":hover, :focus-within")) return;
      const bounds = list.getBoundingClientRect();
      if (bounds.top >= window.innerHeight || bounds.bottom <= 0) return;
      if (list.scrollLeft + list.clientWidth >= list.scrollWidth - 2) {
        list.scrollTo({ left: 0, behavior: "instant" });
      } else {
        move(1);
      }
    }, 4200);
    return () => window.clearInterval(timer);
  }, [autoScroll]);

  if (!videos.length) return null;

  return (
    <section id="hoc-qua-video" aria-labelledby="video-shelf-heading" className="panel min-w-0 space-y-4 p-4 shadow-none sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id="video-shelf-heading" className="flex items-center gap-2 text-lg font-bold">
            <Icon name="play" size={19} className="text-primary" /> Học qua video
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">Phụ đề chạy theo lời thoại. Chạm vào từ để xem nghĩa.</p>
        </div>
        <Link href="/watch" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          Tất cả video <Icon name="arrow" size={16} />
        </Link>
      </div>
      <ul id="hanni-video-rail" ref={rail} className="flex snap-x snap-mandatory gap-3 overflow-x-auto">
        {videos.map((video) => (
          <li key={video.id} className="w-[min(80%,260px)] shrink-0 snap-start [&>a]:h-full">
            <VideoCard video={video} />
          </li>
        ))}
      </ul>
      {videos.length > 1 && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" aria-pressed={autoScroll} onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? "Dừng tự cuộn" : "Tự cuộn"}
          </Button>
          <Button variant="secondary" aria-controls="hanni-video-rail" aria-label="Video trước" onClick={() => move(-1)}><Icon name="back" size={17} /></Button>
          <Button variant="secondary" aria-controls="hanni-video-rail" aria-label="Video sau" onClick={() => move(1)}><Icon name="arrow" size={17} /></Button>
        </div>
      )}
    </section>
  );
}
