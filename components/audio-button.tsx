"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { Icon } from "./icon";

/** Nút phát âm thanh cho 1 từ. `src` là đường dẫn tương đối (word.audioUrl). */
export function AudioButton({
  src,
  size = 18,
  className = "",
}: {
  src: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const url = mediaUrl(src);
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!url) return null;

  function play(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!ref.current) {
      ref.current = new Audio(url!);
      ref.current.addEventListener("ended", () => setPlaying(false));
      ref.current.addEventListener("error", () => setPlaying(false));
    }
    ref.current.currentTime = 0;
    setPlaying(true);
    void ref.current.play().catch(() => setPlaying(false));
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label="Nghe phát âm"
      title="Nghe phát âm"
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-primary ${playing ? "text-primary" : ""} ${className}`}
    >
      <Icon name="sound" size={size} />
    </button>
  );
}
