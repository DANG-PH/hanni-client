"use client";

import HanziWriter from "hanzi-writer";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cssVar } from "@/components/hanzi-writer-canvas";
import { Icon } from "@/components/icon";

const SIZE = 112;

/** Thứ tự nét từng chữ (hoạt hình như cột phải trang từ của Hanzii). Dữ liệu nét tự
 * host ở `public/hanzi-strokes` — chỉ có chữ HSK; chữ không có dữ liệu thì ẩn ô. */
export function StrokeOrder({ text }: { text: string }) {
  const chars = [...new Set(Array.from(text).filter((c) => /\p{Script=Han}/u.test(c)))].slice(0, 4);
  if (chars.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {chars.map((c) => (
        <StrokeBox key={c} char={c} />
      ))}
    </div>
  );
}

function StrokeBox({ char }: { char: string }) {
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [strokes, setStrokes] = useState<number | null>(null);

  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = "";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = HanziWriter.create(host.current, char, {
      width: SIZE,
      height: SIZE,
      padding: 8,
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 180,
      strokeColor: cssVar("--foreground"),
      radicalColor: cssVar("--primary"),
      outlineColor: cssVar("--border"),
      showOutline: true,
      charDataLoader: (c, onLoad, onError) => {
        fetch(`/hanzi-strokes/${encodeURIComponent(c)}.json`)
          .then((res) => {
            if (!res.ok) throw new Error("not found");
            return res.json();
          })
          .then(onLoad)
          .catch(onError);
      },
      onLoadCharDataSuccess: (data) => {
        setState("ready");
        setStrokes(data.strokes.length);
        if (!reduceMotion) void w.animateCharacter();
      },
      onLoadCharDataError: () => setState("missing"),
    });
    writer.current = w;
    return () => {
      writer.current = null;
    };
  }, [char]);

  if (state === "missing") return null;
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => void writer.current?.animateCharacter()}
        aria-label={`Xem lại thứ tự nét chữ ${char}`}
        title="Bấm để xem lại"
        className="rounded-xl border border-border bg-surface-2/40 hover:border-primary/40"
        style={{ width: SIZE + 2, height: SIZE + 2 }}
      >
        <div ref={host} aria-hidden="true" />
      </button>
      <figcaption className="flex items-center gap-2 text-[11px] text-muted">
        {strokes !== null && <span>{strokes} nét</span>}
        <Link href={`/writing?c=${encodeURIComponent(char)}`} className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
          <Icon name="pencil" size={12} /> Luyện viết
        </Link>
      </figcaption>
    </figure>
  );
}
