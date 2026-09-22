"use client";

import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { AudioButton } from "@/components/audio-button";
import { Icon, type IconName } from "@/components/icon";
import { NextStep } from "@/components/next-step";
import { RankEmblem } from "@/components/rank-emblem";
import {
  Button,
  Card,
  PageHeading,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import { mediaUrl } from "@/lib/api";
import { useAuth, useRequireAuth } from "@/lib/auth";
import {
  getActiveDuelMatch,
  joinDuelQueue,
  leaveDuelQueue,
  submitDuelAnswer,
  useDuelLeaderboard,
  useDuelQueueSize,
  useDuelRating,
  useDuelSeason,
  useDuelSocket,
  useRankTiers,
} from "@/lib/duel";
import {
  finishMatchMinigame,
  finishMinigame,
  startMinigame,
  useMinigameLeaderboard,
} from "@/lib/minigame";
import type {
  DuelFinished,
  DuelOpponent,
  DuelRoundQuestion,
  GameMode,
  MatchCard,
  MinigameQuestion,
  MinigameResult,
} from "@/lib/types";

const GAME_DURATION_MS = 60_000;

interface GameDef {
  mode: GameMode;
  title: string;
  icon: IconName;
  tileClass: string;
  tagline: string;
  rules: string[];
  supportsDuel: boolean;
}

const GAMES: GameDef[] = [
  {
    mode: "TRANSLATE",
    title: "Dịch tốc độ",
    icon: "target",
    tileClass: "bg-accent/10 text-accent",
    tagline:
      "Chọn nghĩa tiếng Việt đúng cho từ tiếng Trung hiện ra — chạy đua với đồng hồ.",
    rules: [
      "Luyện tập 1 mình: 60 giây, trả lời càng nhiều câu càng tốt, mỗi câu đúng thưởng 1 xu.",
      "Đấu 1v1: 8 câu hỏi, ai trả lời đúng nhiều hơn thắng, điểm ELO tăng/giảm theo kết quả.",
    ],
    supportsDuel: true,
  },
  {
    mode: "LISTENING",
    title: "Nghe đoán từ",
    icon: "headphones",
    tileClass: "bg-lavender/12 text-lavender",
    tagline:
      "Nghe phát âm rồi chọn đúng nghĩa — không nhìn chữ, luyện phản xạ nghe thật.",
    rules: [
      "Luyện tập 1 mình: 60 giây, chỉ nghe âm thanh (Hán tự/pinyin được ẩn), mỗi câu đúng thưởng 1 xu.",
      "Chưa có chế độ Đấu 1v1 — sẽ thêm sau khi chế độ luyện tập ổn định.",
    ],
    supportsDuel: false,
  },
  {
    mode: "MATCH",
    title: "Ghép cặp",
    icon: "cards",
    tileClass: "bg-good/10 text-good",
    tagline:
      "Lật thẻ tìm đúng cặp Hán tự ↔ nghĩa — luyện trí nhớ từ vựng, càng ít lật sai càng nhiều xu.",
    rules: [
      "8 cặp thẻ (16 ô) — lật 2 thẻ mỗi lượt, khớp đúng cặp thì giữ nguyên, sai thì úp lại.",
      "Hoàn thành càng ít lần lật sai càng được nhiều xu (tối đa 8 xu nếu không sai lần nào).",
    ],
    supportsDuel: false,
  },
  {
    mode: "PINYIN",
    title: "Chọn pinyin đúng",
    icon: "sound",
    tileClass: "bg-primary/10 text-primary",
    tagline:
      "Nhìn Hán tự, chọn đúng pinyin — luyện phát âm/thanh điệu thay vì nghĩa.",
    rules: [
      "Luyện tập 1 mình: 60 giây, trả lời càng nhiều câu càng tốt, mỗi câu đúng thưởng 1 xu.",
      "Chưa có chế độ Đấu 1v1 — sẽ thêm sau khi chế độ luyện tập ổn định.",
    ],
    supportsDuel: false,
  },
];

// ------------------------------ Sảnh chọn game ------------------------------

const MINIGAME_TOUR_STEPS: TourStep[] = [
  {
    icon: "spark",
    title: "Bốn trò chơi một mình",
    description:
      "Dịch tốc độ, Nghe đoán từ, Ghép cặp và Chọn pinyin đúng — mỗi ván 60 giây. Bấm vào một trò sẽ xem luật trước rồi mới bắt đầu.",
  },
  {
    icon: "trophy",
    title: "Đấu 1v1 với người thật",
    description:
      "Tab đấu 1v1 ghép bạn với người đang online, 8 câu, ai đúng nhiều hơn thì thắng và được cộng ELO. Rank từ Sắt tới Thách Đấu, reset theo mùa mỗi tháng.",
  },
  {
    icon: "plus",
    title: "Chơi được cộng xu",
    description:
      "Mỗi câu đúng đổi thành xu, tiêu ở cửa hàng khung avatar, danh hiệu hoặc lá chắn giữ chuỗi ngày trong mục Tài khoản.",
  },
];

function GameHub({ onSelect }: { onSelect: (game: GameDef) => void }) {
  return (
    <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {GAMES.map((g) => (
        <button
          key={g.mode}
          type="button"
          onClick={() => onSelect(g)}
          className="motion-button hover-card reveal panel relative overflow-hidden p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`icon-tile ${g.tileClass} shadow-2xs`}>
              <Icon name={g.icon} size={22} />
            </span>
            {g.supportsDuel && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Đấu 1v1
              </span>
            )}
          </div>
          <h3 className="mb-2 text-base font-bold text-foreground">
            {g.title}
          </h3>
          <p className="mb-5 text-xs leading-relaxed text-muted">{g.tagline}</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            Xem luật &amp; chơi <Icon name="arrow" size={15} />
          </span>
        </button>
      ))}
    </div>
  );
}

