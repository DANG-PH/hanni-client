"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "./icon";
import type { VideoCard as V } from "@/lib/types";
import styles from "./video-library.module.css";

const KIND_VI: Record<string, string> = {
  PODCAST: "Podcast",
  STORY: "Truyện ngắn",
  SONG: "Bài hát",
  DIALOGUE: "Hội thoại",
  CLIP: "Clip",
  OTHER: "Khác",
};

export function VideoCard({ video, index = 0 }: { video: V; index?: number }) {
  const thumb =
    video.thumbnailUrl ??
    `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const tienDo = Math.min(100, Math.max(0, video.progressPct || 0));

  return (
    <Link
      href={`/watch/${video.id}`}
      className={styles.videoCard}
      style={{ "--card-index": Math.min(index, 5) } as CSSProperties}
    >
      <div className={styles.thumbnail}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" loading="lazy" />
        <span className={styles.play} aria-hidden="true">
          <Icon name="play" size={22} />
        </span>
        <span className={styles.watchLabel} aria-hidden="true">
          {tienDo > 0 && tienDo < 100 ? "Học tiếp" : "Khám phá video"}
          <Icon name="arrow" size={13} />
        </span>
        <span className={styles.sentenceCount}>
          {video.sentenceCount.toLocaleString("vi-VN")} câu
        </span>
        {tienDo > 0 && (
          <span className={styles.progress} style={{ width: `${tienDo}%` }} />
        )}
      </div>
      <div className={styles.videoBody}>
        <div className={styles.videoMeta}>
          {video.hskLevel && (
            <span className={styles.level}>HSK {video.hskLevel}</span>
          )}
          <span>{KIND_VI[video.kind] ?? video.kind}</span>
          {video.isFree && <span className={styles.free}>Miễn phí</span>}
        </div>
        <h3>{video.title}</h3>
        {video.titleZh && (
          <p lang="zh" className={`hanzi ${styles.titleZh}`}>
            {video.titleZh}
          </p>
        )}
        {(tienDo > 0 || video.likeCount > 0) && (
          <div className={styles.videoFoot}>
            {tienDo > 0 && (
              <span>
                {tienDo >= 100
                  ? "Đã hoàn thành"
                  : `${Math.round(tienDo)}% đã học`}
              </span>
            )}
            {video.likeCount > 0 && (
              <span>
                <Icon
                  name="heart"
                  size={12}
                  fill={video.likedByMe ? "currentColor" : "none"}
                />{" "}
                {video.likeCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
