"use client";

import { useEffect, useState } from "react";
import { AudioButton } from "./audio-button";
import { Icon } from "./icon";
import { mediaUrl } from "@/lib/api";
import type { Rating, Word } from "@/lib/types";

const RATINGS: { key: Rating; label: string; hint: string; cls: string }[] = [
  {
    key: "AGAIN",
    label: "Chưa nhớ",
    hint: "Cần học lại",
    cls: "border-danger/20 bg-danger/5 text-danger",
  },
  {
    key: "HARD",
    label: "Hơi khó",
    hint: "Cần gợi ý",
    cls: "border-warn/20 bg-warn/5 text-warn",
  },
  {
    key: "GOOD",
    label: "Đã nhớ",
    hint: "Nhớ được từ",
    cls: "border-primary/20 bg-primary/5 text-primary",
  },
  {
    key: "EASY",
    label: "Rất dễ",
    hint: "Nhớ chắc chắn",
    cls: "border-good/20 bg-good/5 text-good",
  },
];

export function Flashcard({
  word,
  isNew,
  onRate,
  busy = false,
}: {
  word: Word;
  isNew: boolean;
  onRate: (rating: Rating, durationMs: number) => void;
  busy?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [start] = useState(() => Date.now());
  const example = word.examples?.[0];

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    const u = mediaUrl(word.audioUrl);
    if (u) {
      try {
        void new Audio(u).play().catch(() => undefined);
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target.closest("input, textarea, select, button, a, [contenteditable]")
      )
        return;
      if (e.code === "Space" && !revealed) {
        e.preventDefault();
        reveal();
      }
      const rating = RATINGS[Number(e.key) - 1];
      if (revealed && !busy && rating) {
        e.preventDefault();
        onRate(rating.key, Date.now() - start);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, busy, onRate, start]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 text-xs text-muted">
        <span className="flex items-center gap-2">
          <Icon name="cards" size={16} />
          HSK {word.hskLevel}
        </span>
        <span
          className={`rounded-lg px-2.5 py-1 ${isNew ? "bg-accent/8 text-accent" : "bg-primary/8 text-primary"}`}
        >
          {isNew ? "Từ mới" : "Ôn lại"}
        </span>
      </div>

      <div className="flip-card" data-flipped={revealed}>
        <div className="flip-card-inner">
          {/* Mặt trước — chạm để lật */}
          <div
            role="button"
            tabIndex={0}
            onClick={reveal}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                reveal();
              }
            }}
            aria-label="Chạm để xem nghĩa"
            className={`flip-card-face flip-card-face--front panel motion-button flex min-h-[22rem] w-full flex-col items-center justify-center overflow-hidden px-5 py-8 text-center outline-none sm:px-8 ${revealed ? "cursor-default" : "cursor-pointer hover:border-primary/30"}`}
          >
            <p className="text-xs text-muted">Nhìn Hán tự và thử nhớ nghĩa</p>
            <div
              lang="zh"
              className="hanzi mt-7 break-all text-6xl leading-tight sm:text-7xl"
            >
              {word.simplified}
            </div>
            <div
              className="mt-4 flex items-center justify-center gap-1 text-xl text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {word.pinyin}
              <AudioButton src={word.audioUrl} />
            </div>
            <div className="mt-10 flex items-center gap-2 text-xs font-medium text-primary">
              <Icon name="refresh" size={15} />
              Chạm vào thẻ hoặc nhấn phím cách để lật
            </div>
          </div>

          {/* Mặt sau — nghĩa + đánh giá */}
          <div className="flip-card-face flip-card-face--back panel flex min-h-[22rem] flex-col justify-center overflow-hidden px-5 py-8 text-center sm:px-8">
            <div lang="zh" className="hanzi text-3xl text-muted sm:text-4xl">
              {word.simplified}
              <span className="ml-2 text-lg text-primary">{word.pinyin}</span>
            </div>
            <div className="mt-5 space-y-5">
              <div aria-live="polite">
                <p className="text-2xl font-semibold">
                  {word.meaningVi ?? word.meaningEn ?? "Nghĩa đang được cập nhật"}
                </p>
                {word.pos.length > 0 && (
                  <p className="mt-2 text-xs text-muted">{word.pos.join(" · ")}</p>
                )}
              </div>
              {example && (
                <div className="rounded-xl bg-surface-2/70 p-4 text-left text-sm leading-7">
                  <p lang="zh" className="hanzi text-xl">
                    {example.zh}
                  </p>
                  {example.pinyin && <p className="text-muted">{example.pinyin}</p>}
                  {(example.vi || example.en) && <p>{example.vi ?? example.en}</p>}
                </div>
              )}
              <div className="border-t border-border pt-5">
                <p className="mb-3 text-xs text-muted">Bạn nhớ từ này đến đâu?</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATINGS.map((r, i) => (
                    <button
                      key={r.key}
                      disabled={busy || !revealed}
                      onClick={() => onRate(r.key, Date.now() - start)}
                      className={`motion-button rounded-xl border px-2 py-3 transition-opacity hover:opacity-75 disabled:pointer-events-none disabled:opacity-40 ${r.cls}`}
                    >
                      <span className="text-sm font-semibold">{r.label}</span>
                      <span className="mt-1 block text-[10px]">{r.hint}</span>
                      <kbd className="mt-2 hidden text-[10px] opacity-70 sm:block">
                        {i + 1}
                      </kbd>
                    </button>
                  ))}
                </div>
                {busy && (
                  <p role="status" className="mt-3 text-xs text-muted">
                    Đang lưu kết quả…
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