function GameIntro({
  game,
  onStart,
  onBack,
}: {
  game: GameDef;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="py-8 text-center">
      <span className={`icon-tile mx-auto mb-4 ${game.tileClass}`}>
        <Icon name={game.icon} size={26} />
      </span>
      <h2 className="mb-2 text-xl font-bold">{game.title}</h2>
      <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-muted">
        {game.tagline}
      </p>
      <ul className="mx-auto mb-7 max-w-md space-y-2.5 text-left text-sm">
        {game.rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Icon
              name="check"
              size={16}
              className="mt-0.5 shrink-0 text-good"
            />
            <span className="text-muted">{r}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <Icon name="back" size={16} /> Quay lại
        </Button>
        <Button onClick={onStart}>Bắt đầu chơi</Button>
      </div>
    </Card>
  );
}

// ------------------------------ Luyện tập 1 mình ------------------------------

type SoloPhase = "idle" | "playing" | "finished";

function SoloMinigame({ game }: { game: GameDef }) {
  const listening = game.mode === "LISTENING";
  // PINYIN: pinyin ĐÚNG chính là đáp án đang cho chọn trong `options`, nên
  // phải ẩn caption pinyin thường thấy ở TRANSLATE — hiện ra là lộ đáp án.
  const hidePinyinCaption = game.mode === "PINYIN";
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
  const leaderboard = useMinigameLeaderboard(period, game.mode);

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
      const res = await startMinigame(game.mode);
      setSessionId(res.sessionId);
      setQuestions(res.questions ?? []);
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

  const current = questions[qIndex];

  // Chế độ nghe: tự phát âm thanh mỗi khi sang câu mới (giống quiz-runner).
  useEffect(() => {
    if (!listening || phase !== "playing" || !current?.audioUrl) return;
    const url = mediaUrl(current.audioUrl);
    if (!url) return;
    const audio = new Audio(url);
    void audio.play().catch(() => {});
    return () => audio.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, phase, listening]);

  function choose(index: number) {
    const q = questions[qIndex];
    if (!q || phase !== "playing") return;
    const next = [
      ...answersRef.current,
      { wordId: q.wordId, chosenIndex: index },
    ];
    // finish() chạy ngay ở câu cuối, trước khi effect đồng bộ state.
    answersRef.current = next;
    setAnswers(next);
    if (qIndex + 1 >= questions.length) {
      void finish();
    } else {
      setQIndex((i) => i + 1);
    }
  }

  return (
    <>
      <Card>
        {phase === "idle" && (
          <div className="py-8 text-center">
            <Icon name="clock" size={36} className="mx-auto mb-4 text-accent" />
            <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-muted">
              Bạn có 60 giây để trả lời càng nhiều câu hỏi trắc nghiệm càng tốt.
              Mỗi câu đúng thưởng 1 xu — dùng xu để mua thêm lá chắn giữ chuỗi
              ngày học trong trang Tài khoản.
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
            {listening ? (
              <div className="mb-6 flex flex-col items-center gap-3 py-4">
                <AudioButton src={current.audioUrl} size={40} />
                <p className="text-xs text-muted">Nghe rồi chọn đúng nghĩa</p>
              </div>
            ) : (
              <>
                <p
                  className={`hanzi text-center text-5xl ${hidePinyinCaption ? "mb-6" : "mb-2"}`}
                >
                  {current.prompt}
                </p>
                {!hidePinyinCaption && (
                  <p className="mb-6 text-center text-sm text-muted">
                    {current.pinyin}
                  </p>
                )}
              </>
            )}
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

// ------------------------------ Ghép cặp ------------------------------

type MatchPhase = "idle" | "playing" | "finished";

function MatchMinigame() {
  const [phase, setPhase] = useState<MatchPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mistakesRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const leaderboard = useMinigameLeaderboard(period, "MATCH");

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  async function finish(durationMs: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const id = sessionIdRef.current;
    setPhase("finished");
    if (!id) return;
    try {
      const res = await finishMatchMinigame(
        id,
        mistakesRef.current,
        durationMs,
      );
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
      const res = await startMinigame("MATCH");
      setSessionId(res.sessionId);
      setCards(res.cards ?? []);
      setFlipped([]);
      setMatchedWordIds(new Set());
      setMistakes(0);
      mistakesRef.current = 0;
      setResult(null);
      startTimeRef.current = Date.now();
      setElapsedMs(0);
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
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Nộp bài khi đã ghép đủ mọi cặp — đặt trong effect (thay vì gọi thẳng
  // trong flipCard) để giống đúng cách SoloMinigame gọi finish() từ effect
  // đếm giờ, tránh gọi Date.now() ngay trong luồng xử lý sự kiện lật thẻ.
  useEffect(() => {
    if (phase !== "playing" || cards.length === 0) return;
    if (matchedWordIds.size === cards.length / 2) {
      void finish(Date.now() - startTimeRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedWordIds, phase]);

  function flipCard(cardId: string) {
    if (locked || phase !== "playing") return;
    if (flipped.includes(cardId)) return;
    const card = cards.find((c) => c.cardId === cardId);
    if (!card || matchedWordIds.has(card.wordId)) return;

    const next = [...flipped, cardId];
    setFlipped(next);
    if (next.length < 2) return;

    setLocked(true);
    const [firstId, secondId] = next;
    const first = cards.find((c) => c.cardId === firstId)!;
    const second = cards.find((c) => c.cardId === secondId)!;

    if (first.wordId === second.wordId) {
      const updated = new Set(matchedWordIds);
      updated.add(first.wordId);
      setMatchedWordIds(updated);
      setFlipped([]);
      setLocked(false);
    } else {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 700);
    }
  }

  function playAgain() {
    setPhase("idle");
  }

  return (
    <>
      <Card>
        {phase === "idle" && (
          <div className="py-8 text-center">
            <Icon name="cards" size={36} className="mx-auto mb-4 text-good" />
            <p className="mx-auto mb-5 max-w-md text-sm leading-6 text-muted">
              Lật 2 thẻ mỗi lượt để tìm đúng cặp Hán tự ↔ nghĩa. Hoàn thành
              không sai lần nào được thưởng tối đa 8 xu, mỗi lần lật sai trừ 1
              xu.
            </p>
            <Button onClick={() => void start()} disabled={starting}>
              {starting ? "Đang chuẩn bị…" : "Bắt đầu chơi"}
            </Button>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          </div>
        )}

        {phase === "playing" && (
          <div>
            <div className="mb-5 flex items-center justify-between text-sm">
              <span className="text-muted">
                Đã ghép {matchedWordIds.size}/{cards.length / 2} cặp
              </span>
              <span className="flex items-center gap-3">
                <span className="text-danger">Sai {mistakes} lần</span>
                <span className="font-bold tabular-nums text-primary">
                  {Math.floor(elapsedMs / 1000)}s
                </span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {cards.map((card) => {
                const isMatched = matchedWordIds.has(card.wordId);
                const isFlipped = isMatched || flipped.includes(card.cardId);
                return (
                  <button
                    key={card.cardId}
                    type="button"
                    disabled={isMatched}
                    onClick={() => flipCard(card.cardId)}
                    className={`motion-button flex aspect-square items-center justify-center rounded-xl border p-1.5 text-center transition-colors ${
                      isMatched
                        ? "border-good bg-good/10"
                        : isFlipped
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-surface-2 hover:border-primary/30"
                    }`}
                  >
                    {isFlipped ? (
                      <span
                        className={
                          card.kind === "hanzi"
                            ? "hanzi text-lg sm:text-2xl"
                            : "text-[11px] font-medium leading-tight sm:text-xs"
                        }
                      >
                        {card.content}
                      </span>
                    ) : (
                      <Icon name="spark" size={18} className="text-muted/50" />
                    )}
                  </button>
                );
              })}
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
                <p className="text-2xl font-bold">Hoàn thành!</p>
                <p className="mt-2 text-sm text-muted">
                  Sai {mistakes} lần · {Math.floor(elapsedMs / 1000)} giây
                </p>
                <p className="mt-2 text-sm text-good">
                  +{result.coinsEarned} xu — số dư hiện tại:{" "}
                  {result.balance.toLocaleString("vi-VN")} xu
                </p>
                <Button className="mt-5" onClick={playAgain}>
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
          tone="good"
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
                  {row.score} xu · {Math.floor(row.durationMs / 1000)}s
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

// ------------------------------ Đấu 1v1 ------------------------------

type DuelPhase =
  "idle" | "queueing" | "matched" | "playing" | "round-result" | "finished";

function SeasonCountdown() {
  const season = useDuelSeason();
  if (!season.data) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted">
      <Icon name="clock" size={13} />
      Mùa {season.data.number} — còn {season.data.daysRemaining} ngày
    </span>
  );
}

/** Bảng chú giải ngưỡng ELO từng bậc — gấp lại mặc định để không chiếm chỗ
 * màn hình chính, bung ra khi người chơi thật sự muốn biết "ELO này là bậc
 * gì". Thách Đấu ghi rõ luật riêng (giới hạn top N) thay vì chỉ 1 con số
 * ELO, vì bậc này không thuần theo ngưỡng như các bậc còn lại. */
function RankTiersLegend() {
  const tiersInfo = useRankTiers();
  const [open, setOpen] = useState(false);
  if (!tiersInfo.data) return null;
  const { tiers, challengerTopN } = tiersInfo.data;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <Icon name="info" size={13} />
        {open ? "Ẩn các bậc rank" : "Xem các bậc rank"}
      </button>
      {open && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {tiers.map((t, i) => {
            const isTop = i === tiers.length - 1;
            const max = tiers[i + 1] ? tiers[i + 1].min - 1 : null;
            return (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-xl border border-border p-2.5"
              >
                <RankEmblem
                  tierName={t.name}
                  color={t.color}
                  tiers={tiers}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted">
                    {isTop
                      ? `Top ${challengerTopN} điểm cao nhất, tối thiểu ${t.min} ELO`
                      : `${t.min} – ${max} ELO`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DuelMinigame() {
  const { user } = useAuth();
  const rating = useDuelRating();
  const leaderboard = useDuelLeaderboard();
  const tiersInfo = useRankTiers();
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
  const [introSecondsLeft, setIntroSecondsLeft] = useState<number | null>(null);
  const [queueElapsedS, setQueueElapsedS] = useState(0);
  const queueStartedAtRef = useRef(0);
  const [resumeChecked, setResumeChecked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueSize = useDuelQueueSize(phase === "queueing");

  // Vừa mở trang/refresh — kiểm tra có trận đang dở không, tự phục hồi UI
  // thay vì để người chơi tưởng mất trận trong khi server vẫn đang chạy.
  useEffect(() => {
    let cancelled = false;
    void getActiveDuelMatch().then((active) => {
      if (cancelled) return;
      setResumeChecked(true);
      if (!active) return;
      setMatchId(active.matchId);
      setOpponent(active.opponent);
      setTotalRounds(active.totalRounds);
      setRound(active.round);
      setScores(active.scores);
      if (active.question) {
        setQuestion(active.question);
        // -1: sentinel "đã trả lời nhưng không rõ đã chọn ô nào" — chỉ cần đủ
        // để khoá nút bấm, không khớp bất kỳ index thật nào nên không tô sai màu.
        setMyAnswer(active.myAnswered ? -1 : null);
        setPhase("playing");
      } else {
        setPhase("matched");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useDuelSocket({
    onMatched: (p) => {
      setMatchId(p.matchId);
      setOpponent(p.opponent);
      setTotalRounds(p.totalRounds);
      setScores({});
      setPhase("matched");
      setIntroSecondsLeft(Math.ceil(p.introMs / 1000));
      if (introTimerRef.current) clearInterval(introTimerRef.current);
      introTimerRef.current = setInterval(() => {
        setIntroSecondsLeft((s) => (s === null || s <= 1 ? 0 : s - 1));
      }, 1000);
    },
    onRound: (p) => {
      if (introTimerRef.current) clearInterval(introTimerRef.current);
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

  useEffect(() => {
    if (phase !== "queueing") return;
    const t = setInterval(() => {
      setQueueElapsedS(
        Math.floor((Date.now() - queueStartedAtRef.current) / 1000),
      );
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  function startQueue() {
    queueStartedAtRef.current = Date.now();
    setQueueElapsedS(0);
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

  if (!resumeChecked) return <Spinner />;

  return (
    <>
      <Card>
        {phase === "idle" && (
          <div className="py-8 text-center">
            {rating.data ? (
              <div className="mb-5 flex flex-col items-center gap-2">
                <RankEmblem
                  tierName={rating.data.tier}
                  color={rating.data.tierColor}
                  tiers={tiersInfo.data?.tiers}
                  size={64}
                />
                <p className="text-sm text-muted">
                  <strong className="text-foreground">
                    {rating.data.tier}
                  </strong>
                  {" · "}
                  {rating.data.elo} ELO
                </p>
                <p className="text-xs text-muted">
                  {rating.data.wins}T / {rating.data.losses}B /{" "}
                  {rating.data.draws}H
                </p>
              </div>
            ) : (
              <Icon
                name="flame"
                size={36}
                className="mx-auto mb-4 text-danger"
              />
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
            <p className="text-sm font-semibold tabular-nums text-foreground">
              Đang tìm đối thủ… {queueElapsedS}s
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {queueSize.data
                ? `${queueSize.data.size} người khác đang trong hàng chờ`
                : "Đang kết nối hàng chờ…"}
            </p>
            <Button variant="ghost" className="mt-4" onClick={cancelQueue}>
              Huỷ
            </Button>
          </div>
        )}

        {phase === "matched" && opponent && (
          <div className="py-8 text-center">
            <p className="mb-6 text-sm font-semibold text-primary">
              Đã tìm thấy đối thủ!
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Avatar user={user ?? {}} size={56} />
                <span className="max-w-24 truncate text-sm font-medium">
                  Bạn
                </span>
              </div>
              <span className="text-lg font-bold text-muted">VS</span>
              <div className="flex flex-col items-center gap-2">
                <Avatar user={opponent} size={56} />
                <span className="max-w-24 truncate text-sm font-medium">
                  {opponent.displayName}
                </span>
              </div>
            </div>
            <p className="mt-6 text-3xl font-bold tabular-nums text-primary">
              {introSecondsLeft ?? "…"}
            </p>
            <p className="mt-1 text-xs text-muted">Trận đấu sắp bắt đầu</p>
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
            <Icon
              name="trophy"
              size={40}
              className="mx-auto mb-3 text-primary"
            />
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
            {finishResult.forfeitedBy === "me" && (
              <p className="mt-2 text-xs text-danger">
                Bạn bị xử thua do mất kết nối quá lâu giữa trận.
              </p>
            )}
            {finishResult.forfeitedBy === "opponent" && (
              <p className="mt-2 text-xs text-muted">
                Đối thủ đã rớt mạng quá lâu nên xử thắng cho bạn.
              </p>
            )}
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

      <EloLeaderboardSection />
    </>
  );
}

/** Dùng chung cho cả Đấu 1v1 và Đấu đôi — 2 chế độ đều đọc/ghi CÙNG 1
 * `UserRating`/rank tier/mùa giải (xem `TeamDuelService` phía server), nên
 * chỉ cần 1 bảng xếp hạng ELO duy nhất thay vì lặp lại cho từng chế độ. */
function EloLeaderboardSection() {
  const leaderboard = useDuelLeaderboard();
  const tiersInfo = useRankTiers();
  return (
    <section className="mt-8">
      <SectionHeading
        icon="flame"
        tone="primary"
        title="Bảng xếp hạng ELO"
        className="mb-4"
      >
        <SeasonCountdown />
      </SectionHeading>
      <RankTiersLegend />
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
                <RankEmblem
                  tierName={row.tier}
                  color={row.tierColor}
                  tiers={tiersInfo.data?.tiers}
                  size={26}
                />
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
  );
}

// ------------------------------ Trang chính ------------------------------

type SubMode = "solo" | "duel";

function GameWorkspace({
  game,
  onBack,
}: {
  game: GameDef;
  onBack: () => void;
}) {
  const [sub, setSub] = useState<SubMode>("solo");
  const tabs: { key: SubMode; label: string; icon: IconName }[] = [
    { key: "solo", label: "Luyện tập", icon: "clock" },
    ...(game.supportsDuel
      ? [{ key: "duel" as const, label: "Đấu 1v1", icon: "flame" as const }]
      : []),
  ];
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <Icon name="back" size={15} /> Chọn minigame khác
      </button>
      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-border">
          {tabs.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={sub === m.key}
              onClick={() => setSub(m.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                sub === m.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <Icon name={m.icon} size={16} />
              {m.label}
            </button>
          ))}
        </div>
      )}
      {sub === "solo" ? (
        game.mode === "MATCH" ? (
          <MatchMinigame />
        ) : (
          <SoloMinigame game={game} />
        )
      ) : (
        <DuelMinigame />
      )}
    </div>
  );
}

type View =
  | { stage: "hub" }
  | { stage: "intro"; game: GameDef }
  | { stage: "play"; game: GameDef };

export default function MinigamePage() {
  const { user, loading } = useRequireAuth();
  const [view, setView] = useState<View>({ stage: "hub" });

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <FeatureTour tourKey="minigame" steps={MINIGAME_TOUR_STEPS} />
      <PageHeading
        icon="spark"
        tone="accent"
        eyebrow="Vừa học vừa chơi"
        title="Minigame"
        description="Chọn 1 trò chơi để luyện phản xạ từ vựng — 1 mình hoặc đấu trực tiếp với người khác."
      >
        <TourButton tourKey="minigame" />
      </PageHeading>
      {view.stage === "hub" && (
        <>
          <GameHub onSelect={(game) => setView({ stage: "intro", game })} />
          {/* Trang này trước đó KHÔNG dẫn đi đâu — chơi xong là cụt đường.
           * Minigame chỉ luyện phản xạ trên vốn từ ĐÃ có, nên bước tiếp theo
           * tự nhiên là mở rộng vốn từ đó ra. */}
          <NextStep
            title="Chơi để phản xạ nhanh hơn — nhưng vốn từ mới là gốc"
            description="Minigame luyện tốc độ trên những từ bạn đã gặp. Học thêm từ mới rồi quay lại sẽ thấy khác hẳn."
            actions={[
              {
                href: "/study",
                label: "Ôn tập flashcard",
                icon: "cards" as const,
              },
              { href: "/learn", label: "Lộ trình HSK", icon: "route" as const },
            ]}
          />
        </>
      )}
      {view.stage === "intro" && (
        <GameIntro
          game={view.game}
          onStart={() => setView({ stage: "play", game: view.game })}
          onBack={() => setView({ stage: "hub" })}
        />
      )}
      {view.stage === "play" && (
        <GameWorkspace
          game={view.game}
          onBack={() => setView({ stage: "hub" })}
        />
      )}
    </div>
  );
}
