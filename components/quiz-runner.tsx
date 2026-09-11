"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  ProgressBar,
} from "@/components/ui";
import { api, mediaUrl } from "@/lib/api";
import type { Quiz } from "@/lib/types";

/** Nhịp độ giây/câu ước lượng theo cấu trúc đề thi HSK 3.0 thật (càng cao cấp càng nhiều thời
 * gian suy nghĩ mỗi câu) — dùng làm mốc luyện tập tính giờ, không phải thời lượng đề thi chính thức. */
const SECONDS_PER_QUESTION: Record<number, number> = {
  1: 50,
  2: 50,
  3: 60,
  4: 60,
  5: 70,
  6: 70,
  7: 75,
  8: 75,
  9: 75,
};

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
  level,
  timed = false,
  onDone,
}: {
  quiz: Quiz;
  /** Cấp HSK của bài — chỉ dùng để chọn nhịp độ tính giờ khi `timed`. */
  level?: number;
  /** Bật đếm giờ từng câu, mô phỏng áp lực thời gian của đề thi thật. */
  timed?: boolean;
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
  const listening = q?.mode === "listening";
  // Câu nghe: ẩn Hán tự/pinyin cho tới khi đã chọn đáp án, giống nghe rồi mới biết đúng/sai.
  const revealed = !listening || picked !== null;

  const perQuestion = SECONDS_PER_QUESTION[level ?? 3] ?? 60;
  const [timeLeft, setTimeLeft] = useState(perQuestion);

  useEffect(() => {
    setTimeLeft(perQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    if (!timed || busy || !q) return;
    if (timeLeft <= 0) {
      void advance(picked ?? "");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, timed, busy]);

  // Tự phát âm khi vào câu nghe (thử phát, im lặng bỏ qua nếu trình duyệt chặn autoplay).
  useEffect(() => {
    if (!listening || !q?.audioUrl) return;
    const url = mediaUrl(q.audioUrl);
    if (!url) return;
    const audio = new Audio(url);
    void audio.play().catch(() => undefined);
    return () => audio.pause();
  }, [idx, listening, q?.audioUrl]);

  async function advance(chosenOverride?: string) {
    if (!q || submitLock.current) return;
    const chosen = chosenOverride ?? picked;
    if (chosen === null || chosen === undefined) return;
    const log: QuizAnswerLog = {
      wordId: q.wordId,
      isCorrect: chosen === q.answer,
      chosen,
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
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
            {listening ? "Phần nghe" : "Phần đọc"}
          </span>
          {timed && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${timeLeft <= 10 ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted"}`}
            >
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
      <ProgressBar value={(idx / total) * 100} label="Tiến độ bài kiểm tra" />
      <div className="rounded-2xl bg-surface-2/60 px-5 py-9 text-center">
        {listening ? (
          <>
            <p className="mb-5 text-xs text-muted">
              Nghe rồi chọn nghĩa đúng
            </p>
            <div className="flex justify-center">
              <AudioButton src={q.audioUrl} size={40} />
            </div>
            <p
              className={`mt-5 transition-opacity ${revealed ? "opacity-100" : "opacity-0"}`}
              aria-hidden={!revealed}
            >
              <span lang="zh" className="hanzi break-all text-4xl leading-tight">
                {revealed ? q.prompt : "　"}
              </span>
              <span className="mt-2 block text-base text-primary">
                {revealed ? q.pinyin : ""}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="mb-5 text-xs text-muted">Từ này có nghĩa là gì?</p>
            <h2
              lang="zh"
              className="hanzi break-all text-5xl leading-tight sm:text-6xl"
            >
              {q.prompt}
            </h2>
            <p className="mt-4 text-lg text-primary">{q.pinyin}</p>
          </>
        )}
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
        onClick={() => void advance()}
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
