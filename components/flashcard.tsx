"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Rating, Word } from "@/lib/types";

const RATINGS: { key: Rating; label: string; cls: string }[] = [
  { key: "AGAIN", label: "Quên", cls: "bg-primary text-primary-fg" },
  { key: "HARD", label: "Khó", cls: "bg-warn/20 text-warn" },
  { key: "GOOD", label: "Nhớ", cls: "bg-surface-2" },
  { key: "EASY", label: "Dễ", cls: "bg-good/20 text-good" },
];

export function Flashcard({
  word,
  isNew,
  onRate,
}: {
  word: Word;
  isNew: boolean;
  onRate: (rating: Rating, durationMs: number) => void;
}) {
  // Parent truyền key={word.id} nên component remount mỗi thẻ → state tự reset.
  const [revealed, setRevealed] = useState(false);
  const [start] = useState(() => Date.now());

  const example = word.examples?.[0];

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      {isNew && (
        <span className="mb-3 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
          từ mới
        </span>
      )}
      <div className="hanzi text-6xl font-semibold leading-tight">
        {word.simplified}
      </div>
      <div className="mt-3 text-lg text-muted">{word.pinyin}</div>

      {!revealed ? (
        <Button
          variant="secondary"
          className="mt-8"
          onClick={() => setRevealed(true)}
        >
          Xem nghĩa
        </Button>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="text-xl">{word.meaningVi ?? word.meaningEn ?? "—"}</div>
          {word.pos.length > 0 && (
            <div className="text-xs text-muted">{word.pos.join(" · ")}</div>
          )}
          {example && (
            <div className="rounded-lg bg-surface-2 p-3 text-sm">
              <div className="hanzi">{example.zh}</div>
              {example.pinyin && (
                <div className="text-muted">{example.pinyin}</div>
              )}
              {example.vi && <div className="mt-1">{example.vi}</div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RATINGS.map((r) => (
              <button
                key={r.key}
                onClick={() => onRate(r.key, Date.now() - start)}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition-opacity hover:opacity-90 ${r.cls}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
