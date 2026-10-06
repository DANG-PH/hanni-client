"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { playListening, stopListening } from "@/lib/listening-audio";
import type {
  MockAnswer,
  MockItem,
  MockPart,
  MockReviewItem,
  MockSectionKind,
  Ruby,
} from "@/lib/types";

export const LETTERS = ["A", "B", "C", "D", "E", "F"];
const SPEAKER_VI = { M: "Nam", F: "Nữ", N: "Hỏi" } as const;

/** Chữ Hán, pinyin nằm TRÊN từng chữ như đề HSK 1–2 in. */
export function RubyText({
  ruby,
  pinyin,
  className = "",
}: {
  ruby: Ruby;
  pinyin: boolean;
  className?: string;
}) {
  const chars = Array.from(ruby.zh);
  return (
    <span
      lang="zh"
      className={`hanzi [&_rt]:font-sans [&_rt]:text-[0.5em] [&_rt]:font-normal [&_rt]:text-muted ${className}`}
    >
      {pinyin
        ? chars.map((c, i) =>
            ruby.py[i] ? (
              <ruby key={i} className="mx-px">
                {c}
                <rt>{ruby.py[i]}</rt>
              </ruby>
            ) : (
              <span key={i}>{c}</span>
            ),
          )
        : ruby.zh}
    </span>
  );
}

/** Nút nghe 1 câu: đọc 2 lần như đề thật, bấm lại để nghe lại. Thiết bị
 * không có giọng tiếng Trung thì cho xem lời thoại thay vì im lặng. */
