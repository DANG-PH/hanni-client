"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { ChoiceStep, playWord, shortMeaning } from "@/components/lesson-session/steps";
import { ShareButton } from "@/components/share-button";
import { Brand } from "@/components/sidebar";
import { Button, LinkButton, ProgressBar } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { savePendingCourseLevel } from "@/lib/pending-lessons";
import type { PlacementTest as Test } from "@/lib/types";

const levelLabel = (level: number) => (level === 7 ? "7–9" : String(level));

interface LevelScore {
  level: number;
  correct: number;
  asked: number;
  passed: boolean;
}

/** "Không biết" — tính là sai nhưng không tô đỏ ô nào, chỉ hiện đáp án. */
const SKIPPED = -1;

/**
 * Kiểm tra trình độ đầu vào — thay cho việc TỰ KHAI cấp ở khảo sát (Hanbeego,
 * Hanpeak, XieHanzi đều có). Hỏi dần từ HSK1 lên: mỗi cấp tối đa 4 câu, đúng 3
 * là qua (đủ 3 thì bỏ câu cuối), sai 2 là dừng và đề xuất học từ cấp đó.
 * Khách làm được không cần tài khoản; kết quả ghi tạm để đăng ký xong thành cấp
 * lộ trình (`savePendingCourseLevel`).
 */
