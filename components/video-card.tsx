"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { hskBand } from "@/lib/hsk";
import type { VideoCard as V } from "@/lib/types";

const KIND_VI: Record<string, string> = {
  PODCAST: "Podcast",
  STORY: "Truyện ngắn",
  SONG: "Bài hát",
  DIALOGUE: "Hội thoại",
  CLIP: "Clip",
  OTHER: "Khác",
};

export function VideoCard({ video }: { video: V }) {
  const thumb =
    video.thumbnailUrl ??
    `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <Link
      href={`/watch/${video.id}`}
      className="hover-card panel group overflow-hidden"
    >
      <div className="relative aspect-video bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-transform group-hover:scale-110">
            <Icon name="play" size={22} />
          </span>
        </span>
        {video.isFree && (
          <span className="absolute left-2 top-2 rounded-md bg-good/90 px-2 py-0.5 text-[10px] font-bold text-white">
            MIỄN PHÍ
          </span>
        )}
        {video.hskLevel && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            HSK {video.hskLevel}
          </span>
        )}
        {video.progressPct > 0 && (
          <span className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${video.progressPct}%` }} />
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
          {video.hskLevel && (
            <span
              className={`rounded-md px-1.5 py-0.5 ${hskBand(video.hskLevel).tone}`}
            >
              HSK {video.hskLevel} · {hskBand(video.hskLevel).label}
            </span>
          )}
          <span className="text-muted">{KIND_VI[video.kind] ?? video.kind}</span>
          <span className="ml-auto flex items-center gap-2 text-muted">
            {video.likeCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Icon
                  name="heart"
                  size={12}
                  fill={video.likedByMe ? "currentColor" : "none"}
                  className={video.likedByMe ? "text-danger" : undefined}
                />
                {video.likeCount}
              </span>
            )}
            {video.sentenceCount} câu
          </span>
        </div>
        <h3 className="mt-2 font-semibold leading-snug">{video.title}</h3>
        {video.titleZh && (
          <p className="hanzi mt-0.5 text-sm text-muted">{video.titleZh}</p>
        )}
        {video.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}
