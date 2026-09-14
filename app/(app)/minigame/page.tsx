"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, PageHeading, SectionHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import {
  finishMinigame,
  startMinigame,
  useMinigameLeaderboard,
} from "@/lib/minigame";
import type { MinigameQuestion, MinigameResult } from "@/lib/types";

const GAME_DURATION_MS = 60_000;

type Phase = "idle" | "playing" | "finished";

export default function MinigamePage() {
  const { user, loading } = useRequireAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MinigameQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { wordId: string; chosenIndex: number }[]
  >([]);
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef<typeof answers>([]);
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const leaderboard = useMinigameLeaderboard(period);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  async function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const id = sessionIdRef.current;
    setPhase("finished");
    if (!id) return;
    try {
      const durationMs = Date.now() - startTimeRef.current;
      const res = await finishMinigame(id, answersRef.current, durationMs);
      setResult(res);
      void leaderboard.mutate();
    } catch {
      setError("Chưa nộp được kết quả. Kiểm tra mạng và thử lại.");
    }
  }

  async function start() {
    setStarting(true);
    setError("");
    try {
      const res = await startMinigame();
      setSessionId(res.sessionId);
      setQuestions(res.questions);
      setQIndex(0);
      setAnswers([]);
      setResult(null);
      setTimeLeftMs(GAME_DURATION_MS);
      startTimeRef.current = Date.now();
      finishedRef.current = false;
      setPhase("playing");
    } catch {
      setError("Chưa bắt đầu được, thử lại nhé.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      const remain = GAME_DURATION_MS - (Date.now() - startTimeRef.current);
      if (remain <= 0) {
        setTimeLeftMs(0);
        void finish();
      } else {
        setTimeLeftMs(remain);
      }
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function choose(index: number) {
    const q = questions[qIndex];
    if (!q || phase !== "playing") return;
    const next = [...answersRef.current, { wordId: q.wordId, chosenIndex: index }];
    // finish() chạy ngay ở câu cuối, trước khi effect đồng bộ state.
    answersRef.current = next;
    setAnswers(next);
    if (qIndex + 1 >= questions.length) {
      void finish();
    } else {
      setQIndex((i) => i + 1);
    }
  }

  if (loading || !user) return <Spinner />;

  const current = questions[qIndex];

  return (
    <div className="page-wrap space-y-8">
      <PageHeading
        icon="target"
        tone="accent"
        eyebrow="Vừa học vừa chơi"
        title="Dịch tốc độ"
        description="Chọn nghĩa tiếng Việt đúng cho càng nhiều từ càng tốt trong 60 giây — mỗi câu đúng thưởng 1 xu."
      />

      <Card>
        {phase === "idle" && (
          <div className="py-8 text-center">
            <Icon name="clock" size={36} className="mx-auto mb-4 text-accent" />
            <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-muted">
              Bạn có 60 giây để trả lời càng nhiều câu hỏi trắc nghiệm càng
              tốt. Mỗi câu đúng thưởng 1 xu — dùng xu để mua thêm lá chắn giữ
              chuỗi ngày học trong trang Tài khoản.
            </p>
            <Button onClick={() => void start()} disabled={starting}>
              {starting ? "Đang chuẩn bị…" : "Bắt đầu chơi"}
            </Button>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        )}

        {phase === "playing" && current && (
          <div>
            <div className="mb-5 flex items-center justify-between text-sm">
              <span className="text-muted">
                Câu {qIndex + 1}/{questions.length}
              </span>
              <span
                className={`font-bold tabular-nums ${timeLeftMs < 10_000 ? "text-danger" : "text-primary"}`}
              >
                {Math.ceil(timeLeftMs / 1000)}s
              </span>
            </div>
            <p className="hanzi mb-2 text-center text-5xl">{current.prompt}</p>
            <p className="mb-6 text-center text-sm text-muted">
              {current.pinyin}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  className="motion-button rounded-xl border border-border p-4 text-left text-sm font-medium hover:border-primary/40 hover:bg-primary/5"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "finished" && (
          <div className="py-6 text-center">
            {!result ? (
              error ? (
                <p className="text-sm text-danger">{error}</p>
              ) : (
                <Spinner />
              )
            ) : (
              <>
                <Icon
                  name="trophy"
                  size={40}
                  className="mx-auto mb-3 text-primary"
                />
                <p className="text-2xl font-bold">
                  {result.score}/{result.totalAsked} câu đúng
                </p>
                <p className="mt-2 text-sm text-good">
                  +{result.coinsEarned} xu — số dư hiện tại:{" "}
                  {result.balance.toLocaleString("vi-VN")} xu
                </p>
                <Button className="mt-5" onClick={() => setPhase("idle")}>
                  Chơi lại
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      <section>
        <SectionHeading
          icon="trophy"
          tone="accent"
          title="Bảng xếp hạng"
          className="mb-4"
        >
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${period === p ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2"}`}
              >
                {p === "daily" ? "Hôm nay" : "Tuần này"}
              </button>
            ))}
          </div>
        </SectionHeading>
        <Card className="divide-y divide-border p-0!">
          {leaderboard.data?.length ? (
            leaderboard.data.map((row) => (
              <div
                key={row.userId}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <span className="flex items-center gap-3 text-sm">
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted">
                    {row.rank}
                  </span>
                  {row.displayName}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {row.score}/{row.totalAsked} câu
                </span>
              </div>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Chưa có ai chơi trong khoảng này — chơi ngay để dẫn đầu!
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
