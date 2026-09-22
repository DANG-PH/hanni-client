"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, PageHeading, Spinner } from "@/components/ui";
import { Icon } from "@/components/icon";
import { HanziWriterCanvas } from "@/components/hanzi-writer-canvas";
import { NextStep } from "@/components/next-step";
import { useRequireAuth } from "@/lib/auth";
import { useCurrentLesson, useLesson } from "@/lib/hooks";

interface HanziEntry {
  c: string;
  level: number;
  pinyin: string;
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function WritingPage() {
  const { user, loading } = useRequireAuth();
  const [index, setIndex] = useState<HanziEntry[] | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [level, setLevel] = useState<number | undefined>(1);
  const [q, setQ] = useState("");
  // Mặc định luyện viết ĐÚNG các chữ trong bài đang học, thay vì đổ ra cả
  // 3.088 chữ của một cấp — trang này vốn là chỗ "loạn" nhất vì đọc file
  // tĩnh theo cấp, không có khái niệm bài học/chủ đề nào.
  const current = useCurrentLesson();
  const lessonDetail = useLesson(current.data?.id ?? null);
  const [byLesson, setByLesson] = useState(true);
  const lessonChars = useMemo(() => {
    const words = lessonDetail.data?.words;
    if (!words?.length) return null;
    return new Set(words.flatMap((w) => Array.from(w.simplified)));
  }, [lessonDetail.data]);
  const lessonScope = byLesson && !!lessonChars;
  const [active, setActive] = useState<string | null>(null);
  const [strokeCount, setStrokeCount] = useState<number | null>(null);

  useEffect(() => {
    setStrokeCount(null);
  }, [active]);

  useEffect(() => {
    fetch("/hanzi-strokes/index.json")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: HanziEntry[]) => {
        setIndex(data);
        setActive((prev) => prev ?? data.find((d) => d.level === 1)?.c ?? data[0]?.c ?? null);
      })
      .catch(() => setIndexError(true));
  }, []);

  const filtered = useMemo(() => {
    if (!index) return [];
    const term = q.trim();
    return index.filter((entry) => {
      if (lessonScope) {
        if (!lessonChars!.has(entry.c)) return false;
      } else if (level && entry.level !== level) return false;
      if (!term) return true;
      return entry.c.includes(term) || entry.pinyin.toLowerCase().includes(term.toLowerCase());
    });
  }, [index, level, q, lessonScope, lessonChars]);

  // Luôn lấy trong danh sách ĐANG LỌC: đổi sang "chữ trong bài" mà vẫn giữ
  // chữ cũ không thuộc bài thì hiển thị lệch với danh sách bên dưới.
  const activeEntry =
    filtered.find((e) => e.c === active) ?? filtered[0] ?? null;
  const activeIdx = activeEntry
    ? filtered.findIndex((e) => e.c === activeEntry.c)
    : -1;

  function step(delta: number) {
    if (!filtered.length) return;
    const base = activeIdx >= 0 ? activeIdx : 0;
    const next = (base + delta + filtered.length) % filtered.length;
    setActive(filtered[next].c);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, activeIdx]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        icon="pencil"
        eyebrow="Luyện tay"
        title="Luyện viết Hán tự"
        description="Xem thứ tự nét, tô theo nét mờ, rồi tự viết lại để kiểm tra trí nhớ."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="order-2 flex flex-col items-center gap-2 py-8 lg:order-1">
          {indexError ? (
            <EmptyState
              title="Chưa tải được danh sách chữ"
              description="Vui lòng thử lại sau."
            />
          ) : !activeEntry ? (
            <Spinner />
          ) : (
            <>
              <div className="flex w-full items-center justify-center gap-4">
                <button
                  onClick={() => step(-1)}
                  disabled={filtered.length < 2}
                  aria-label="Chữ trước"
                  className="motion-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  <Icon name="back" size={16} />
                </button>
                <div className="flex flex-col items-center gap-1">
                  <p lang="zh" className="hanzi text-5xl">
                    {activeEntry.c}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-primary">
                    {activeEntry.pinyin}
                    <span className="rounded-lg bg-primary/8 px-2 py-0.5 text-[11px] font-medium">
                      HSK {activeEntry.level}
                    </span>
                    {strokeCount != null && (
                      <span className="rounded-lg bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                        {strokeCount} nét
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => step(1)}
                  disabled={filtered.length < 2}
                  aria-label="Chữ tiếp theo"
                  className="motion-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  <Icon name="arrow" size={16} />
                </button>
              </div>
              <div className="mt-4 w-full">
                <HanziWriterCanvas
                  key={activeEntry.c}
                  char={activeEntry.c}
                  onLoaded={({ strokeCount: n }) => setStrokeCount(n)}
                />
              </div>
            </>
          )}
        </Card>
        <Card className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3.5 top-3 text-muted"
              size={17}
            />
            <input
              aria-label="Tìm chữ hoặc pinyin"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm chữ, pinyin…"
              className="field pl-10!"
            />
          </div>
          {/* Cho thấy RÕ đang luyện chữ của bài nào, và đổi được sang cả cấp.
           * Trước đó trang chỉ đổ ra toàn bộ chữ của 1 cấp, không dính gì tới
           * bài đang học. */}
          {lessonChars && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-2.5 text-xs">
              <button
                onClick={() => setByLesson(true)}
                aria-pressed={byLesson}
                className={`motion-button min-h-8 rounded-lg px-2.5 py-1 font-medium ${byLesson ? "bg-primary text-primary-fg" : "text-muted hover:text-primary"}`}
              >
                Chữ trong bài đang học
              </button>
              <button
                onClick={() => setByLesson(false)}
                aria-pressed={!byLesson}
                className={`motion-button min-h-8 rounded-lg px-2.5 py-1 font-medium ${!byLesson ? "bg-primary text-primary-fg" : "text-muted hover:text-primary"}`}
              >
                Toàn bộ cấp HSK
              </button>
              {byLesson && current.data && (
                <span className="w-full text-[11px] text-muted">
                  Bài {current.data.orderIndex}: {current.data.title}
                </span>
              )}
            </div>
          )}
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Lọc theo cấp HSK"
            hidden={lessonScope}
          >
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                aria-pressed={level === l}
                className={`motion-button min-h-8 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${level === l ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"}`}
              >
                HSK {l}
              </button>
            ))}
          </div>
          <div className="grid max-h-[420px] grid-cols-5 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-6">
            {!index ? (
              <div className="col-span-full py-6">
                <Spinner />
              </div>
            ) : filtered.length === 0 ? (
              <p className="col-span-full py-6 text-center text-xs text-muted">
                Không tìm thấy chữ phù hợp.
              </p>
            ) : (
              filtered.map((entry) => (
                <button
                  key={entry.c}
                  onClick={() => setActive(entry.c)}
                  aria-pressed={active === entry.c}
                  lang="zh"
                  className={`hanzi motion-button flex h-11 items-center justify-center rounded-lg border text-xl ${active === entry.c ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:border-primary/40"}`}
                >
                  {entry.c}
                </button>
              ))
            )}
          </div>
          {index && (
            <p className="text-center text-xs text-muted">
              {filtered.length} / {index.length} chữ
            </p>
          )}
        </Card>
      </div>

      {/* Trang này trước đó KHÔNG dẫn đi đâu — viết xong là cụt đường. Gợi ý
       * bước tiếp theo tự nhiên: tra nghĩa chính chữ vừa viết, rồi ôn lại. */}
      <NextStep
        title="Viết xong rồi, nhớ nghĩa chưa?"
        description={
          activeEntry
            ? `Xem nghĩa và âm Hán Việt của ${activeEntry.c}, hoặc ôn lại những từ đã học.`
            : "Tra nghĩa các chữ vừa viết, hoặc ôn lại những từ đã học."
        }
        actions={[
          ...(activeEntry
            ? [
                {
                  href: `/tu-dien/${encodeURIComponent(activeEntry.c)}`,
                  label: `Nghĩa của ${activeEntry.c}`,
                  icon: "book" as const,
                },
              ]
            : []),
          { href: "/study", label: "Ôn tập flashcard", icon: "cards" as const },
          { href: "/learn", label: "Lộ trình HSK", icon: "route" as const },
        ]}
      />
    </div>
  );
}
