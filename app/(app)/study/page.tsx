"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Flashcard } from "@/components/flashcard";
import { QuizRunner } from "@/components/quiz-runner";
import {
  Button,
  ErrorNote,
  LinkButton,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath, useLesson } from "@/lib/hooks";
import type { Quiz, Rating, StudyQueue } from "@/lib/types";
import styles from "./study.module.css";

type Phase = "loading" | "intro" | "review" | "review-done" | "quiz" | "done";
interface Item {
  word: StudyQueue["due"][number]["word"];
  isNew: boolean;
}

function StudyInner({ lessonId }: { lessonId: string | null }) {
  const { user, loading } = useRequireAuth();
  const lesson = useLesson(lessonId);
  const path = useLearnPath(lesson.data?.lesson.hskLevel);

  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<Item[]>([]);
  const [pos, setPos] = useState(0);
  const [correct, setCorrect] = useState(0);
  const sessionId = useRef<string | null>(null);
  const reviewedIds = useRef<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const started = useRef(false);
  const ratingLock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || started.current) return;
    started.current = true;
    void (async () => {
      const session = await api
        .post<{ id: string }>("/study/session", {
          source: lessonId ? "LEARN" : "REVIEW",
        })
        .catch(() => null);
      sessionId.current = session?.id ?? null;

      const q = lessonId
        ? `/study/queue?limit=40&lessonId=${lessonId}`
        : "/study/queue?limit=40";
      const queue = await api.get<StudyQueue>(q);
      const list: Item[] = [
        ...queue.due.map((d) => ({ word: d.word, isNew: false })),
        ...queue.newCards.map((n) => ({ word: n.word, isNew: true })),
      ];
      setItems(list);
      setPhase(list.length ? "intro" : "review-done");
    })().catch(() => setError("Chưa tải được buổi học. Vui lòng thử lại."));
  }, [loading, user, lessonId]);

  const onRate = useCallback(
    async (rating: Rating, durationMs: number) => {
      const item = items[pos];
      if (!item || ratingLock.current) return;
      ratingLock.current = true;
      setBusy(true);
      setError(null);
      try {
        const res = await api.post<{ isCorrect: boolean }>("/study/review", {
          wordId: item.word.id,
          rating,
          durationMs,
          studySessionId: sessionId.current ?? undefined,
        });
        reviewedIds.current.add(item.word.id);
        if (res.isCorrect) setCorrect((c) => c + 1);
      } catch {
        setError("Chưa lưu được kết quả. Hãy thử đánh giá lại thẻ này.");
        ratingLock.current = false;
        setBusy(false);
        return;
      }
      if (pos + 1 < items.length) {
        setPos(pos + 1);
      } else {
        if (sessionId.current) {
          await api
            .post(`/study/session/${sessionId.current}/end`)
            .catch(() => undefined);
        }
        setPhase("review-done");
      }
      ratingLock.current = false;
      setBusy(false);
    },
    [items, pos],
  );

  async function startQuiz() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const ids = [...reviewedIds.current];
    try {
      const q = await api.post<Quiz>("/quiz/generate", {
        wordIds: ids.length ? ids : undefined,
        size: Math.min(10, Math.max(4, ids.length)),
      });
      setQuiz(q);
      setPhase("quiz");
    } catch {
      setError("Chưa tạo được bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <Spinner />;
  if (phase === "loading")
    return error ? (
      <div className="page-wrap max-w-xl! space-y-4">
        <ErrorNote>{error}</ErrorNote>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    ) : (
      <Spinner />
    );

  const title = lesson.data?.lesson.title ?? "Ôn tập flashcard";
  const newCount = items.filter((item) => item.isNew).length;
  const previewWord = items[0]?.word;
  const nextLesson =
    lessonId &&
    lesson.data &&
    path.data &&
    !path.error &&
    path.data.level === lesson.data.lesson.hskLevel
      ? path.data.lessons.find(
          (l) =>
            l.orderIndex === lesson.data!.lesson.orderIndex + 1 &&
            l.status !== "LOCKED",
        )
      : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.navigation}>
        <LinkButton href={lessonId ? "/learn" : "/dashboard"} variant="ghost">
          <Icon name="back" size={17} />
          {lessonId ? "Lộ trình" : "Tổng quan"}
        </LinkButton>
        <span className={styles.location}>
          <Icon name={lessonId ? "route" : "cards"} size={18} />
          {lessonId ? title : "Góc ôn tập"}
        </span>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {phase === "intro" && (
        <div className={styles.phase}>
          <section className={styles.intro} aria-labelledby="study-title">
            <div className={styles.introCopy}>
              <p className={styles.eyebrow}>
                <span className={styles.statusDot} /> Một chút mỗi ngày
              </p>
              <h1 id="study-title">{title}</h1>
              <p className={styles.description}>
                Lật một tấm thẻ, nhớ thêm một từ. Cùng dành vài phút cho những
                điều bạn đã học nhé.
              </p>
              <div className={styles.sessionStats}>
                <div>
                  <span className={styles.statIcon}>
                    <Icon name="refresh" size={18} />
                  </span>
                  <span>
                    <strong>{items.length - newCount}</strong> thẻ ôn lại
                  </span>
                </div>
                <div>
                  <span className={styles.statIcon}>
                    <Icon name="spark" size={18} />
                  </span>
                  <span>
                    <strong>{newCount}</strong> từ mới
                  </span>
                </div>
              </div>
              <Button
                className={styles.startButton}
                onClick={() => setPhase("review")}
              >
                Bắt đầu ôn tập <Icon name="arrow" size={18} />
              </Button>
              <p className={styles.sessionNote}>
                {items.length} thẻ sẵn sàng · Học theo nhịp của bạn
              </p>
            </div>
            <div className={styles.deckScene} aria-hidden="true">
              <div className={styles.deckOrbit} />
              <div className={styles.deckBack} />
              <div className={styles.deckMiddle} />
              <div className={styles.deckFront}>
                <span className={styles.deckLabel}>
                  THẺ GHI NHỚ <Icon name="cards" size={17} />
                </span>
                <div className={styles.deckCharacter} lang="zh">
                  {previewWord?.simplified ?? "学"}
                </div>
                <p className={styles.deckPinyin}>
                  {previewWord?.pinyin ?? "xué"}
                </p>
                <span className={styles.deckDivider} />
                <span className={styles.deckHint}>
                  <Icon name="refresh" size={13} /> Lật thẻ để khám phá
                </span>
              </div>
              <span className={styles.deckBadge}>
                <Icon name="spark" size={16} /> Từng từ, từng bước
              </span>
              <span className={styles.deckSpark}>
                <Icon name="spark" size={25} />
              </span>
            </div>
          </section>

          <div className={styles.guideHeading}>
            <h2>Một vòng ôn, ba bước nhỏ</h2>
            <span>Không cần vội. Cứ thử nhớ trước.</span>
          </div>
          <ol className={styles.steps}>
            {[
              {
                title: "Nhìn và nhớ",
                text: "Nhìn Hán tự, thử nghĩ đến nghĩa trước khi mở đáp án.",
                icon: "eye" as const,
              },
              {
                title: "Lật và khám phá",
                text: "Chạm vào thẻ hoặc nhấn phím cách để xem nghĩa và ví dụ.",
                icon: "cards" as const,
              },
              {
                title: "Chọn mức độ nhớ",
                text: "Chọn mức 1–4. Hanni sẽ hẹn bạn ôn lại vào lúc phù hợp.",
                icon: "target" as const,
              },
            ].map((step, i) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepIcon}>
                  <Icon name={step.icon} size={21} />
                </span>
                <span className={styles.stepNumber}>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === "review" && items[pos] && (
        <div className={`${styles.reviewLayout} ${styles.phase}`}>
          <div className={styles.reviewMain}>
            <div className={styles.reviewHeading}>
              <div>
                <p className={styles.eyebrow}>Góc tập trung</p>
                <h1>{title}</h1>
              </div>
              <span className={styles.counter} aria-live="polite">
                <strong>{pos + 1}</strong> / {items.length}
              </span>
            </div>
            <Flashcard
              key={items[pos].word.id}
              word={items[pos].word}
              isNew={items[pos].isNew}
              busy={busy}
              onRate={(r, d) => void onRate(r, d)}
            />
          </div>
          <aside
            className={styles.reviewAside}
            aria-label="Tiến độ và gợi ý ôn tập"
          >
            <div className={styles.progressCard}>
              <span className={styles.asideIcon}>
                <Icon name="route" size={21} />
              </span>
              <h2>Nhịp học hôm nay</h2>
              <p>
                <strong>{pos}</strong> / {items.length} thẻ đã ôn
              </p>
              <ProgressBar
                value={(pos / items.length) * 100}
                label="Tiến độ buổi học"
              />
              <div className={styles.progressDetail}>
                <span>
                  <span className={styles.statusDot} /> Đã nhớ
                </span>
                <strong>{correct} thẻ</strong>
              </div>
            </div>
            <div className={styles.studyTip}>
              <Icon name="spark" size={19} />
              <h2>Cứ thử nhớ trước</h2>
              <p>
                Một chút nỗ lực tự nhớ giúp từ vựng ở lại lâu hơn. Chưa nhớ cũng
                không sao, mình sẽ gặp lại từ này.
              </p>
            </div>
            <div className={styles.shortcuts}>
              <span>
                <kbd>Space</kbd> Lật thẻ
              </span>
              <span>
                <kbd>1</kbd> – <kbd>4</kbd> Chọn mức nhớ
              </span>
            </div>
          </aside>
        </div>
      )}

      {phase === "review-done" && (
        <section
          className={`${styles.finish} ${styles.phase}`}
          aria-labelledby="review-result-title"
        >
          <span className={styles.finishIcon}>
            <Icon name={items.length ? "check" : "cards"} size={32} />
          </span>
          <p className={styles.eyebrow}>
            {items.length ? "Thêm một bước tiến" : "Sẵn sàng cho điều mới"}
          </p>
          <h1 id="review-result-title">
            {items.length
              ? lessonId
                ? "Xong bài!"
                : "Bạn đã hoàn thành buổi ôn!"
              : "Chưa có thẻ để học"}
          </h1>
          <p className={styles.finishDescription}>
            {items.length > 0
              ? `Bạn nhớ được ${correct}/${items.length} thẻ. Mỗi lần ôn là một lần nhớ lâu hơn.`
              : "Hiện chưa có thẻ. Bạn có thể mở bài khác trong lộ trình hoặc quay lại sau."}
          </p>
          {items.length > 0 && (
            <div className={styles.results}>
              <div>
                <strong>{items.length}</strong>
                <span>thẻ đã ôn</span>
              </div>
              <div>
                <strong>{correct}</strong>
                <span>thẻ đã nhớ</span>
              </div>
              <div>
                <strong>{Math.round((correct / items.length) * 100)}%</strong>
                <span>tỉ lệ ghi nhớ</span>
              </div>
            </div>
          )}
          <div className={styles.finishActions}>
            {items.length >= 4 && (
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => void startQuiz()}
              >
                {busy ? "Đang tạo…" : "Kiểm tra nhanh những từ vừa học"}
              </Button>
            )}
            {nextLesson && (
              <LinkButton
                href={`/study?lesson=${nextLesson.id}`}
                variant="secondary"
                className="w-full"
              >
                {nextLesson.title} <Icon name="arrow" size={16} />
              </LinkButton>
            )}
            <LinkButton
              href={lessonId ? "/learn" : "/dashboard"}
              variant="ghost"
              className="w-full"
            >
              {lessonId ? "Về lộ trình" : "Về tổng quan"}
            </LinkButton>
            {items.length === 0 && !lessonId && (
              <LinkButton href="/learn">
                Khám phá lộ trình <Icon name="arrow" size={16} />
              </LinkButton>
            )}
          </div>
        </section>
      )}

      {phase === "quiz" && quiz && (
        <div className={`${styles.quiz} ${styles.phase}`}>
          <QuizRunner
            quiz={quiz}
            onDone={(s) => {
              setQuizScore(s);
              setPhase("done");
            }}
          />
        </div>
      )}

      {phase === "done" && (
        <section
          className={`${styles.finish} ${styles.phase}`}
          aria-labelledby="quiz-result-title"
        >
          <span className={styles.finishIcon}>
            <Icon name="trophy" size={32} />
          </span>
          <p className={styles.eyebrow}>Buổi học đã hoàn thành</p>
          <h1 id="quiz-result-title">Một ngày học thật tốt!</h1>
          {quizScore != null && (
            <p className={styles.quizScore}>{quizScore}%</p>
          )}
          <p className={styles.finishDescription}>
            Điểm ghi nhớ của buổi này. Hẹn gặp lại bạn trong lần ôn tiếp theo!
          </p>
          <div className={styles.finishActions}>
            {nextLesson ? (
              <LinkButton
                href={`/study?lesson=${nextLesson.id}`}
                className="w-full"
              >
                {nextLesson.title} <Icon name="arrow" size={16} />
              </LinkButton>
            ) : (
              <LinkButton
                href={lessonId ? "/learn" : "/dashboard"}
                className="w-full"
              >
                {lessonId ? "Về lộ trình" : "Về tổng quan"}
              </LinkButton>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StudySession() {
  const lessonId = useSearchParams().get("lesson");
  return <StudyInner key={lessonId ?? "review"} lessonId={lessonId} />;
}

export default function StudyPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <StudySession />
    </Suspense>
  );
}
