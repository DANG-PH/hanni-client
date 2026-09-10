"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flashcard } from "@/components/flashcard";
import { QuizRunner } from "@/components/quiz-runner";
import {
  Button,
  Card,
  ErrorNote,
  LinkButton,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { Quiz, Rating, StudyQueue } from "@/lib/types";

type Phase = "loading" | "review" | "review-done" | "quiz" | "done";

interface Item {
  word: StudyQueue["due"][number]["word"];
  isNew: boolean;
}

export default function StudyPage() {
  const { user, loading } = useRequireAuth();
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
        .post<{ id: string }>("/study/session", { source: "REVIEW" })
        .catch(() => null);
      sessionId.current = session?.id ?? null;

      const queue = await api.get<StudyQueue>("/study/queue?limit=40");
      const list: Item[] = [
        ...queue.due.map((d) => ({ word: d.word, isNew: false })),
        ...queue.newCards.map((n) => ({ word: n.word, isNew: true })),
      ];
      setItems(list);
      setPhase(list.length ? "review" : "review-done");
    })().catch(() => setError("Chưa tải được buổi học. Vui lòng thử lại."));
  }, [loading, user]);

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
        setError("Chưa lưu được kết quả. Bạn hãy thử đánh giá lại thẻ này.");
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

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
      <div className="mb-7 flex items-center justify-between">
        <LinkButton href="/dashboard" variant="ghost">
          <Icon name="back" size={17} />
          Tổng quan
        </LinkButton>
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon name="cards" size={18} />
          Góc ôn tập
        </span>
      </div>
      {error && (
        <div className="mb-5">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {phase === "review" && items[pos] && (
        <>
          <div className="mb-6">
            <div className="mb-3 flex justify-between text-sm">
              <h1 className="font-semibold">Ôn tập flashcard</h1>
              <span className="text-muted">
                Thẻ {pos + 1} / {items.length}
              </span>
            </div>
            <ProgressBar
              value={(pos / items.length) * 100}
              label="Tiến độ buổi ôn"
            />
          </div>
          <Flashcard
            key={items[pos].word.id}
            word={items[pos].word}
            isNew={items[pos].isNew}
            busy={busy}
            onRate={(r, d) => void onRate(r, d)}
          />
        </>
      )}

      {phase === "review-done" && (
        <Card className="space-y-4 text-center">
          <span className="icon-tile mx-auto h-16! w-16! rounded-full! bg-good/10! text-good!">
            <Icon name="check" size={30} />
          </span>
          <h1 className="text-2xl font-semibold">
            {items.length ? "Bạn đã hoàn thành buổi ôn!" : "Chưa có thẻ để ôn"}
          </h1>
          <p className="text-muted">
            {items.length > 0
              ? `Bạn nhớ được ${correct}/${items.length} thẻ. Mỗi lần ôn là một lần nhớ lâu hơn.`
              : "Hiện chưa có thẻ để học. Bạn có thể khám phá thư viện từ vựng hoặc quay lại sau."}
          </p>
          {items.length >= 4 ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void startQuiz()}
            >
              {busy
                ? "Đang tạo bài kiểm tra…"
                : "Kiểm tra nhanh những từ vừa học"}
            </Button>
          ) : null}
          <LinkButton href="/dashboard" variant="secondary" className="w-full">
            Về tổng quan
          </LinkButton>
        </Card>
      )}

      {phase === "quiz" && quiz && (
        <QuizRunner
          quiz={quiz}
          onDone={(s) => {
            setQuizScore(s);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && (
        <Card className="space-y-4 text-center">
          <h1 className="text-xl font-bold">Hoàn thành</h1>
          {quizScore != null && (
            <p className="text-3xl font-semibold text-primary">{quizScore}%</p>
          )}
          <p className="text-muted">
            Điểm ghi nhớ của buổi này. Hẹn bạn ở buổi học tiếp theo!
          </p>
          <LinkButton href="/dashboard" className="w-full">
            Về tổng quan
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
