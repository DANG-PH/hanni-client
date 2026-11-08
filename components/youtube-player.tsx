"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  thumbnailUrl,
  seekRef,
  onTick,
  onReady,
}: {
  youtubeId: string;
  thumbnailUrl?: string | null;
  seekRef: React.RefObject<((seconds: number) => void) | null>;
  onTick?: (currentSeconds: number) => void;
  onReady?: (durationSeconds: number) => void;
}) {
  const [playerStatus, setPlayerStatus] = useState<{ id: string; state: "ready" | "error" } | null>(null);
  const state = playerStatus?.id === youtubeId ? playerStatus.state : "loading";
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const cbRef = useRef({ onTick, onReady });
  useLayoutEffect(() => {
    cbRef.current = { onTick, onReady };
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const readyTimeout = window.setTimeout(showError, 10000);

    function showError() {
      if (!cancelled) setPlayerStatus({ id: youtubeId, state: "error" });
    }

    void loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            if (cancelled) return;
            window.clearTimeout(readyTimeout);
            setPlayerStatus({ id: youtubeId, state: "ready" });
            try {
              cbRef.current.onReady?.(playerRef.current!.getDuration());
            } catch {
              /* ignore */
            }
          },
          onError: () => {
            window.clearTimeout(readyTimeout);
            showError();
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
      window.clearTimeout(readyTimeout);
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
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-[#2c2522]">
      <div ref={hostRef} className="h-full w-full" />
      {state !== "ready" && (
        <div className="absolute inset-0 grid place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          {state === "error" ? (
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-primary"
            >
              Mở trên YouTube
            </a>
          ) : (
            <span role="status" className="relative rounded-xl bg-black/65 px-4 py-2 text-sm font-semibold text-white">
              Đang mở video…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
