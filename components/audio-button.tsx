"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { Icon } from "./icon";

/** Phát bản thu của từ và dừng âm thanh khi chuyển bài/trang. */
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
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(
    () => () => {
      if (!player.current) return;
      player.current.onended = null;
      player.current.onerror = null;
      player.current.pause();
      player.current = null;
    },
    [url],
  );
  if (!url) return null;

  function play(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (player.current) {
      player.current.onended = null;
      player.current.onerror = null;
      player.current.pause();
    }
    const audio = new Audio(url!);
    player.current = audio;
    setFailed(false);
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      setFailed(true);
    };
    void audio.play().catch(() => {
      if (player.current === audio) {
        setPlaying(false);
        setFailed(true);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={play}
        aria-label={playing ? "Phát lại từ đầu" : "Nghe phát âm"}
        title={
          failed ? "Chưa phát được âm thanh. Nhấn để thử lại." : "Nghe phát âm"
        }
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-primary ${playing ? "text-primary" : ""} ${className}`}
      >
        <Icon name={failed ? "refresh" : "sound"} size={size} />
      </button>
      {failed && (
        <span role="status" className="text-[10px] font-normal text-danger">
          Chưa phát được
        </span>
      )}
    </span>
  );
}
