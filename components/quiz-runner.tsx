"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Quiz } from "@/lib/types";

interface AnswerLog {
  wordId: string;
  isCorrect: boolean;
  chosen: string;
  correct: string;
}

export function QuizRunner({
  quiz,
  onDone,
}: {
  quiz: Quiz;
  onDone: (scorePct: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const q = quiz.questions[idx];
  const total = quiz.questions.length;

  const scorePct = useMemo(
    () =>
      answers.length
        ? Math.round(
            (answers.filter((a) => a.isCorrect).length / answers.length) * 1000,
          ) / 10
        : 0,
    [answers],
  );

  async function next() {
    const isCorrect = picked === q.answer;
    const log: AnswerLog = {
      wordId: q.wordId,
      isCorrect,
      chosen: picked ?? "",
      correct: q.answer,
    };
    const nextAnswers = [...answers, log];
    setAnswers(nextAnswers);
    setPicked(null);

    if (idx + 1 < total) {
      setIdx(idx + 1);
      return;
    }
    const res = await api
      .post<{ scorePct: number }>("/quiz/submit", {
        attemptId: quiz.attemptId,
        answers: nextAnswers,
      })
      .catch(() => ({ scorePct }));
    onDone(res.scorePct);
  }

  return (
    <Card className="space-y-5">
      <div className="flex justify-between text-sm text-muted">
        <span>
          Câu {idx + 1}/{total}
        </span>
        <span>Chọn nghĩa đúng</span>
      </div>
      <div className="text-center">
        <div className="hanzi text-4xl font-semibold">{q.prompt}</div>
        <div className="text-muted">{q.pinyin}</div>
      </div>
      <div className="space-y-2">
        {q.options.map((opt) => {
          const isPicked = picked === opt;
          return (
            <button
              key={opt}
              onClick={() => setPicked(opt)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isPicked
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-surface-2"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <Button className="w-full" disabled={!picked} onClick={() => void next()}>
        {idx + 1 < total ? "Câu tiếp" : "Nộp bài"}
      </Button>
    </Card>
  );
}
