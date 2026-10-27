"use client";

/**
 * BẢN ĐỒ TRANG — TRÒ CHƠI (/minigame) — sảnh 4 trò, luật chơi, ván chơi, bảng xếp hạng ngày/tuần
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   POST /minigame/:id/finish  ← finishMatchMinigame() ở lib/minigame.ts (← chính trang này) · finishMinigame() ở
 *                                lib/minigame.ts (← chính trang này)
 *                                → server: modules/minigame/minigame.controller.ts → MinigameService.finish()
 *   GET /minigame/leaderboard  ← useMinigameLeaderboard() ở lib/minigame.ts (← chính trang này)
 *                                → server: modules/minigame/minigame.controller.ts → MinigameService.leaderboard()
 *   POST /minigame/start       ← startMinigame() ở lib/minigame.ts (← chính trang này)
 *                                → server: modules/minigame/minigame.controller.ts → MinigameService.start()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import Link from "next/link";
import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
import { useEffect, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { Icon, type IconName } from "@/components/icon";
import { NextStep } from "@/components/next-step";
import {
  Button,
  Card,
  PageHeading,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import { mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  finishMatchMinigame,
  finishMinigame,
  startMinigame,
  useMinigameLeaderboard,
} from "@/lib/minigame";
import type {
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
      "Luyện tập 1 mình: 60 giây, trả lời càng nhiều câu càng tốt — mỗi câu đúng 1 điểm.",
    ],
  },
  {
    mode: "LISTENING",
    title: "Nghe đoán từ",
    icon: "headphones",
    tileClass: "bg-lavender/12 text-lavender",
    tagline:
      "Nghe phát âm rồi chọn đúng nghĩa — không nhìn chữ, luyện phản xạ nghe thật.",
    rules: [
      "Luyện tập 1 mình: 60 giây, chỉ nghe âm thanh (Hán tự/pinyin được ẩn) — mỗi câu đúng 1 điểm.",
    ],
  },
  {
    mode: "MATCH",
    title: "Ghép cặp",
    icon: "cards",
    tileClass: "bg-good/10 text-good",
    tagline:
      "Lật thẻ tìm đúng cặp Hán tự ↔ nghĩa — luyện trí nhớ từ vựng, càng ít lật sai điểm càng cao.",
    rules: [
      "8 cặp thẻ (16 ô) — lật 2 thẻ mỗi lượt, khớp đúng cặp thì giữ nguyên, sai thì úp lại.",
      "Không lật sai lần nào được tối đa 8 điểm, mỗi lần lật sai trừ 1 điểm.",
    ],
  },
  {
    mode: "PINYIN",
    title: "Chọn pinyin đúng",
    icon: "sound",
    tileClass: "bg-primary/10 text-primary",
    tagline:
      "Nhìn Hán tự, chọn đúng pinyin — luyện phát âm/thanh điệu thay vì nghĩa.",
    rules: [
      "Luyện tập 1 mình: 60 giây, trả lời càng nhiều câu càng tốt — mỗi câu đúng 1 điểm.",
    ],
  },
];

/** Khách chơi được nhưng điểm không lên bảng xếp hạng — mời tạo tài khoản ngay lúc vừa có điểm. */
function GuestScoreNote() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
      <Link href="/register?next=/minigame" className="font-semibold text-primary hover:underline">
        Tạo tài khoản
      </Link>{" "}
      để điểm của bạn có tên trên bảng xếp hạng.
    </p>
  );
}

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
    title: "Bảng xếp hạng ngày, tuần",
    description:
      "Mỗi trò có bảng xếp hạng riêng theo điểm — chơi lại để vượt điểm cao nhất của chính mình.",
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
          className="motion-button hover-card reveal panel relative flex flex-col items-start overflow-hidden p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`icon-tile ${g.tileClass} shadow-2xs`}>
              <Icon name={g.icon} size={22} />
            </span>
          </div>
          <h3 className="mb-2 text-base font-bold text-foreground">
            {g.title}
          </h3>
          <p className="mb-5 text-xs leading-relaxed text-muted">{g.tagline}</p>
          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-primary">
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
              Bạn có 60 giây để trả lời càng nhiều câu hỏi trắc nghiệm càng tốt
              — mỗi câu đúng 1 điểm.
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
                <GuestScoreNote />
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
              Lật 2 thẻ mỗi lượt để tìm đúng cặp Hán tự ↔ nghĩa. Không lật sai
              lần nào được tối đa 8 điểm, mỗi lần lật sai trừ 1 điểm.
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
                            : "text-xs font-medium leading-tight sm:text-xs"
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
                <GuestScoreNote />
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
                  {row.score} điểm · {Math.floor(row.durationMs / 1000)}s
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

// ------------------------------ Trang chính ------------------------------

function GameWorkspace({
  game,
  onBack,
}: {
  game: GameDef;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <Icon name="back" size={15} /> Chọn minigame khác
      </button>
      {game.mode === "MATCH" ? <MatchMinigame /> : <SoloMinigame game={game} />}
    </div>
  );
}

type View =
  | { stage: "hub" }
  | { stage: "intro"; game: GameDef }
  | { stage: "play"; game: GameDef };

export default function MinigamePage() {
  // Khách chơi được 4 trò 1 mình (2026-10-18) — điểm không lên bảng xếp hạng.
  const { loading } = useAuth();
  const [view, setView] = useState<View>({ stage: "hub" });

  if (loading) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <FeatureTour tourKey="minigame" steps={MINIGAME_TOUR_STEPS} />
      <PageHeading
        icon="spark"
        tone="accent"
        eyebrow="Vừa học vừa chơi"
        title="Trò chơi luyện từ"
        description="Ôn từ vựng bằng trò chơi — mỗi ván 60 giây."
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
            description="Trò chơi luyện tốc độ trên những từ bạn đã gặp. Học thêm từ mới rồi quay lại sẽ thấy khác hẳn."
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
