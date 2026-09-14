"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Button, Card, PageHeading, SectionHeading, Spinner } from "@/components/ui";
import { useAuth, useRequireAuth } from "@/lib/auth";
import {
  joinDuelQueue,
  leaveDuelQueue,
  submitDuelAnswer,
  useDuelLeaderboard,
  useDuelRating,
  useDuelSocket,
} from "@/lib/duel";
import {
  finishMinigame,
  startMinigame,
  useMinigameLeaderboard,
} from "@/lib/minigame";
import type {
  DuelFinished,
  DuelOpponent,
  DuelRoundQuestion,
  MinigameQuestion,
  MinigameResult,
} from "@/lib/types";

const GAME_DURATION_MS = 60_000;

type SoloPhase = "idle" | "playing" | "finished";

function SoloMinigame() {
  const [phase, setPhase] = useState<SoloPhase>("idle");
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
    setAnswers(next);
    if (qIndex + 1 >= questions.length) {
      void finish();
    } else {
      setQIndex((i) => i + 1);
    }
  }

  const current = questions[qIndex];

  return (
    <>
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

      <section className="mt-8">
        <SectionHeading
          icon="trophy"
          tone="accent"
          title="Bảng xếp hạng luyện tập"
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
    </>
  );
}

type DuelPhase = "idle" | "queueing" | "playing" | "round-result" | "finished";

