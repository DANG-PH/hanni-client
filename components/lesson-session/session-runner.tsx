"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import { Icon } from "@/components/icon";
import { Button, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { savePendingLesson } from "@/lib/pending-lessons";
import type {
  LessonCompleteResult,
  LessonSession,
  SessionStep,
  SessionWord,
} from "@/lib/types";
import { SessionComplete } from "./session-complete";
import {
  ChoiceStep,
  IntroStep,
  MatchStep,
  SentenceStep,
  playWord,
  shortMeaning,
} from "./steps";

interface QueueItem {
  key: string;
  step: SessionStep;
}

/** Mỗi từ được hỏi lại tối đa chừng này lần khi trả lời sai (kiểu Duolingo:
 * câu sai quay lại cuối bài), tránh vòng lặp vô tận với từ quá khó. */
const MAX_RETRIES_PER_WORD = 2;

/** Làm mới các số liệu phụ thuộc kết quả bài: lộ trình, chuỗi ngày, ôn tập,
 * nhiệm vụ ngày, tiến độ. */
function refreshAfterLesson() {
  void mutate(
    (key) =>
      typeof key === "string" &&
      ["/learn", "/streak", "/study", "/quests", "/progress", "/leaderboard"].some(
        (p) => key.startsWith(p),
      ),
  );
}

export function SessionRunner({ session }: { session: LessonSession }) {
  const { user } = useAuth();
  const router = useRouter();
  const words = useMemo(
    () => new Map(session.words.map((w) => [w.id, w])),
    [session.words],
  );
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    session.steps.map((step, i) => ({ key: `s${i}`, step })),
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [finished, setFinished] = useState<{
    durationMs: number;
    accuracy: number;
    result: LessonCompleteResult | null;
    saveError: boolean;
  } | null>(null);
  const mistakes = useRef(new Map<string, number>());
  const retries = useRef(new Map<string, number>());
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const item = queue[index];
  const step = item?.step;
  const word: SessionWord | undefined =
    step && "wordId" in step ? words.get(step.wordId) : undefined;
  const answered = picked !== null;
  const correct =
    answered && step && (step.kind === "choice" || step.kind === "sentence")
      ? picked === step.answer
      : null;

  const addMistake = useCallback((wordId: string) => {
    mistakes.current.set(wordId, (mistakes.current.get(wordId) ?? 0) + 1);
  }, []);

  const finish = useCallback(async () => {
    const durationMs = Date.now() - startedAt.current;
    const results = session.words.map((w) => ({
      wordId: w.id,
      mistakes: mistakes.current.get(w.id) ?? 0,
    }));
    const accuracy =
      results.filter((r) => r.mistakes === 0).length / (results.length || 1);
    if (!user) {
      savePendingLesson({
        lessonId: session.lesson.id,
        hskLevel: session.lesson.hskLevel,
        results,
        durationMs,
      });
      setFinished({ durationMs, accuracy, result: null, saveError: false });
      return;
    }
    try {
      const result = await api.post<LessonCompleteResult>(
        `/learn/lessons/${session.lesson.id}/complete`,
        { results, durationMs },
      );
      refreshAfterLesson();
      setFinished({ durationMs, accuracy, result, saveError: false });
    } catch {
      setFinished({ durationMs, accuracy, result: null, saveError: true });
    }
  }, [session, user]);

  const advance = useCallback(() => {
    setPicked(null);
    if (index + 1 < queue.length) setIndex(index + 1);
    else void finish();
  }, [index, queue.length, finish]);

  const answer = useCallback(
    (i: number) => {
      if (!step || (step.kind !== "choice" && step.kind !== "sentence")) return;
      setPicked(i);
      if (i === step.answer) {
        const w = words.get(step.wordId);
        if (step.kind === "choice" && step.prompt !== "audio") playWord(w?.audioUrl);
        return;
      }
      addMistake(step.wordId);
      const used = retries.current.get(step.wordId) ?? 0;
      if (used < MAX_RETRIES_PER_WORD) {
        retries.current.set(step.wordId, used + 1);
        setQueue((q) => [...q, { key: `${item.key}-r${used + 1}`, step }]);
      }
    },
    [step, item, words, addMistake],
  );

  // Enter = Tiếp tục (sau khi đã trả lời, hoặc ở thẻ giới thiệu từ).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || finished || confirmExit) return;
      if (step?.kind === "intro" || answered) {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, answered, advance, finished, confirmExit]);

  if (finished) {
    return (
      <SessionComplete
        session={session}
        durationMs={finished.durationMs}
        accuracy={finished.accuracy}
        result={finished.result}
        saveError={finished.saveError}
        isGuest={!user}
      />
    );
  }
  if (!step) return null;

  const progress = (index / queue.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            aria-label="Thoát bài học"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <ProgressBar value={progress} label="Tiến độ bài học" />
            <p className="mt-1 truncate text-[11px] text-muted">
              HSK {session.lesson.hskLevel === 7 ? "7–9" : session.lesson.hskLevel}{" "}
              · Bài {session.lesson.orderIndex}: {session.lesson.title}
            </p>
          </div>
        </div>
      </header>

      <main
        key={item.key}
        className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-40"
        style={{ animation: "reveal-in 280ms var(--motion-ease) both" }}
      >
        {step.kind === "intro" && word && <IntroStep word={word} />}
        {step.kind === "choice" && word && (
          <ChoiceStep step={step} word={word} picked={picked} onPick={answer} />
        )}
        {step.kind === "sentence" && (
          <SentenceStep step={step} picked={picked} onPick={answer} />
        )}
        {step.kind === "match" && (
          <MatchStep
            words={step.wordIds
              .map((id) => words.get(id))
              .filter((w): w is SessionWord => !!w)}
            onMistake={addMistake}
            onDone={advance}
          />
        )}
      </main>

      {(step.kind === "intro" || answered) && (
        <footer
          className={`fixed inset-x-0 bottom-0 z-20 border-t ${
            correct === null
              ? "border-border bg-surface"
              : correct
                ? "border-good/30 bg-good/10"
                : "border-danger/30 bg-danger/10"
          }`}
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
            {correct !== null && word && (
              <div className="min-w-0 flex-1">
                <p
                  className={`flex items-center gap-1.5 font-bold ${
                    correct ? "text-good" : "text-danger"
                  }`}
                >
                  <Icon name={correct ? "check" : "close"} size={18} />
                  {correct ? "Chính xác!" : "Chưa đúng"}
                </p>
                <p className="mt-0.5 truncate text-sm">
                  <span lang="zh" className="hanzi">
                    {word.simplified}
                  </span>{" "}
                  <span className="text-muted">{word.pinyin}</span> —{" "}
                  {shortMeaning(word.meaningVi ?? "")}
                </p>
              </div>
            )}
            <Button
              onClick={advance}
              className={`sm:ml-auto sm:min-w-40 ${correct === false ? "bg-none! bg-danger! border-danger!" : ""}`}
            >
              {correct === false ? "Đã hiểu" : "Tiếp tục"}
              <Icon name="arrow" size={16} />
            </Button>
          </div>
        </footer>
      )}

      {confirmExit && (
        <div
          role="dialog"
          aria-label="Thoát bài học"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold">Dừng bài học?</h2>
            <p className="mt-2 text-sm text-muted">
              Còn một chút nữa thôi. Nếu thoát bây giờ, kết quả bài này sẽ chưa được lưu.
            </p>
            <div className="mt-5 grid gap-2">
              <Button onClick={() => setConfirmExit(false)}>Học tiếp</Button>
              <Button
                variant="ghost"
                onClick={() => router.push(user ? "/learn" : "/")}
              >
                Thoát
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