export function PlacementTest() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"intro" | "loading" | "error" | "test" | "result">(
    "intro",
  );
  const [test, setTest] = useState<Test | null>(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tally, setTally] = useState({ correct: 0, wrong: 0 });
  const [scores, setScores] = useState<LevelScore[]>([]);

  const words = useMemo(
    () => new Map((test?.words ?? []).map((w) => [w.id, w])),
    [test],
  );
  const level = test?.levels[levelIdx];
  const step = level?.steps[qIdx];
  const word = step ? words.get(step.wordId) : undefined;

  async function start() {
    setPhase("loading");
    try {
      const t = await apiFetch<Test>("/learn/placement");
      const levels = t.levels.filter((l) => l.steps.length > 0);
      if (levels.length === 0) throw new Error("Đề trống");
      setTest({ ...t, levels });
      setLevelIdx(0);
      setQIdx(0);
      setPicked(null);
      setTally({ correct: 0, wrong: 0 });
      setScores([]);
      setPhase("test");
    } catch {
      setPhase("error");
    }
  }

  const answer = useCallback(
    (i: number) => {
      if (!step || picked !== null) return;
      setPicked(i);
      const ok = i === step.answer;
      if (ok && step.prompt !== "audio") playWord(word?.audioUrl);
      setTally((t) =>
        ok ? { ...t, correct: t.correct + 1 } : { ...t, wrong: t.wrong + 1 },
      );
    },
    [step, picked, word],
  );

  const next = useCallback(() => {
    if (!test || !level) return;
    setPicked(null);
    const total = level.steps.length;
    const need = Math.min(test.passPerLevel, total);
    const asked = tally.correct + tally.wrong;
    const failed = tally.wrong > total - need;
    if (!failed && tally.correct < need && asked < total) {
      setQIdx(qIdx + 1);
      return;
    }
    const done = [...scores, { level: level.level, correct: tally.correct, asked, passed: !failed }];
    setScores(done);
    if (!failed && levelIdx + 1 < test.levels.length) {
      setLevelIdx(levelIdx + 1);
      setQIdx(0);
      setTally({ correct: 0, wrong: 0 });
      return;
    }
    if (!user) savePendingCourseLevel(level.level);
    setPhase("result");
  }, [test, level, tally, scores, qIdx, levelIdx, user]);

  // Enter = Tiếp tục sau khi đã trả lời.
  useEffect(() => {
    if (phase !== "test" || picked === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, picked, next]);

  if (phase === "result") return <Result scores={scores} isGuest={!user} onRetry={start} />;

  if (phase === "test" && test && level && step && word) {
    const correct = picked === null || picked === SKIPPED ? null : picked === step.answer;
    const progress = ((levelIdx + qIdx / level.steps.length) / test.levels.length) * 100;
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setPhase("intro")}
              aria-label="Dừng bài kiểm tra"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
            >
              <Icon name="close" size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <ProgressBar value={progress} label="Tiến độ bài kiểm tra" />
              <p className="mt-1 text-[11px] text-muted">
                Kiểm tra trình độ · HSK {levelLabel(level.level)} · câu {qIdx + 1}
              </p>
            </div>
          </div>
        </header>

        <main
          key={`${levelIdx}-${qIdx}`}
          className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-40"
          style={{ animation: "reveal-in 280ms var(--motion-ease) both" }}
        >
          <ChoiceStep step={step} word={word} picked={picked} onPick={answer} />
          {picked === null && (
            <button
              type="button"
              onClick={() => answer(SKIPPED)}
              className="mx-auto mt-6 block text-sm font-semibold text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              Tôi chưa biết từ này
            </button>
          )}
        </main>

        {picked !== null && (
          <footer
            className={`fixed inset-x-0 bottom-0 z-20 border-t ${
              correct === null
                ? "border-border bg-surface"
                : correct
                  ? "border-good/30 bg-good/10"
                  : "border-danger/30 bg-danger/10"
            }`}
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p
                  className={`flex items-center gap-1.5 font-bold ${
                    correct === null ? "text-foreground" : correct ? "text-good" : "text-danger"
                  }`}
                >
                  {correct !== null && <Icon name={correct ? "check" : "close"} size={18} />}
                  {correct === null ? "Không sao — đáp án là:" : correct ? "Chính xác!" : "Chưa đúng"}
                </p>
                <p className="mt-0.5 truncate text-sm">
                  <span lang="zh" className="hanzi">
                    {word.simplified}
                  </span>{" "}
                  <span className="text-muted">{word.pinyin}</span> —{" "}
                  {shortMeaning(word.meaningVi ?? "")}
                </p>
              </div>
              <Button onClick={next} className="sm:ml-auto sm:min-w-40">
                Tiếp tục
                <Icon name="arrow" size={16} />
              </Button>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-surface/95">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
          <Link href={user ? "/learn" : "/"} aria-label="Về trang chủ Hanni">
            <Brand />
          </Link>
        </div>
      </header>
      <main
        className="mx-auto w-full max-w-xl flex-1 px-4 py-10 text-center"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <Image
          src="/anhloading.png"
          alt="Cáo Hanni"
          width={180}
          height={150}
          priority
          className="mx-auto h-32 w-auto"
        />
        <p className="mt-5 text-[11px] font-bold tracking-wider text-primary">
          MIỄN PHÍ · KHÔNG CẦN ĐĂNG KÝ
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Kiểm tra trình độ tiếng Trung
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Trả lời vài câu nghe – đọc bằng từ vựng HSK 3.0 thật. Hanni hỏi dần từ HSK1
          lên, dừng ở cấp bạn chưa vững rồi đề xuất cấp nên bắt đầu học — khoảng 2–5
          phút.
        </p>
        <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm">
          {[
            { icon: "target" as const, text: "Mỗi cấp tối đa 4 câu — đúng 3 câu là qua cấp." },
            { icon: "sound" as const, text: "Có câu nghe — nhớ bật âm thanh." },
            {
              icon: "spark" as const,
              text: "Không biết thì bấm “Tôi chưa biết” — đoán bừa làm kết quả kém chính xác.",
            },
          ].map((r) => (
            <li key={r.text} className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3">
              <Icon name={r.icon} size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
        {phase === "error" && (
          <p className="mt-5 text-sm text-danger">
            Chưa tải được đề kiểm tra. Bạn kiểm tra kết nối mạng rồi thử lại nhé.
          </p>
        )}
        <Button
          onClick={start}
          disabled={phase === "loading"}
          className="mt-7 w-full sm:w-auto sm:px-10!"
        >
          {phase === "loading" ? "Đang chuẩn bị đề…" : "Bắt đầu kiểm tra"}
          <Icon name="arrow" size={16} />
        </Button>
        <p className="mt-5 text-xs text-muted">
          Chưa học tiếng Trung bao giờ?{" "}
          <Link href="/bat-dau?level=1" className="font-semibold text-primary hover:underline">
            Học bài 1 HSK1 luôn
          </Link>
        </p>
      </main>
    </div>
  );
}

function Result({
  scores,
  isGuest,
  onRetry,
}: {
  scores: LevelScore[];
  isGuest: boolean;
  onRetry: () => void;
}) {
  const failed = scores.find((s) => !s.passed);
  const level = failed?.level ?? scores[scores.length - 1]?.level ?? 1;
  const passed = scores.filter((s) => s.passed);
  const label = levelLabel(level);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main
        className="mx-auto w-full max-w-xl flex-1 px-4 py-10 text-center"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <Image
          src="/anhloading.png"
          alt="Cáo Hanni"
          width={180}
          height={150}
          priority
          className="mx-auto h-32 w-auto"
        />
        <p className="mt-5 text-[11px] font-bold tracking-wider text-primary">
          KẾT QUẢ KIỂM TRA TRÌNH ĐỘ
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Bạn nên bắt đầu từ HSK {label}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {passed.length === 0
            ? "Học từ những từ cơ bản nhất là vừa sức nhất — mỗi bài 5–10 phút, nhiều từ đọc gần giống tiếng Việt nhờ âm Hán Việt."
            : !failed
              ? "Bạn nắm chắc từ vựng cả 6 cấp đầu — HSK 7–9 là chặng tiếp theo."
              : `Bạn đã vững từ vựng HSK ${passed.length === 1 ? "1" : `1–${levelLabel(passed[passed.length - 1].level)}`}. Học tiếp từ HSK ${label} để không phải học lại thứ đã biết.`}
        </p>

        <ul className="mx-auto mt-6 grid max-w-sm gap-2 text-left">
          {scores.map((s) => (
            <li
              key={s.level}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 ${
                s.passed ? "border-good/30 bg-good/5" : "border-danger/30 bg-danger/5"
              }`}
            >
              <Icon
                name={s.passed ? "check" : "close"}
                size={18}
                className={s.passed ? "text-good" : "text-danger"}
              />
              <span className="font-semibold">HSK {levelLabel(s.level)}</span>
              <span className="ml-auto text-sm text-muted">
                đúng {s.correct}/{s.asked}
                {s.passed ? "" : " — chưa vững"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-3">
          <LinkButton href={`/bat-dau?level=${level}`}>
            {isGuest ? `Học bài 1 HSK ${label} ngay` : `Học HSK ${label}`}
            <Icon name="arrow" size={16} />
          </LinkButton>
          {isGuest && (
            <LinkButton href="/register?next=/learn" variant="secondary">
              Tạo tài khoản để lưu lộ trình
            </LinkButton>
          )}
          <p className="text-xs text-muted">
            Kết quả ước lượng từ {scores.reduce((n, s) => n + s.asked, 0)} câu — bạn đổi cấp
            được bất cứ lúc nào ở trang Học.{" "}
            <button type="button" onClick={onRetry} className="font-semibold text-primary hover:underline">
              Làm lại
            </button>
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <ShareButton
            title="Kiểm tra trình độ tiếng Trung — Hanni"
            text={`Mình vừa kiểm tra trình độ tiếng Trung trên Hanni: nên học HSK ${label}. Bạn ở cấp nào? Làm thử 3 phút, miễn phí:`}
            path="/kiem-tra-trinh-do"
          />
        </div>
      </main>
    </div>
  );
}
