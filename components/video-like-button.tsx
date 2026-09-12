"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { likeVideo, unlikeVideo } from "@/lib/hooks";

export function VideoLikeButton({
  videoId,
  liked,
  count,
  onChange,
}: {
  videoId: string;
  liked: boolean;
  count: number;
  onChange: (liked: boolean, count: number) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const optimistic = !liked;
    onChange(optimistic, count + (optimistic ? 1 : -1));
    try {
      const res = optimistic ? await likeVideo(videoId) : await unlikeVideo(videoId);
      onChange(res.liked, res.likeCount);
    } catch {
      onChange(liked, count); // lỗi mạng → khôi phục trạng thái cũ
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={liked}
      title={liked ? "Bỏ thích" : "Thích video này"}
      className={`motion-button flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        liked ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted hover:text-foreground"
      }`}
    >
      <Icon name="heart" size={16} fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}
