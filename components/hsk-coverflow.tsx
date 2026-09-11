"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

type Level = {
  n: number;
  label: string; // "1" hoặc "7–9"
  hanzi: string;
  name: string;
  words: string;
  band: "sc" | "tc" | "cc";
  href: string;
};

const LEVELS: Level[] = [
  { n: 1, label: "1", hanzi: "一", name: "Nhập môn", words: "≈ 300 từ", band: "sc", href: "/learn?level=1" },
  { n: 2, label: "2", hanzi: "二", name: "Sơ cấp", words: "≈ 500 từ", band: "sc", href: "/learn?level=2" },
  { n: 3, label: "3", hanzi: "三", name: "Sơ cấp mở rộng", words: "≈ 1.000 từ", band: "sc", href: "/learn?level=3" },
  { n: 4, label: "4", hanzi: "四", name: "Trung cấp", words: "≈ 2.000 từ", band: "tc", href: "/learn?level=4" },
  { n: 5, label: "5", hanzi: "五", name: "Trung cấp mở rộng", words: "≈ 3.600 từ", band: "tc", href: "/learn?level=5" },
  { n: 6, label: "6", hanzi: "六", name: "Trung cấp nâng cao", words: "≈ 5.400 từ", band: "tc", href: "/learn?level=6" },
  { n: 7, label: "7–9", hanzi: "七", name: "Cao cấp", words: "≈ 11.000 từ", band: "cc", href: "/learn?level=7" },
];

const BAND: Record<Level["band"], string> = {
  sc: "text-good",
  tc: "text-accent",
  cc: "text-lavender",
};

export function HskCoverflow() {
  const [active, setActive] = useState(0);
  const [reduce] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const paused = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden)
        setActive((a) => (a + 1) % LEVELS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  const go = (d: number) =>
    setActive((a) => (a + d + LEVELS.length) % LEVELS.length);

  const setPaused = useCallback((v: boolean) => {
    paused.current = v;
  }, []);

  return (
    <div
      // Giới hạn thẻ 3D theo chiều ngang để không kéo rộng trang trên mobile.
      className="relative overflow-x-clip"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <div
        className="relative flex h-[280px] items-center justify-center sm:h-[320px]"
        style={{ perspective: "1200px" }}
      >
        {LEVELS.map((lv, i) => {
          let off = i - active;
          if (off > LEVELS.length / 2) off -= LEVELS.length;
          if (off < -LEVELS.length / 2) off += LEVELS.length;
          const abs = Math.abs(off);
          const hidden = abs > 2;
          const tilt = reduce ? 0 : off * -22;
          const transform = `translateX(${off * 56}%) rotateY(${tilt}deg) translateZ(${-abs * 90}px) scale(${1 - abs * 0.12})`;

          return (
            <Link
              key={lv.n}
              href={lv.href}
              aria-hidden={off !== 0}
              tabIndex={off === 0 ? 0 : -1}
              onClick={(e) => {
                if (off !== 0) {
                  e.preventDefault();
                  setActive(i);
                }
              }}
              className="hover-card absolute flex h-[236px] w-[188px] flex-col items-center justify-center rounded-3xl border border-border bg-surface p-5 text-center shadow-xl sm:h-[264px] sm:w-[210px]"
              style={{
                transform,
                opacity: hidden ? 0 : 1 - abs * 0.32,
                zIndex: 10 - abs,
                pointerEvents: hidden ? "none" : "auto",
                transition:
                  "transform 520ms cubic-bezier(0.22,1,0.36,1), opacity 520ms ease",
              }}
            >
              <span
                className={`hanzi text-6xl ${BAND[lv.band]} transition-transform`}
              >
                {lv.hanzi}
              </span>
              <span className="mt-3 text-lg font-extrabold">
                HSK {lv.label}
              </span>
              <span className="mt-0.5 text-sm text-muted">{lv.name}</span>
              <span
                className={`mt-3 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold ${BAND[lv.band]}`}
              >
                {lv.words}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Cấp trước"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-primary"
        >
          <Icon name="back" size={16} />
        </button>
        <div className="flex gap-1.5">
          {LEVELS.map((lv, i) => (
            <button
              key={lv.n}
              type="button"
              aria-label={`Đến HSK ${lv.label}`}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Cấp sau"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-primary"
        >
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
