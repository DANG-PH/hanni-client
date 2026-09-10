"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flashcard } from "@/components/flashcard";
import { QuizRunner } from "@/components/quiz-runner";
import { Button, Card, LinkButton, Spinner } from "@/components/ui";
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
    })();
  }, [loading, user]);

  const onRate = useCallback(
    async (rating: Rating, durationMs: number) => {
      const item = items[pos];
      if (!item) return;
      reviewedIds.current.add(item.word.id);
      try {
        const res = await api.post<{ isCorrect: boolean }>("/study/review", {
          wordId: item.word.id,
          rating,
          durationMs,
          studySessionId: sessionId.current ?? undefined,
        });
        if (res.isCorrect) setCorrect((c) => c + 1);
      } catch {
        /* bỏ qua lỗi 1 thẻ, đi tiếp */
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
    },
    [items, pos],
  );

  async function startQuiz() {
    const ids = [...reviewedIds.current];
    try {
      const q = await api.post<Quiz>("/quiz/generate", {
        wordIds: ids.length ? ids : undefined,
        size: Math.min(10, Math.max(4, ids.length)),
      });
      setQuiz(q);
      setPhase("quiz");
    } catch {
      setPhase("done");
    }
  }

  if (loading || !user || phase === "loading") return <Spinner />;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {phase === "review" && items[pos] && (
        <>
          <div className="mb-4 text-sm text-muted">
            {pos + 1} / {items.length}
          </div>
          <Flashcard
            key={items[pos].word.id}
            word={items[pos].word}
            isNew={items[pos].isNew}
            onRate={(r, d) => void onRate(r, d)}
          />
        </>
      )}

      {phase === "review-done" && (
        <Card className="space-y-4 text-center">
          <h1 className="text-xl font-bold">Xong buổi ôn 🎉</h1>
          <p className="text-muted">
            {items.length > 0
              ? `Đúng ${correct}/${items.length} thẻ.`
              : "Không có thẻ nào đến hạn. Quay lại sau nhé!"}
          </p>
          {items.length >= 4 ? (
            <Button className="w-full" onClick={() => void startQuiz()}>
              Làm quiz chấm điểm ghi nhớ
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
          <p className="text-muted">điểm ghi nhớ của buổi này</p>
          <LinkButton href="/dashboard" className="w-full">
            Về tổng quan
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
