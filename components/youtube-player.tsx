"use client";

import { useEffect, useRef } from "react";

interface YTPlayer {
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  destroy: () => void;
}
declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>,
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

/** Nhúng YouTube + cho phép tua tới giây (qua `seekRef.current(seconds)`). */
export function YoutubePlayer({
  youtubeId,
  seekRef,
}: {
  youtubeId: string;
  seekRef: React.RefObject<((seconds: number) => void) | null>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
      });
      seekRef.current = (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
        playerRef.current?.playVideo();
      };
    });
    return () => {
      cancelled = true;
      seekRef.current = null;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [youtubeId, seekRef]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
