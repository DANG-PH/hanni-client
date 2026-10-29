"use client";

import { useEffect, useRef, useState } from "react";

/** Nhịp từng hình của 3 cử động nút trợ lý (assets/assistant-button/manifest-v10.json ở repo hanni-mascot). */
const CLIPS = {
  blink: [180, 70, 90, 70, 160, 200],
  wave: [160, 120, 160, 160, 120, 180],
  peek: [160, 140, 180, 140, 140, 200],
} as const;
type Clip = keyof typeof CLIPS;
const ORDER: Clip[] = ["blink", "wave", "peek", "blink"];

/**
 * Cáo trong bát đỏ trên nút trợ lý: đứng yên, 5 giây đầu nháy mắt rồi cứ 12–20 giây làm 1 cử động
 * (nháy mắt → vẫy tay → ló lên), rê chuột vào thì vẫy tay (nghỉ ít nhất 8 giây giữa 2 lần).
 * Mỗi cử động phát 6 hình vẽ riêng 1 lần rồi giữ hình cuối — cùng luật với launcher-idle.js của repo mascot.
 * Tab ẩn hoặc máy bật giảm chuyển động thì không đặt lịch.
 */
export function LauncherFox() {
  const [clip, setClip] = useState<Clip>("blink");
  const [frame, setFrame] = useState(0);
  const waveRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let step = 0;
    let seq = 0;
    let busy = false;
    let lastStart = -Infinity;
    let preloaded = false;

    function play(id: Clip, manual = false) {
      if (busy || document.hidden || reduce.matches) return;
      if (!manual && performance.now() - lastStart < 8000) return schedule();
      busy = true;
      lastStart = performance.now();
      setClip(id);
      setFrame(0);
      let i = 0;
      const tick = () => {
        i += 1;
        if (i >= 6) {
          busy = false;
          schedule();
          return;
        }
        setFrame(i);
        step = window.setTimeout(tick, CLIPS[id][i]);
      };
      step = window.setTimeout(tick, CLIPS[id][0]);
    }
    function schedule(delay = 12000 + Math.random() * 8000) {
      window.clearTimeout(timer);
      if (document.hidden || reduce.matches) return;
      timer = window.setTimeout(() => {
        // Lần đầu mới tải 2 dải còn lại — không bắt mọi trang tải trước 3 dải ảnh.
        if (!preloaded) {
          preloaded = true;
          for (const c of ["wave", "peek"]) new window.Image().src = `/mascot/launcher-${c}.webp`;
        }
        play(ORDER[seq++ % ORDER.length]);
      }, delay);
    }
    function onVisibility() {
      window.clearTimeout(timer);
      if (!document.hidden && !busy) schedule(4500);
    }

    waveRef.current = () => {
      if (performance.now() - lastStart < 8000) return;
      const img = new window.Image();
      img.src = "/mascot/launcher-wave.webp";
      void img.decode().then(() => play("wave", true), () => undefined);
    };
    schedule(5000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(step);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Bát đỏ chiếm ~73% khung ảnh và lệch xuống 8,5% — phóng ảnh 137% nút rồi kéo lên để bát trùng hình tròn của nút.
  return (
    <span
      aria-hidden="true"
      onPointerEnter={() => waveRef.current()}
      className="absolute left-1/2 top-1/2 block h-[137%] w-[137%] -translate-x-1/2 -translate-y-[58.5%] bg-no-repeat drop-shadow-[0_6px_10px_rgb(0_0_0/0.18)]"
      style={{
        backgroundImage: `url(/mascot/launcher-${clip}.webp)`,
        backgroundSize: "600% 100%",
        backgroundPosition: `${frame * 20}% 0`,
      }}
    />
  );
}
