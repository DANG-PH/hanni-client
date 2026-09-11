"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icon";

type Mode = "watch" | "trace" | "quiz";

const MODES: { key: Mode; label: string; icon: "eye" | "pencil" | "check" }[] = [
  { key: "watch", label: "Xem", icon: "eye" },
  { key: "trace", label: "Tô lại", icon: "pencil" },
  { key: "quiz", label: "Kiểm tra", icon: "check" },
];

function cssVar(name: string): string {
  if (typeof window === "undefined") return "#555555";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#555555";
}

/** Canvas luyện viết 1 Hán tự — 3 chế độ: xem hoạt hình, tô theo nét mờ, tự viết kiểm tra. */
export function HanziWriterCanvas({ char }: { char: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [mode, setMode] = useState<Mode>("watch");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [quizFeedback, setQuizFeedback] = useState<
    { state: "mistake" | "correct" | "done"; mistakes?: number } | null
  >(null);

  useEffect(() => {
    if (!hostRef.current) return;
    setStatus("loading");
    setQuizFeedback(null);
    hostRef.current.innerHTML = "";

    const writer = HanziWriter.create(hostRef.current, char, {
      width: 280,
      height: 280,
      padding: 16,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 250,
      strokeColor: cssVar("--foreground"),
      radicalColor: cssVar("--primary"),
      outlineColor: cssVar("--border"),
      highlightColor: cssVar("--primary"),
      drawingColor: cssVar("--good"),
      charDataLoader: (c, onLoad, onError) => {
        fetch(`/hanzi-strokes/${encodeURIComponent(c)}.json`)
          .then((res) => {
            if (!res.ok) throw new Error("not found");
            return res.json();
          })
          .then(onLoad)
          .catch(onError);
      },
      onLoadCharDataSuccess: () => setStatus("ready"),
      onLoadCharDataError: () => setStatus("error"),
    });
    writerRef.current = writer;
    writer.showCharacter();

    return () => {
      writerRef.current = null;
    };
  }, [char]);

  function runMode(next: Mode) {
    const writer = writerRef.current;
    if (!writer || status !== "ready") return;
    setMode(next);
    setQuizFeedback(null);
    writer.cancelQuiz();
    if (next === "watch") {
      writer.hideOutline({ duration: 0 });
      writer.showCharacter({ duration: 0 });
      void writer.animateCharacter();
      return;
    }
    if (next === "trace") {
      writer.showOutline({ duration: 0 });
      writer.hideCharacter({ duration: 0 });
      writer.quiz({
        onMistake: () => setQuizFeedback({ state: "mistake" }),
        onCorrectStroke: () => setQuizFeedback({ state: "correct" }),
        onComplete: (res) =>
          setQuizFeedback({ state: "done", mistakes: res.totalMistakes }),
      });
      return;
    }
    // quiz "kiểm tra": không gợi ý nét mờ
    writer.hideOutline({ duration: 0 });
    writer.hideCharacter({ duration: 0 });
    writer.quiz({
      onMistake: () => setQuizFeedback({ state: "mistake" }),
      onCorrectStroke: () => setQuizFeedback({ state: "correct" }),
      onComplete: (res) =>
        setQuizFeedback({ state: "done", mistakes: res.totalMistakes }),
    });
  }

  function replay() {
    runMode(mode);
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Chế độ luyện viết"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => runMode(m.key)}
            disabled={status !== "ready"}
            aria-pressed={mode === m.key}
            className={`motion-button flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${mode === m.key ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"}`}
          >
            <Icon name={m.icon} size={15} />
            {m.label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto flex w-fit items-center justify-center rounded-2xl border border-border bg-surface-2/50 p-3">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
            Đang tải nét chữ…
          </div>
        )}
        {status === "error" && (
          <div className="flex h-[280px] w-[280px] items-center justify-center px-6 text-center text-xs text-muted">
            Chưa có dữ liệu nét viết cho chữ này.
          </div>
        )}
        <div
          ref={hostRef}
          className="[&_svg]:!bg-transparent"
          style={{ width: 280, height: 280, visibility: status === "ready" ? "visible" : "hidden" }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div aria-live="polite" className="min-h-5 text-xs">
          {quizFeedback?.state === "mistake" && (
            <span className="text-danger">Sai nét rồi, thử lại nét này nhé.</span>
          )}
          {quizFeedback?.state === "correct" && (
            <span className="text-good">Đúng nét — tiếp tục nào.</span>
          )}
          {quizFeedback?.state === "done" && (
            <span className="font-medium text-good">
              <Icon name="check" size={13} className="mr-1 inline" />
              Xong! {quizFeedback.mistakes === 0
                ? "Không sai nét nào."
                : `Sai ${quizFeedback.mistakes} lần.`}
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={replay} disabled={status !== "ready"}>
          <Icon name="refresh" size={16} />
          Chạy lại
        </Button>
      </div>
    </div>
  );
}
