"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

interface YTPlayer {
  seekTo: (s: number, allow: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
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

/**
 * Nhúng YouTube. `seekRef.current(giây)` để tua. `onTick` gọi ~4 lần/giây với
 * thời gian hiện tại (giây). `onReady` trả về tổng thời lượng (giây).
 */
export function YoutubePlayer({
  youtubeId,
  seekRef,
  onTick,
  onReady,
}: {
  youtubeId: string;
  seekRef: React.RefObject<((seconds: number) => void) | null>;
  onTick?: (currentSeconds: number) => void;
  onReady?: (durationSeconds: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const cbRef = useRef({ onTick, onReady });
  useLayoutEffect(() => {
    cbRef.current = { onTick, onReady };
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    void loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            try {
              cbRef.current.onReady?.(playerRef.current!.getDuration());
            } catch {
              /* ignore */
            }
          },
        },
      });
      seekRef.current = (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
        playerRef.current?.playVideo();
      };
      timer = setInterval(() => {
        try {
          const t = playerRef.current?.getCurrentTime?.();
          if (typeof t === "number") cbRef.current.onTick?.(t);
        } catch {
          /* ignore */
        }
      }, 250);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
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
