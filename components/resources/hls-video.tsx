"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorNote } from "@/components/ui";

/** Safari tự phát được HLS; trình duyệt khác cần hls.js, tải lúc bấm xem để trang danh sách vẫn nhẹ. */
export function HlsVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    let stopped = false;
    let destroy = () => {};
    void import("hls.js").then(({ default: Hls }) => {
      if (stopped) return;
      if (!Hls.isSupported()) {
        setFailed(true);
        return;
      }
      const hls = new Hls();
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setFailed(true);
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      destroy = () => hls.destroy();
    });
    return () => {
      stopped = true;
      destroy();
    };
  }, [src]);

  if (failed) return <ErrorNote>Không phát được video. Bạn tải lại trang rồi thử lần nữa nhé.</ErrorNote>;
  return <video ref={videoRef} controls playsInline aria-label={title} className="aspect-video w-full rounded-xl bg-black" />;
}
