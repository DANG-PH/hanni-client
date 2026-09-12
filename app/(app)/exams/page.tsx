"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  ExamResultView,
  saveExamResult,
  type ExamResult,
} from "@/components/exam-result";
import { LearningHeader, LearningTip } from "@/components/learning-library";
import styles from "@/components/learning-library.module.css";
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
import { useExamHistory, useLevels, useWords } from "@/lib/hooks";
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
  const startedAt = useRef(0);
  const history = useExamHistory();

  async function startQuiz() {
    if (!level || !words.data?.items.length || generationLock.current) return;
    generationLock.current = true;
    startedAt.current = Date.now();
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

    // Lưu kết quả lên server để có lịch sử (chạy nền, không chặn điều hướng).
    const correctCount = submission.answers.filter((a) => a.isCorrect).length;
    void api
      .post("/exams/attempts", {
        hskLevel: level,
        totalCount: submission.totalQuestions,
        correctCount,
        durationSec: startedAt.current
          ? Math.round((Date.now() - startedAt.current) / 1000)
          : undefined,
      })
      .then(() => history.mutate())
      .catch(() => undefined);

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
          description="Phần nghe trước, phần đọc sau — giống thứ tự đề thi HSK thật. Mỗi câu có thời gian giới hạn, hết giờ sẽ tự chuyển sang câu tiếp theo."
        />
        <QuizRunner
          key={quiz.attemptId}
          quiz={quiz}
          level={level}
          timed
          onDone={complete}
        />
      </div>
    );

  return (
    <div className={`page-wrap ${styles.page}`}>
      <LearningHeader
        section="exams"
        eyebrow="Nhìn lại điều đã học"
        title="Kiểm tra HSK"
        description="Một bài kiểm tra nghe và đọc ngắn để biết bạn đã nhớ gì, cần ôn thêm gì."
      >
        <LinkButton href="/exams/results" variant="secondary">
          <Icon name="chart" size={16} /> Kết quả gần nhất
        </LinkButton>
      </LearningHeader>
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
        <div className={styles.contentColumns}>
          <section
            className={styles.examForm}
            aria-label="Thiết lập bài kiểm tra"
          >
            <div className={styles.formHeading}>
              <span>
                <Icon name="target" size={22} />
              </span>
              <div>
                <h2>Bài kiểm tra của bạn</h2>
                <p>Chọn cấp độ, số câu hỏi rồi bắt đầu.</p>
              </div>
            </div>
            <div className={styles.examIntro}>
              <span>
                <Icon name="headphones" size={16} /> Nghe & nhận diện từ
              </span>
              <span>
                <Icon name="book" size={16} /> Đọc & chọn nghĩa
              </span>
              <span>
                <Icon name="clock" size={16} /> Giới hạn giờ mỗi câu
              </span>
              <span>
                <Icon name="info" size={16} /> Bài ôn từ vựng, không phải đề HSK
                đầy đủ
              </span>
            </div>
            <fieldset>
              <legend className={styles.legend}>
                <span>1</span> Chọn cấp độ HSK
              </legend>
              <div className={styles.examLevels}>
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
                    className={styles.examLevel}
                  >
                    <span className={styles.selectionMark}>
                      {level === item.level && <Icon name="check" size={10} />}
                    </span>
                    <strong>HSK {item.level === 7 ? "7–9" : item.level}</strong>
                    <small>
                      {item.wordsInDb.toLocaleString("vi-VN")} từ vựng
                    </small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={styles.legend}>
                <span>2</span> Chọn số câu hỏi
              </legend>
              <div className={styles.questionOptions}>
                {[5, 10].map((count) => (
                  <button
                    key={count}
                    disabled={busy}
                    type="button"
                    aria-pressed={size === count}
                    onClick={() => setSize(count)}
                    className="disabled:opacity-50"
                  >
                    <Icon name={count === 5 ? "spark" : "target"} size={19} />
                    <span>
                      <strong>{count} câu hỏi</strong>
                      <small>
                        {count === 5
                          ? "Khởi động nhẹ nhàng"
                          : "Thử sức nhiều hơn"}
                      </small>
                    </span>
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
            <div className={styles.examFooter}>
              <p aria-live="polite">
                {level ? `HSK ${level === 7 ? "7–9" : level}` : "Chọn cấp độ"} ·
                Tối đa {size} câu
                <small>Nghe trước, đọc sau. Cứ bình tĩnh nhé!</small>
              </p>
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
          </section>
          <aside className={styles.aside}>
            {history.data && history.data.summary.count > 0 && (
              <div className={styles.sideCard}>
                <h2 className="mb-4 flex items-center gap-2 font-semibold">
                  <Icon name="chart" size={18} className="text-primary" />
                  Lịch sử kiểm tra
                </h2>
                <div className={styles.historyStats}>
                  <div>
                    <strong>{history.data.summary.count}</strong>
                    <span>lượt làm bài</span>
                  </div>
                  <div>
                    <strong>{history.data.summary.avgAccuracy ?? "–"}%</strong>
                    <span>đúng trung bình</span>
                  </div>
                </div>
                <ul className="divide-y divide-border text-sm">
                  {history.data.attempts.slice(0, 5).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <span className="text-muted">
                        HSK {a.hskLevel} ·{" "}
                        {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="font-semibold">
                        {a.correctCount}/{a.totalCount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.sideCard}>
              <span className="icon-tile mb-4">
                <Icon name="spark" size={21} />
              </span>
              <h2 className="font-semibold">Trước khi bắt đầu</h2>
              <ol className={styles.steps}>
                {[
                  "Chọn cấp độ và số câu phù hợp.",
                  "Phần nghe: nghe âm thanh rồi chọn nghĩa, chưa thấy chữ.",
                  "Phần đọc: đọc Hán tự, dùng pinyin để gợi nhớ.",
                  "Mỗi câu có thời gian giới hạn — hết giờ sẽ tự chuyển câu.",
                  "Nộp bài và xem lại những từ cần ôn.",
                ].map((text, index) => (
                  <li key={text} className="flex gap-3">
                    <span className={styles.stepNumber}>{index + 1}</span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>
            <LearningTip title="Làm nóng trí nhớ trước khi bắt đầu">
              Dành vài phút ôn lại flashcard để tự tin hơn với những từ đã học.
              <LinkButton
                href="/study"
                variant="ghost"
                className="mt-2 -ml-4 text-primary!"
              >
                <Icon name="cards" size={16} /> Đến góc ôn tập
              </LinkButton>
            </LearningTip>
          </aside>
        </div>
      )}
    </div>
  );
}