export function ListenButton({
  audio,
}: {
  audio: NonNullable<MockItem["audio"]>;
}) {
  const [state, setState] = useState<"idle" | "playing" | "no-voice">("idle");
  const [round, setRound] = useState(0);
  const [played, setPlayed] = useState(false);

  async function play() {
    if (state === "playing") {
      stopListening();
      return;
    }
    setState("playing");
    const r = await playListening(audio, setRound);
    setPlayed(true);
    setState(r === "no-voice" ? "no-voice" : "idle");
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={play}
        aria-label="Nghe câu này"
        className={`motion-button inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
          state === "playing"
            ? "bg-primary text-primary-fg"
            : "bg-primary/10 text-primary hover:bg-primary/15"
        }`}
      >
        <Icon name={state === "playing" ? "pause" : "sound"} size={16} />
        {state === "playing"
          ? `Đang phát · lần ${round}/2`
          : played
            ? "Nghe lại"
            : "Nghe"}
      </button>
      {state === "no-voice" && (
        <div className="rounded-xl bg-warn/10 px-3 py-2 text-xs leading-5">
          <p className="font-semibold">
            Thiết bị chưa có giọng đọc tiếng Trung — đọc lời thoại thay vì nghe:
          </p>
          {audio.lines.map((l, i) => (
            <p key={i} lang="zh" className="hanzi mt-1 text-sm">
              {SPEAKER_VI[l.s]}: {l.zh}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function PictureTile({
  emoji,
  label,
  size = "md",
}: {
  emoji: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "h-24 min-w-28 text-5xl"
      : size === "sm"
        ? "h-14 min-w-16 text-3xl"
        : "h-20 min-w-24 text-4xl";
  return (
    <span className="flex flex-col items-center gap-1">
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-2xl bg-surface-2 px-2 leading-none tracking-tight whitespace-nowrap ${box}`}
      >
        {emoji}
      </span>
      {label && <span className="max-w-28 text-center text-[11px] text-muted">{label}</span>}
    </span>
  );
}

type OptState = "idle" | "picked" | "right" | "wrong" | "dim";

function optionState(
  value: MockAnswer,
  given: MockAnswer | null,
  review?: MockReviewItem,
): OptState {
  if (!review) return given === value ? "picked" : "idle";
  if (value === review.answer) return "right";
  if (value === review.given) return "wrong";
  return "dim";
}

const OPT_CLASS: Record<OptState, string> = {
  idle: "border-border bg-surface hover:border-primary/40 hover:bg-primary/5",
  picked: "border-foreground bg-foreground/10 text-foreground",
  right: "border-good bg-good/10 text-good",
  wrong: "border-danger bg-danger/10 text-danger",
  dim: "border-border bg-surface opacity-60",
};

function OptionButton({
  state,
  onClick,
  children,
  className = "",
  label,
}: {
  state: OptState;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={state === "picked"}
      disabled={!onClick}
      onClick={onClick}
      className={`motion-button rounded-2xl border-2 transition-colors disabled:cursor-default ${OPT_CLASS[state]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Bảng phương án A–F dùng chung cả phần (tranh hoặc chữ). */
export function SharedBoard({
  part,
  pinyin,
  labels,
}: {
  part: MockPart;
  pinyin: boolean;
  labels?: string[];
}) {
  if (part.pictures)
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {part.pictures.map((e, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface p-2">
            <span className="text-xs font-bold text-muted">{LETTERS[i]}</span>
            <PictureTile emoji={e} label={labels?.[i]} size="sm" />
          </div>
        ))}
      </div>
    );
  if (part.options)
    return (
      <div className={`grid gap-2 ${part.type === "fill-blank" ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {part.options.map((o, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold">
              {LETTERS[i]}
            </span>
            <RubyText ruby={o} pinyin={pinyin} className="text-lg" />
          </div>
        ))}
      </div>
    );
  return null;
}

function LetterRow({
  count,
  given,
  review,
  onChange,
}: {
  count: number;
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {LETTERS.slice(0, count).map((l, i) => (
        <OptionButton
          key={l}
          label={`Chọn ${l}`}
          state={optionState(i, given, review)}
          onClick={onChange && (() => onChange(i))}
          className="h-9 w-9 text-sm font-bold sm:h-10 sm:w-10"
        >
          {l}
        </OptionButton>
      ))}
    </div>
  );
}

function JudgeButtons({
  given,
  review,
  onChange,
}: {
  given: MockAnswer | null;
  review?: MockReviewItem;
  onChange?: (v: MockAnswer) => void;
}) {
  return (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <OptionButton
          key={String(v)}
          label={v ? "Đúng với tranh" : "Sai với tranh"}
          state={optionState(v, given, review)}
          onClick={onChange && (() => onChange(v))}
          className="flex h-11 w-16 items-center justify-center"
        >
          <Icon name={v ? "check" : "close"} size={20} />
        </OptionButton>
      ))}
    </div>
  );
}

/** Lời thoại + bản dịch + giải thích — chỉ hiện khi chữa bài. */
function ReviewNotes({ review, pinyin }: { review: MockReviewItem; pinyin: boolean }) {
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
      {review.transcript?.map((l, i) => (
        <p key={i} className="flex gap-2">
          <span className="shrink-0 text-xs font-semibold leading-7 text-muted">
            {SPEAKER_VI[l.s]}:
          </span>
          <RubyText ruby={l} pinyin={pinyin} className="text-base leading-7" />
        </p>
      ))}
      <p className="leading-6">{review.vi}</p>
      {review.explain && (
        <p className="flex items-start gap-1.5 text-xs leading-5 text-muted">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-primary" />
          {review.explain}
        </p>
      )}
    </div>
  );
}

/** 1 câu hỏi. `onChange` vắng mặt = chế độ chữa bài (chỉ xem). */
export function ExamItem({
  part,
  item,
  section,
  given,
  onChange,
  review,
  pinyin,
  flagged,
  onFlag,
}: {
  part: MockPart;
  item: MockItem;
  section: MockSectionKind;
  given: MockAnswer | null;
  onChange?: (v: MockAnswer) => void;
  review?: MockReviewItem;
  pinyin: boolean;
  flagged?: boolean;
  onFlag?: () => void;
}) {
  const listening = section === "listening";
  const labels = review?.pictureLabels;
  const badge = review
    ? review.correct
      ? "bg-good text-white"
      : review.given === null
        ? "bg-muted/30 text-foreground"
        : "bg-danger text-white"
    : given !== null
      ? "bg-foreground text-background"
      : "bg-surface-2 text-foreground";

  // Rời trang/đổi câu khi đang phát thì dừng, khỏi đọc chồng lên câu khác.
  useEffect(() => () => stopListening(), []);

  return (
    <article
      id={`q-${item.no}`}
      className="scroll-mt-28 rounded-3xl border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        {/* Nút đánh dấu nằm DƯỚI số câu (cột trái vốn có sẵn) — để riêng 1 cột
         * bên phải thì điện thoại hẹp không đủ chỗ cho hàng A–F. */}
        <div className="flex shrink-0 flex-col items-center gap-2">
          <span className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-1.5 text-sm font-bold ${badge}`}>
            {item.no}
          </span>
          {onFlag && (
            <button
              type="button"
              onClick={onFlag}
              aria-label={flagged ? "Bỏ đánh dấu câu này" : "Đánh dấu để xem lại"}
              aria-pressed={flagged}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
                flagged ? "border-warn bg-warn/15 text-warn" : "border-border text-muted hover:text-foreground"
              }`}
            >
              <Icon name="flag" size={15} />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {listening && item.audio && <ListenButton audio={item.audio} />}

          {part.type === "judge" && item.picture && (
            <div className="flex flex-wrap items-center gap-4">
              <PictureTile emoji={item.picture} label={labels?.[0]} size="lg" />
              {item.text && <RubyText ruby={item.text} pinyin={pinyin} className="text-2xl" />}
              <div className="ml-auto">
                <JudgeButtons given={given} review={review} onChange={onChange} />
              </div>
            </div>
          )}

          {part.type === "choose-picture" && item.pictures && (
            <div className="flex flex-wrap gap-3">
              {item.pictures.map((e, i) => (
                <OptionButton
                  key={i}
                  label={`Chọn tranh ${LETTERS[i]}`}
                  state={optionState(i, given, review)}
                  onClick={onChange && (() => onChange(i))}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  <span className="text-xs font-bold">{LETTERS[i]}</span>
                  <PictureTile emoji={e} label={labels?.[i]} />
                </OptionButton>
              ))}
            </div>
          )}

          {part.type === "choose-text" && item.options && (
            <div className="grid gap-2 sm:grid-cols-3">
              {item.options.map((o, i) => (
                <OptionButton
                  key={i}
                  label={`Chọn ${LETTERS[i]}`}
                  state={optionState(i, given, review)}
                  onClick={onChange && (() => onChange(i))}
                  className="flex items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span className="text-xs font-bold">{LETTERS[i]}</span>
                  <RubyText ruby={o} pinyin={pinyin} className="text-lg" />
                </OptionButton>
              ))}
            </div>
          )}

          {(part.type === "match-picture" || part.type === "match-text") && (
            <>
              {item.text && <RubyText ruby={item.text} pinyin={pinyin} className="text-xl leading-loose" />}
              <LetterRow
                count={(part.pictures ?? part.options ?? []).length}
                given={given}
                review={review}
                onChange={onChange}
              />
            </>
          )}

          {part.type === "fill-blank" && item.blank && (
            <>
              <p className="text-xl leading-loose">
                <RubyText ruby={item.blank.before} pinyin={pinyin} />
                <span
                  className={`mx-1 inline-block min-w-14 border-b-2 px-1 text-center ${
                    review ? (review.correct ? "border-good" : "border-danger") : "border-foreground"
                  }`}
                >
                  {review && !review.correct && typeof given === "number" && part.options?.[given] && (
                    <s className="mr-1 text-danger">
                      <RubyText ruby={part.options[given]} pinyin={pinyin} />
                    </s>
                  )}
                  {review && typeof review.answer === "number" && part.options?.[review.answer] ? (
                    <span className="text-good">
                      <RubyText ruby={part.options[review.answer]} pinyin={pinyin} />
                    </span>
                  ) : typeof given === "number" && part.options?.[given] ? (
                    <RubyText ruby={part.options[given]} pinyin={pinyin} />
                  ) : (
                    " "
                  )}
                </span>
                <RubyText ruby={item.blank.after} pinyin={pinyin} />
              </p>
              <LetterRow count={part.options?.length ?? 0} given={given} review={review} onChange={onChange} />
            </>
          )}

          {review && <ReviewNotes review={review} pinyin={pinyin} />}
        </div>
      </div>
    </article>
  );
}
