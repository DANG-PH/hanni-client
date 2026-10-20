"use client";

import HanziWriter from "hanzi-writer";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cssVar } from "@/components/hanzi-writer-canvas";
import { Icon } from "@/components/icon";

export interface Glyph {
  char: string;
  traditional?: string | null;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
  strokes: number | null;
  radical: { number: number; char: string; nameVi: string } | null;
}

const SIZE = 196;

/** Hoạt hình thứ tự nét cỡ lớn — nét thuộc BỘ THỦ tô đỏ (dữ liệu `radStrokes` của Make Me a Hanzi).
 * Chữ chưa có dữ liệu nét (vd chữ phồn thể) thì hiện chữ tĩnh. */
function BigStroke({ char, onStrokes }: { char: string; onStrokes: (char: string, n: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = "";
    setMissing(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = HanziWriter.create(host.current, char, {
      width: SIZE,
      height: SIZE,
      padding: 10,
      strokeAnimationSpeed: 1.1,
      delayBetweenStrokes: 160,
      strokeColor: cssVar("--foreground"),
      radicalColor: cssVar("--primary"),
      outlineColor: cssVar("--border"),
      showOutline: true,
      charDataLoader: (c, onLoad, onError) => {
        fetch(`/hanzi-strokes/${encodeURIComponent(c)}.json`)
          .then((res) => {
            if (!res.ok) throw new Error("không có dữ liệu nét");
            return res.json();
          })
          .then(onLoad)
          .catch(onError);
      },
      onLoadCharDataSuccess: (data) => {
        onStrokes(char, data.strokes.length);
        if (!reduce) void w.animateCharacter();
      },
      onLoadCharDataError: () => setMissing(true),
    });
    writer.current = w;
    return () => {
      writer.current = null;
    };
  }, [char, onStrokes]);

  return (
    <div className="relative mx-auto rounded-2xl border border-border bg-surface-2/40" style={{ width: SIZE + 2, height: SIZE + 2 }}>
      {/* Lưới chữ điền (米字格) như vở tập viết. */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 text-border" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 50H100M50 0V100M0 0L100 100M100 0L0 100" stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 2" fill="none" />
      </svg>
      <div ref={host} aria-hidden="true" className={missing ? "hidden" : "relative"} />
      {missing && (
        <span lang="zh" className="hanzi absolute inset-0 flex items-center justify-center text-[120px] leading-none">
          {char}
        </span>
      )}
      {!missing && (
        <button
          type="button"
          onClick={() => void writer.current?.animateCharacter()}
          aria-label={`Xem lại thứ tự nét chữ ${char}`}
          title="Xem lại thứ tự nét"
          className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-muted shadow-sm hover:text-primary"
        >
          <Icon name="refresh" size={15} />
        </button>
      )}
    </div>
  );
}

const ignoreStrokes = () => {};

/** Hoạt hình thứ tự nét cho trang Server Component (tab "Hán tự" của `/tu-dien`). */
export function StrokeAnimation({ char }: { char: string }) {
  return <BigStroke char={char} onStrokes={ignoreStrokes} />;
}

/** Khung "Hán tự" ở cột phải trang từ (như Hanzii): mỗi chữ một tab (kèm chữ phồn thể nếu khác), hoạt
 * hình nét với bộ thủ tô đỏ, âm Hán Việt, pinyin, nghĩa riêng, bộ thủ + tên Hán Việt, số nét, Tập viết. */
export function GlyphPanel({ glyphs }: { glyphs: Glyph[] }) {
  const tabs = glyphs.flatMap((g) => [
    { char: g.char, glyph: g, isTraditional: false },
    ...(g.traditional ? [{ char: g.traditional, glyph: g, isTraditional: true }] : []),
  ]);
  const [index, setIndex] = useState(0);
  const [counted, setCounted] = useState<Record<string, number>>({});
  // Ổn định qua các lần render — BigStroke dựng lại hoạt hình mỗi khi hàm này đổi.
  const onStrokes = useCallback(
    (c: string, n: number) => setCounted((prev) => (prev[c] === n ? prev : { ...prev, [c]: n })),
    [],
  );
  const tab = tabs[Math.min(index, tabs.length - 1)];
  if (!tab) return null;
  const g = tab.glyph;
  const strokes = tab.isTraditional ? (counted[tab.char] ?? null) : (g.strokes ?? counted[tab.char] ?? null);

  return (
    <section aria-labelledby="han-tu" className="panel p-5">
      <h2 id="han-tu" className="sr-only">
        Hán tự
      </h2>
      <div role="tablist" aria-label="Chọn chữ" className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t, i) => (
          <button
            key={`${t.char}-${i}`}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            title={t.isTraditional ? "Chữ phồn thể" : undefined}
            className={`hanzi flex h-10 min-w-10 items-center justify-center rounded-xl px-2 text-xl ${
              i === index ? "chip-on shadow-sm" : "bg-surface-2 hover:bg-primary/10 hover:text-primary"
            }`}
            lang="zh"
          >
            {t.char}
          </button>
        ))}
      </div>
      <BigStroke key={tab.char} char={tab.char} onStrokes={onStrokes} />
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        {tab.isTraditional && (
          <>
            <dt className="text-muted">Dạng</dt>
            <dd>
              Phồn thể của{" "}
              <span lang="zh" className="hanzi">
                {g.char}
              </span>
            </dd>
          </>
        )}
        {g.hanViet && (
          <>
            <dt className="text-muted">Hán Việt</dt>
            <dd className="font-bold text-hanviet uppercase">{g.hanViet}</dd>
          </>
        )}
        {g.pinyin && (
          <>
            <dt className="text-muted">Pinyin</dt>
            <dd>{g.pinyin}</dd>
          </>
        )}
        {g.meaningVi && (
          <>
            <dt className="text-muted">Nghĩa</dt>
            <dd>{g.meaningVi.split(";").slice(0, 3).join("; ")}</dd>
          </>
        )}
        {g.radical && !tab.isTraditional && (
          <>
            <dt className="text-muted">Bộ thủ</dt>
            <dd>
              <span lang="zh" className="hanzi mr-1 text-base text-primary">
                {g.radical.char}
              </span>
              <b className="uppercase">{g.radical.nameVi}</b>
              <span className="text-muted"> · bộ số {g.radical.number}, tô đỏ trong hình</span>
            </dd>
          </>
        )}
        {strokes !== null && (
          <>
            <dt className="text-muted">Số nét</dt>
            <dd>{strokes} nét</dd>
          </>
        )}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/writing?c=${encodeURIComponent(g.char)}`}
          className="motion-button inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-sm font-semibold text-primary hover:bg-primary/15"
        >
          <Icon name="pencil" size={15} /> Tập viết
        </Link>
        <Link
          href={`/tu-dien?q=${encodeURIComponent(g.char)}&tab=han-tu`}
          className="motion-button inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-surface-2 text-sm font-semibold hover:text-primary"
        >
          <Icon name="search" size={15} /> Từ có chữ{" "}
          <span lang="zh" className="hanzi">
            {g.char}
          </span>
        </Link>
      </div>
    </section>
  );
}
