"use client";

import { Icon } from "@/components/icon";
import { Button, Card, LinkButton, ProgressBar } from "@/components/ui";
import type { QuizSubmission } from "@/components/quiz-runner";

export interface ExamResult extends QuizSubmission {
  level: number;
  finishedAt: string;
  words: { id: string; prompt: string; pinyin: string }[];
}

export function examResultKey(userId: string, attemptId?: string | null) {
  return `hanni:quiz:${userId}:${attemptId ?? "latest"}`;
}

export function saveExamResult(userId: string, result: ExamResult): boolean {
  try {
    const serialized = JSON.stringify(result);
    sessionStorage.setItem(examResultKey(userId, result.attemptId), serialized);
    sessionStorage.setItem(examResultKey(userId), serialized);
    return true;
  } catch {
    return false;
  }
}

export function parseExamResult(value: string | null): ExamResult | null {
  if (!value) return null;
  try {
    const result = JSON.parse(value) as ExamResult;
    if (
      !result ||
      typeof result.attemptId !== "string" ||
      !Number.isFinite(result.scorePct) ||
      result.scorePct < 0 ||
      result.scorePct > 100 ||
      !Number.isInteger(result.level) ||
      result.level < 1 ||
      result.level > 9 ||
      !Number.isInteger(result.totalQuestions) ||
      result.totalQuestions < 1 ||
      !Array.isArray(result.answers) ||
      !Array.isArray(result.words) ||
      !Number.isFinite(Date.parse(result.finishedAt))
    )
      return null;
    if (
      !result.answers.every(
        (answer) =>
          answer &&
          typeof answer.wordId === "string" &&
          typeof answer.isCorrect === "boolean" &&
          typeof answer.chosen === "string" &&
          typeof answer.correct === "string",
      )
    )
      return null;
    if (
      !result.words.every(
        (word) =>
          word &&
          typeof word.id === "string" &&
          typeof word.prompt === "string" &&
          typeof word.pinyin === "string",
      )
    )
      return null;
    if (
      result.answers.length !== result.totalQuestions ||
      result.words.length !== result.totalQuestions ||
      new Set(result.words.map((word) => word.id)).size !==
        result.totalQuestions ||
      !result.answers.every((answer) =>
        result.words.some((word) => word.id === answer.wordId),
      )
    )
      return null;
    return result;
  } catch {
    return null;
  }
}

export function ExamResultView({
  result,
  onRestart,
}: {
  result: ExamResult;
  onRestart?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden text-center">
        <span className="icon-tile mx-auto mb-5 h-16! w-16! rounded-full!">
          <Icon name="trophy" size={30} />
        </span>
        <p className="eyebrow">BÀI LÀM ĐÃ ĐƯỢC LƯU</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Thêm một bước tiến rồi!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Bạn đã hoàn thành bài kiểm tra từ vựng HSK{" "}
          {result.level === 7 ? "7–9" : result.level}. Cùng nhìn lại những từ
          cần luyện thêm.
        </p>
        <p className="my-6 text-6xl font-semibold tracking-tight text-primary">
          {result.scorePct}
          <span className="ml-1 text-2xl">%</span>
        </p>
        <div className="mx-auto max-w-xs">
          <ProgressBar
            value={result.scorePct}
            label="Kết quả kiểm tra từ vựng"
          />
        </div>
        <p className="mt-4 text-sm text-muted">
          {result.totalQuestions} câu hỏi{" "}
          <span className="px-2 text-border">·</span>{" "}
          {new Date(result.finishedAt).toLocaleDateString("vi-VN")}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onRestart ? (
            <Button onClick={onRestart}>
              <Icon name="refresh" size={16} /> Làm bài khác
            </Button>
          ) : (
            <LinkButton href="/exams">
              <Icon name="refresh" size={16} /> Làm bài khác
            </LinkButton>
          )}
          <LinkButton href="/study" variant="secondary">
            <Icon name="cards" size={16} /> Ôn lại từ vựng
          </LinkButton>
        </div>
        <p className="mt-5 text-xs text-muted">
          Điểm đánh giá từ vựng, không quy đổi thành điểm thi chứng chỉ HSK.
        </p>
      </Card>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Xem lại bài làm</h2>
          <span className="text-xs text-muted">
            {result.answers.length} câu đã trả lời
          </span>
        </div>
        {result.answers.map((answer, index) => {
          const word = result.words.find((item) => item.id === answer.wordId);
          return (
            <article
              key={`${answer.wordId}-${index}`}
              className="reveal panel flex gap-4 p-5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${answer.isCorrect ? "bg-good/10 text-good" : "bg-danger/8 text-danger"}`}
              >
                <Icon name={answer.isCorrect ? "check" : "close"} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">Câu {index + 1}</p>
                {word && (
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 lang="zh" className="hanzi text-2xl">
                      {word.prompt}
                    </h3>
                    <span className="text-sm text-primary">{word.pinyin}</span>
                  </div>
                )}
                <p
                  className={`mt-3 text-sm leading-6 ${answer.isCorrect ? "text-muted" : "text-danger"}`}
                >
                  Bạn chọn: <span className="font-medium">{answer.chosen}</span>
                </p>
                {!answer.isCorrect && (
                  <p className="mt-1 text-sm leading-6 text-good">
                    Đáp án:{" "}
                    <span className="font-medium">{answer.correct}</span>
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
