"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { TONE_CLASS, TonePinyin } from "@/components/tone-pinyin";
import { mediaUrl } from "@/lib/api";
import { TONE_RULE_TEXT } from "@/lib/tone-rules";
import type { SessionStep, SessionWord } from "@/lib/types";

let current: HTMLAudioElement | null = null;
/** Phát audio của từ, dừng bản đang phát dở (chuyển bước nhanh không bị chồng tiếng). */
export function playWord(src: string | null | undefined) {
  const url = mediaUrl(src);
  if (!url) return;
  current?.pause();
  current = new Audio(url);
  void current.play().catch(() => undefined);
}

/** Nghĩa ngắn cho phương án — khớp `shortMeaning()` phía server. */
export function shortMeaning(meaning: string): string {
  const first = meaning.split(";")[0].trim();
  const stripped = first.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  const out = stripped || first;
  return out.length > 48 ? `${out.slice(0, 47).trimEnd()}…` : out;
}

function SoundButton({ src, big = false }: { src: string | null; big?: boolean }) {
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={() => playWord(src)}
      aria-label="Nghe phát âm"
      className={`motion-button inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15 ${
        big ? "h-20 w-20" : "h-10 w-10"
      }`}
    >
      <Icon name="sound" size={big ? 36 : 18} />
    </button>
  );
}

/** Thẻ giới thiệu từ mới: Hán tự + pinyin tô màu theo thanh, âm Hán Việt kèm
 * mẹo thanh điệu, nghĩa, ảnh, câu ví dụ. Tự phát âm khi hiện ra. */
