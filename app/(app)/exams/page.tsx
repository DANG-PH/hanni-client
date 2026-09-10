"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ExamResultView,
  saveExamResult,
  type ExamResult,
} from "@/components/exam-result";
import { Icon } from "@/components/icon";
import { QuizRunner, type QuizSubmission } from "@/components/quiz-runner";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useLevels, useWords } from "@/lib/hooks";
import type { Quiz } from "@/lib/types";

export default function ExamsPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const levels = useLevels();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const level = selectedLevel ?? levels.data?.[0]?.level;
  const words = useWords({ level });
  const [size, setSize] = useState(10);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationLock = useRef(false);

  async function startQuiz() {
    if (!level || !words.data?.items.length || generationLock.current) return;
    generationLock.current = true;
    setBusy(true);
    setError(null);
    try {
      const generated = await api.post<Quiz>("/quiz/generate", {
        wordIds: words.data.items.map((word) => word.id),
        size,
      });
      if (!generated.questions?.length) {
        setError(
          "Chưa đủ từ vựng phù hợp để tạo câu hỏi. Hãy chọn một cấp độ khác.",
        );
        return;
      }
      setQuiz(generated);
    } catch {
      setError(
        "Chưa tạo được bài kiểm tra. Vui lòng thử lại hoặc chọn cấp độ khác.",
      );
    } finally {
      setBusy(false);
      generationLock.current = false;
    }
  }

  function complete(_scorePct: number, submission: QuizSubmission) {
    if (!quiz || !level || !user) return;
    const completed: ExamResult = {
      ...submission,
      level,
      finishedAt: new Date().toISOString(),
      words: quiz.questions.map((question) => ({
        id: question.wordId,
        prompt: question.prompt,
        pinyin: question.pinyin,
      })),
    };
    setResult(completed);
    if (saveExamResult(user.id, completed))
      router.push(
        `/exams/results?attempt=${encodeURIComponent(completed.attemptId)}`,
      );
  }

  if (loading || !user) return <Spinner />;
  if (result)
    return (
      <div className="page-wrap max-w-3xl!">
        <ExamResultView
          result={result}
          onRestart={() => {
            setResult(null);
            setQuiz(null);
          }}
        />
      </div>
    );
  if (quiz)
    return (
      <div className="page-wrap max-w-3xl! space-y-6">
        <PageHeading
          eyebrow={`KIỂM TRA TỪ VỰNG · HSK ${level === 7 ? "7–9" : level}`}
          title="Bình tĩnh, bạn làm được mà"
          description="Đọc từ, chọn nghĩa phù hợp rồi chuyển sang câu tiếp theo. Bài kiểm tra không giới hạn thời gian."
        />
        <QuizRunner key={quiz.attemptId} quiz={quiz} onDone={complete} />
      </div>
    );

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="GÓC KIỂM TRA"
        title="Bạn đã nhớ được bao nhiêu?"
        description="Thử sức với câu hỏi từ vựng theo cấp độ HSK. Mỗi bài kiểm tra là một cơ hội nhìn lại và học tốt hơn."
      >
        <LinkButton href="/exams/results" variant="secondary">
          <Icon name="chart" size={17} /> Kết quả gần nhất
        </LinkButton>
      </PageHeading>
      <div className="reveal relative overflow-hidden rounded-3xl bg-[#19212e] p-6 text-white sm:p-8">
        <span
          lang="zh"
          aria-hidden="true"
          className="hanzi pointer-events-none absolute -right-3 -top-8 rotate-12 text-[180px] leading-none text-white/5"
        >
          试
        </span>
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75">
            <Icon name="target" size={13} /> HIỂU VỐN TỪ CỦA BẠN
          </span>
          <h2 className="mt-4 text-xl font-semibold sm:text-2xl">
            Một bài kiểm tra nhỏ.
            <br />
            <span className="text-[#ff9b89]">
              Thêm tự tin trên hành trình HSK.
            </span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
            Luyện nhận diện Hán tự và chọn nghĩa đúng từ thư viện đang học. Đây
            là bài kiểm tra từ vựng, không phải đề thi HSK đầy đủ.
          </p>
        </div>
      </div>
      {levels.error ? (
        <Card className="space-y-4">
          <ErrorNote>Chưa tải được các cấp độ kiểm tra.</ErrorNote>
          <Button variant="secondary" onClick={() => void levels.mutate()}>
            Thử lại
          </Button>
        </Card>
      ) : levels.isLoading ? (
        <Spinner />
      ) : !levels.data?.length ? (
        <EmptyState
          title="Chưa có cấp độ kiểm tra"
          description="Nội dung kiểm tra đang được chuẩn bị. Bạn có thể tiếp tục ôn từ vựng trong lúc chờ."
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
          <Card className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                Chọn bài kiểm tra của bạn
              </h2>
              <p className="mt-1 text-sm text-muted">
                Bắt đầu ở cấp độ bạn đang học.
              </p>
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Cấp độ HSK</legend>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {levels.data.map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    disabled={busy}
                    aria-pressed={level === item.level}
                    onClick={() => {
                      setSelectedLevel(item.level);
                      setError(null);
                    }}
                    className={`motion-button rounded-xl border p-4 text-left transition-colors disabled:opacity-50 ${level === item.level ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-surface-2"}`}
                  >
                    <span
                      className={`block text-sm font-semibold ${level === item.level ? "text-primary" : ""}`}
                    >
                      HSK {item.level === 7 ? "7–9" : item.level}
                    </span>
                    <span className="mt-2 block text-[11px] text-muted">
                      {item.wordsInDb.toLocaleString("vi-VN")} từ
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Số câu hỏi</legend>
              <div className="flex flex-wrap gap-2">
                {[5, 10].map((count) => (
                  <button
                    key={count}
                    disabled={busy}
                    type="button"
                    aria-pressed={size === count}
                    onClick={() => setSize(count)}
                    className={`motion-button min-h-11 rounded-xl border px-5 py-2 text-sm font-medium ${size === count ? "border-primary bg-primary/5 text-primary" : "border-border text-muted hover:bg-surface-2"}`}
                  >
                    {count} câu
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Số câu thực tế tùy thuộc số từ phù hợp trong cấp độ đã chọn.
              </p>
            </fieldset>
            {words.error ? (
              <div className="space-y-3">
                <ErrorNote>Chưa tải được từ vựng của cấp độ này.</ErrorNote>
                <Button variant="secondary" onClick={() => void words.mutate()}>
                  Tải lại từ vựng
                </Button>
              </div>
            ) : !words.isLoading && !words.data?.items.length ? (
              <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
                Cấp độ này chưa có từ vựng để tạo bài kiểm tra. Hãy chọn cấp độ
                khác.
              </p>
            ) : null}
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <span className="flex items-center gap-2 text-xs text-muted">
                <Icon name="clock" size={16} /> Học theo nhịp độ của bạn
              </span>
              <Button
                disabled={
                  busy ||
                  words.isLoading ||
                  !!words.error ||
                  !words.data?.items.length
                }
                onClick={() => void startQuiz()}
              >
                {busy
                  ? "Đang chuẩn bị câu hỏi…"
                  : words.isLoading
                    ? "Đang tải từ vựng…"
                    : "Bắt đầu kiểm tra"}
                <Icon name="arrow" size={16} />
              </Button>
            </div>
          </Card>
          <aside className="space-y-5">
            <Card>
              <span className="icon-tile mb-4">
                <Icon name="spark" size={21} />
              </span>
              <h2 className="font-semibold">Trước khi bắt đầu</h2>
              <ol className="mt-4 space-y-4">
                {[
                  "Chọn cấp độ và số câu phù hợp.",
                  "Đọc Hán tự, dùng pinyin để gợi nhớ.",
                  "Chọn một đáp án cho mỗi câu.",
                  "Nộp bài và xem lại những từ cần ôn.",
                ].map((text, index) => (
                  <li
                    key={text}
                    className="flex gap-3 text-sm leading-6 text-muted"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
                      {index + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </Card>
            <div className="rounded-2xl border border-primary/15 bg-primary/4 p-5">
              <p className="text-sm font-semibold">Muốn ôn lại trước?</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Dành vài phút với flashcard để làm nóng trí nhớ.
              </p>
              <LinkButton
                href="/study"
                variant="ghost"
                className="mt-3 -ml-4 text-primary!"
              >
                <Icon name="cards" size={16} /> Đến góc ôn tập
              </LinkButton>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
