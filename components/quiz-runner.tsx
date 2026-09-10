"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  ProgressBar,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Quiz } from "@/lib/types";

export interface QuizAnswerLog {
  wordId: string;
  isCorrect: boolean;
  chosen: string;
  correct: string;
}

export interface QuizSubmission {
  attemptId: string;
  scorePct: number;
  totalQuestions: number;
  answers: QuizAnswerLog[];
}

export function QuizRunner({
  quiz,
  onDone,
}: {
  quiz: Quiz;
  onDone: (scorePct: number, submission: QuizSubmission) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswerLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const valid =
    typeof quiz.attemptId === "string" &&
    quiz.attemptId.length > 0 &&
    questions.every(
      (question) =>
        typeof question.wordId === "string" &&
        typeof question.prompt === "string" &&
        typeof question.pinyin === "string" &&
        typeof question.answer === "string" &&
        Array.isArray(question.options) &&
        question.options.length > 1 &&
        question.options.every((option) => typeof option === "string") &&
        question.options.includes(question.answer),
    );
  const q = valid ? questions[idx] : undefined;
  const total = questions.length;

  async function next() {
    if (!q || picked === null || submitLock.current) return;
    const log: QuizAnswerLog = {
      wordId: q.wordId,
      isCorrect: picked === q.answer,
      chosen: picked,
      correct: q.answer,
    };
    const nextAnswers = [...answers, log];

    if (idx + 1 < total) {
      setAnswers(nextAnswers);
      setPicked(null);
      setIdx(idx + 1);
      return;
    }

    submitLock.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ scorePct: number }>("/quiz/submit", {
        attemptId: quiz.attemptId,
        answers: nextAnswers,
      });
      if (
        !Number.isFinite(res?.scorePct) ||
        res.scorePct < 0 ||
        res.scorePct > 100
      ) {
        throw new Error("Kết quả không hợp lệ");
      }
      onDone(res.scorePct, {
        attemptId: quiz.attemptId,
        scorePct: res.scorePct,
        totalQuestions: total,
        answers: nextAnswers,
      });
    } catch {
      setError(
        "Chưa lưu được bài làm. Đáp án của bạn vẫn được giữ lại; hãy thử nộp bài lần nữa.",
      );
      submitLock.current = false;
      setBusy(false);
    }
  }

  if (!q || !total)
    return (
      <EmptyState
        title="Chưa đủ câu hỏi để kiểm tra"
        description="Hãy học thêm từ vựng hoặc chọn một cấp độ khác rồi thử lại."
      />
    );

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">
          Câu {idx + 1}{" "}
          <span className="font-normal text-muted">/ {total}</span>
        </span>
        <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
          Chọn nghĩa đúng
        </span>
      </div>
      <ProgressBar value={(idx / total) * 100} label="Tiến độ bài kiểm tra" />
      <div className="rounded-2xl bg-surface-2/60 px-5 py-9 text-center">
        <p className="mb-5 text-xs text-muted">Từ này có nghĩa là gì?</p>
        <h2
          lang="zh"
          className="hanzi break-all text-5xl leading-tight sm:text-6xl"
        >
          {q.prompt}
        </h2>
        <p className="mt-4 text-lg text-primary">{q.pinyin}</p>
      </div>
      <div className="space-y-3" role="group" aria-label="Chọn đáp án">
        {q.options.map((opt, optionIndex) => {
          const isPicked = picked === opt;
          return (
            <button
              key={`${optionIndex}-${opt}`}
              type="button"
              aria-pressed={isPicked}
              disabled={busy}
              onClick={() => setPicked(opt)}
              className={`motion-button flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:opacity-60 ${isPicked ? "border-primary bg-primary/6" : "border-border hover:border-primary/30 hover:bg-surface-2"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isPicked ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"}`}
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="flex-1">{opt}</span>
              {isPicked && (
                <Icon
                  name="check"
                  size={18}
                  className="shrink-0 text-primary"
                />
              )}
            </button>
          );
        })}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        className="w-full"
        disabled={picked === null || busy}
        onClick={() => void next()}
      >
        {busy
          ? "Đang nộp bài…"
          : idx + 1 < total
            ? "Câu tiếp theo"
            : error
              ? "Thử nộp lại"
              : "Nộp bài kiểm tra"}
        <Icon name="arrow" size={16} />
      </Button>
    </Card>
  );
}