function DuelMinigame() {
  const { user } = useAuth();
  const rating = useDuelRating();
  const leaderboard = useDuelLeaderboard();
  const [phase, setPhase] = useState<DuelPhase>("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<DuelOpponent | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<DuelRoundQuestion | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [roundCorrectIndex, setRoundCorrectIndex] = useState<number | null>(
    null,
  );
  const [finishResult, setFinishResult] = useState<DuelFinished | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useDuelSocket({
    onMatched: (p) => {
      setMatchId(p.matchId);
      setOpponent(p.opponent);
      setTotalRounds(p.totalRounds);
      setScores({});
    },
    onRound: (p) => {
      setRound(p.round);
      setQuestion(p.question);
      setMyAnswer(null);
      setRoundCorrectIndex(null);
      setDeadline(Date.now() + p.deadlineMs);
      setPhase("playing");
    },
    onRoundResult: (p) => {
      setRoundCorrectIndex(p.correctIndex);
      setScores(p.scores);
      setPhase("round-result");
    },
    onFinished: (p) => {
      setFinishResult(p);
      setPhase("finished");
      void rating.mutate();
      void leaderboard.mutate();
    },
  });

  useEffect(() => {
    if (phase !== "playing" || !deadline) return;
    timerRef.current = setInterval(() => {
      setTimeLeftMs(Math.max(0, deadline - Date.now()));
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, deadline]);

  function startQueue() {
    setPhase("queueing");
    joinDuelQueue();
  }

  function cancelQueue() {
    leaveDuelQueue();
    setPhase("idle");
  }

  function choose(index: number) {
    if (myAnswer !== null || !matchId) return;
    setMyAnswer(index);
    submitDuelAnswer(matchId, index);
  }

  function playAgain() {
    setPhase("idle");
    setMatchId(null);
    setOpponent(null);
    setFinishResult(null);
    setScores({});
  }

  const myId = user?.id ?? "";
  const myScore = scores[myId] ?? 0;
  const opponentScore = opponent ? (scores[opponent.id] ?? 0) : 0;

  return (
    <>
      <Card>
        {phase === "idle" && (
          <div className="py-8 text-center">
            <Icon name="flame" size={36} className="mx-auto mb-4 text-danger" />
            {rating.data && (
              <p className="mb-4 text-sm text-muted">
                ELO của bạn:{" "}
                <strong className="text-foreground">{rating.data.elo}</strong>
                {" · "}
                {rating.data.wins}T / {rating.data.losses}B /{" "}
                {rating.data.draws}H
              </p>
            )}
            <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-muted">
              Đối đầu trực tiếp với 1 người chơi khác qua {8} câu hỏi — ai trả
              lời đúng nhiều hơn thắng, điểm ELO thay đổi theo kết quả.
            </p>
            <Button onClick={startQueue}>Tìm đối thủ</Button>
          </div>
        )}

        {phase === "queueing" && (
          <div className="py-10 text-center">
            <Icon
              name="refresh"
              size={32}
              className="mx-auto mb-4 animate-spin text-primary"
            />
            <p className="text-sm text-muted">Đang tìm đối thủ…</p>
            <Button variant="ghost" className="mt-4" onClick={cancelQueue}>
              Huỷ
            </Button>
          </div>
        )}

        {(phase === "playing" || phase === "round-result") &&
          question &&
          opponent && (
            <div>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Avatar user={opponent} size={24} />
                  {opponent.displayName}
                </span>
                <span className="font-semibold">
                  {myScore} - {opponentScore}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between text-xs text-muted">
                <span>
                  Câu {round + 1}/{totalRounds}
                </span>
                {phase === "playing" && (
                  <span
                    className={`font-bold tabular-nums ${timeLeftMs < 3000 ? "text-danger" : "text-primary"}`}
                  >
                    {Math.ceil(timeLeftMs / 1000)}s
                  </span>
                )}
              </div>
              <p className="hanzi mb-2 text-center text-5xl">
                {question.prompt}
              </p>
              <p className="mb-6 text-center text-sm text-muted">
                {question.pinyin}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {question.options.map((opt, i) => {
                  const isCorrect =
                    phase === "round-result" && roundCorrectIndex === i;
                  const isWrongChosen =
                    phase === "round-result" &&
                    myAnswer === i &&
                    roundCorrectIndex !== i;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={phase === "round-result" || myAnswer !== null}
                      onClick={() => choose(i)}
                      className={`motion-button rounded-xl border p-4 text-left text-sm font-medium ${
                        isCorrect
                          ? "border-good bg-good/10"
                          : isWrongChosen
                            ? "border-danger bg-danger/10"
                            : myAnswer === i
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {phase === "playing" && myAnswer !== null && (
                <p className="mt-4 text-center text-xs text-muted">
                  Đã trả lời — đợi đối thủ…
                </p>
              )}
            </div>
          )}

        {phase === "finished" && finishResult && (
          <div className="py-6 text-center">
            <Icon name="trophy" size={40} className="mx-auto mb-3 text-primary" />
            <p className="text-2xl font-bold">
              {finishResult.winnerId === myId
                ? "Bạn thắng!"
                : finishResult.winnerId === null
                  ? "Hoà!"
                  : "Bạn thua"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {finishResult.myScore} - {finishResult.opponentScore} với{" "}
              {finishResult.opponent.displayName}
            </p>
            <p
              className={`mt-2 text-sm font-semibold ${finishResult.eloChange >= 0 ? "text-good" : "text-danger"}`}
            >
              ELO {finishResult.eloChange >= 0 ? "+" : ""}
              {finishResult.eloChange} → {finishResult.newElo}
            </p>
            <Button className="mt-5" onClick={playAgain}>
              Chơi tiếp
            </Button>
          </div>
        )}
      </Card>

      <section className="mt-8">
        <SectionHeading
          icon="flame"
          tone="primary"
          title="Bảng xếp hạng ELO"
          className="mb-4"
        />
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
                  {row.elo} ELO · {row.wins}T/{row.losses}B/{row.draws}H
                </span>
              </div>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Chưa có ai đấu — vào tìm đối thủ đầu tiên nào!
            </p>
          )}
        </Card>
      </section>
    </>
  );
}

export default function MinigamePage() {
  const { user, loading } = useRequireAuth();
  const [mode, setMode] = useState<"solo" | "duel">("solo");

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        icon="target"
        tone="accent"
        eyebrow="Vừa học vừa chơi"
        title="Dịch tốc độ"
        description="Chọn nghĩa tiếng Việt đúng cho từ tiếng Trung — luyện 1 mình hoặc đấu trực tiếp với người khác."
      />
      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: "solo", label: "Luyện tập", icon: "clock" },
            { key: "duel", label: "Đấu 1v1", icon: "flame" },
          ] as const
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            aria-pressed={mode === m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === m.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Icon name={m.icon} size={16} />
            {m.label}
          </button>
        ))}
      </div>
      {mode === "solo" ? <SoloMinigame /> : <DuelMinigame />}
    </div>
  );
}
