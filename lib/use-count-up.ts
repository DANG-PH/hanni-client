"use client";

import { useEffect, useState } from "react";

/** Số chạy từ 0 lên `target` trong ~0,9 giây (chậm dần ở cuối) — dùng cho số liệu ở màn kết quả. Giảm chuyển
 * động thì hiện thẳng số cuối. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = ms ? Math.min(1, (now - start) / ms) : 1;
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}
