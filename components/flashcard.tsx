"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { AudioButton } from "./audio-button";
import { Icon } from "./icon";
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
        setRevealed(true);
      }
      const rating = RATINGS[Number(e.key) - 1];
      if (revealed && !busy && rating) {
        e.preventDefault();
        onRate(rating.key, Date.now() - start);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, busy, onRate, start]);

  return (
    <div className="reveal panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 text-xs text-muted">
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
      <div className="px-5 py-8 text-center sm:px-8">
        <p className="text-xs text-muted">Nhìn Hán tự và thử nhớ nghĩa</p>
        <div
          lang="zh"
          className="hanzi mt-7 break-all text-6xl leading-tight sm:text-7xl"
        >
          {word.simplified}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-xl text-primary">
          {word.pinyin}
          <AudioButton src={word.audioUrl} />
        </p>
        {!revealed ? (
          <div className="mt-10">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setRevealed(true)}
            >
              <Icon name="refresh" size={17} />
              Lật thẻ xem nghĩa
            </Button>
            <p className="mt-4 text-xs text-muted">
              Chạm vào nút hoặc nhấn phím cách
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-5">
            <div aria-live="polite">
              <p className="text-2xl font-semibold">
                {word.meaningVi ?? word.meaningEn ?? "Nghĩa đang được cập nhật"}
              </p>
              {word.pos.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {word.pos.join(" · ")}
                </p>
              )}
            </div>
            {example && (
              <div className="rounded-xl bg-surface-2/70 p-4 text-sm leading-7">
                <p lang="zh" className="hanzi text-xl">
                  {example.zh}
                </p>
                {example.pinyin && (
                  <p className="text-muted">{example.pinyin}</p>
                )}
                {(example.vi || example.en) && (
                  <p>{example.vi ?? example.en}</p>
                )}
              </div>
            )}
            <div className="border-t border-border pt-5">
              <p className="mb-3 text-xs text-muted">Bạn nhớ từ này đến đâu?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map((r, i) => (
                  <button
                    key={r.key}
                    disabled={busy}
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
        )}
      </div>
    </div>
  );
}