export function IntroStep({ word }: { word: SessionWord }) {
  useEffect(() => {
    playWord(word.audioUrl);
  }, [word.id, word.audioUrl]);

  const example = word.examples[0];
  const hints = word.toneHints?.filter((h) => h.follows !== null) ?? [];

  return (
    <div className="flex flex-col items-center text-center">
      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-wide text-primary">
        TỪ MỚI
      </span>
      {word.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={word.imageUrl}
          alt=""
          className="mt-5 h-28 w-40 rounded-2xl object-cover shadow-sm"
        />
      )}
      <div className="mt-5 flex items-end gap-4">
        <TonePinyin
          zh={word.simplified}
          pinyin={word.pinyin}
          pinyinNum={word.pinyinNumeric}
          size="lg"
        />
        <SoundButton src={word.audioUrl} />
      </div>
      <p className="mt-5 text-2xl font-bold">
        {word.meaningVi ?? word.meaningEn ?? "Đang cập nhật nghĩa"}
      </p>
      {word.hanViet && (
        <div className="mt-4 w-full max-w-sm rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
          <p className="text-sm">
            Âm Hán Việt:{" "}
            <strong className="text-primary">{word.hanViet}</strong>
          </p>
          {hints.length > 0 && (
            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
              {hints.map((h, i) => (
                <li
                  key={`${h.char}-${i}`}
                  title={
                    h.follows
                      ? TONE_RULE_TEXT[h.rule]
                      : "Ngoại lệ — chữ này không theo quy luật, nhớ riêng nhé"
                  }
                  className="rounded-lg bg-surface px-2 py-1 text-[11px] text-muted"
                >
                  {h.hanViet} →{" "}
                  <span className={`font-bold ${TONE_CLASS[String(h.tone)]}`}>
                    thanh {h.tone}
                  </span>
                  {h.follows ? " ✓" : " (ngoại lệ)"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {example && (
        <div className="mt-4 w-full max-w-sm rounded-2xl bg-surface-2 px-4 py-3 text-left">
          <p lang="zh" className="hanzi text-lg">
            {example.zh}
          </p>
          {example.pinyin && (
            <p className="text-xs text-muted">{example.pinyin}</p>
          )}
          {example.vi && <p className="mt-1 text-sm">{example.vi}</p>}
        </div>
      )}
    </div>
  );
}

const OPTION_KEYS = ["1", "2", "3", "4"];

function OptionGrid({
  options,
  answer,
  picked,
  hanzi,
  onPick,
}: {
  options: string[];
  answer: number;
  picked: number | null;
  hanzi: boolean;
  onPick: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const i = OPTION_KEYS.indexOf(e.key);
      if (picked === null && i >= 0 && i < options.length) onPick(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options.length, picked, onPick]);

  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {options.map((opt, i) => {
        const state =
          picked === null
            ? "idle"
            : i === answer
              ? "right"
              : i === picked
                ? "wrong"
                : "dim";
        return (
          <button
            key={`${opt}-${i}`}
            type="button"
            disabled={picked !== null}
            onClick={() => onPick(i)}
            className={`motion-button flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
              state === "idle"
                ? "border-border bg-surface hover:border-primary/40 hover:bg-primary/5"
                : state === "right"
                  ? "border-good bg-good/10"
                  : state === "wrong"
                    ? "border-danger bg-danger/10"
                    : "border-border bg-surface opacity-50"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-xs text-muted">
              {i + 1}
            </span>
            <span
              lang={hanzi ? "zh" : undefined}
              className={hanzi ? "hanzi text-2xl" : "text-sm font-semibold"}
            >
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ChoiceStep({
  step,
  word,
  picked,
  onPick,
}: {
  step: Extract<SessionStep, { kind: "choice" }>;
  word: Pick<SessionWord, "simplified" | "meaningVi" | "audioUrl">;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  useEffect(() => {
    if (step.prompt === "audio") playWord(word.audioUrl);
  }, [step, word.audioUrl]);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold text-muted">
        {step.prompt === "hanzi"
          ? "Từ này nghĩa là gì?"
          : step.prompt === "meaning"
            ? "Chọn chữ Hán đúng"
            : "Bạn nghe thấy từ nào?"}
      </p>
      <div className="my-7 flex min-h-28 items-center justify-center">
        {step.prompt === "hanzi" && (
          <div className="flex items-end gap-3">
            <span lang="zh" className="hanzi text-6xl">
              {word.simplified}
            </span>
            <SoundButton src={word.audioUrl} />
          </div>
        )}
        {step.prompt === "meaning" && (
          <p className="max-w-md text-2xl font-bold">
            {shortMeaning(word.meaningVi ?? "")}
          </p>
        )}
        {step.prompt === "audio" && <SoundButton src={word.audioUrl} big />}
      </div>
      <OptionGrid
        options={step.options}
        answer={step.answer}
        picked={picked}
        hanzi={step.prompt !== "hanzi"}
        onPick={onPick}
      />
    </div>
  );
}

export function SentenceStep({
  step,
  picked,
  onPick,
}: {
  step: Extract<SessionStep, { kind: "sentence" }>;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  const fill = picked === null ? null : step.options[step.answer];
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold text-muted">Điền từ vào chỗ trống</p>
      <p lang="zh" className="hanzi my-6 text-3xl leading-relaxed">
        {step.before}
        <span
          className={`mx-1 inline-block min-w-16 border-b-2 px-1 ${
            fill ? "border-good text-good" : "border-primary"
          }`}
        >
          {fill ?? " "}
        </span>
        {step.after}
      </p>
      {step.vi && <p className="mb-6 text-sm text-muted">“{step.vi}”</p>}
      <OptionGrid
        options={step.options}
        answer={step.answer}
        picked={picked}
        hanzi
        onPick={onPick}
      />
    </div>
  );
}

interface Tile {
  wordId: string;
  label: string;
  side: "zh" | "vi";
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ghép Hán tự với nghĩa. Sai 1 cặp = tính 1 lần sai cho từ bên chữ Hán. */
export function MatchStep({
  words,
  onMistake,
  onDone,
}: {
  words: SessionWord[];
  onMistake: (wordId: string) => void;
  onDone: () => void;
}) {
  const [left] = useState<Tile[]>(() =>
    shuffled(words.map((w) => ({ wordId: w.id, label: w.simplified, side: "zh" as const }))),
  );
  const [right] = useState<Tile[]>(() =>
    shuffled(
      words.map((w) => ({
        wordId: w.id,
        label: shortMeaning(w.meaningVi ?? ""),
        side: "vi" as const,
      })),
    ),
  );
  const [selZh, setSelZh] = useState<string | null>(null);
  const [selVi, setSelVi] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const audioOf = useMemo(
    () => new Map(words.map((w) => [w.id, w.audioUrl])),
    [words],
  );

  function check(zhId: string, viId: string) {
    setSelZh(null);
    setSelVi(null);
    if (zhId === viId) {
      const next = new Set(matched).add(zhId);
      setMatched(next);
      if (next.size === words.length) setTimeout(onDone, 450);
      return;
    }
    onMistake(zhId);
    setWrong(`${zhId}|${viId}`);
    setTimeout(() => setWrong(null), 500);
  }

  function tileClass(t: Tile, selected: boolean) {
    const isWrong =
      wrong &&
      ((t.side === "zh" && wrong.startsWith(`${t.wordId}|`)) ||
        (t.side === "vi" && wrong.endsWith(`|${t.wordId}`)));
    if (matched.has(t.wordId)) return "border-good/40 bg-good/10 text-good opacity-60";
    if (isWrong) return "border-danger bg-danger/10 animate-[shake_0.35s]";
    if (selected) return "border-primary bg-primary/10";
    return "border-border bg-surface hover:border-primary/40";
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold text-muted">Ghép từ với nghĩa</p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="space-y-3">
          {left.map((t) => (
            <button
              key={t.wordId}
              type="button"
              disabled={matched.has(t.wordId)}
              onClick={() => {
                playWord(audioOf.get(t.wordId));
                if (selVi) check(t.wordId, selVi);
                else setSelZh(t.wordId);
              }}
              className={`motion-button flex min-h-14 w-full items-center justify-center rounded-2xl border-2 px-3 py-2 transition-colors ${tileClass(t, selZh === t.wordId)}`}
            >
              <span lang="zh" className="hanzi text-2xl">
                {t.label}
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {right.map((t) => (
            <button
              key={t.wordId}
              type="button"
              disabled={matched.has(t.wordId)}
              onClick={() => {
                if (selZh) check(selZh, t.wordId);
                else setSelVi(t.wordId);
              }}
              className={`motion-button flex min-h-14 w-full items-center justify-center rounded-2xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${tileClass(t, selVi === t.wordId)}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
