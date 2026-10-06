"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Icon } from "@/components/icon";
import { ShareButton } from "@/components/share-button";
import { StudyLoader } from "@/components/study-loader";
import { Button, LinkButton } from "@/components/ui";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { hasChineseVoice, playListening, stopListening } from "@/lib/listening-audio";
import { savePendingExam } from "@/lib/pending-lessons";
import type {
  MockAnswer,
  MockExamResult,
  MockPaper,
  MockPart,
  MockReviewItem,
  MockSectionKind,
} from "@/lib/types";
import { ExamItem, SharedBoard } from "./exam-items";

const SECTION_VI: Record<MockSectionKind, { zh: string; vi: string }> = {
  listening: { zh: "听力", vi: "Nghe hiểu" },
  reading: { zh: "阅读", vi: "Đọc hiểu" },
  writing: { zh: "书写", vi: "Viết" },
};
const PART_ZH = ["第一部分", "第二部分", "第三部分", "第四部分"];

/** Hướng dẫn từng dạng câu — đề thật in bằng tiếng Trung kèm ví dụ, ở đây nói
 * thẳng bằng tiếng Việt để người mới khỏi đoán. */
function instruction(section: MockSectionKind, type: MockPart["type"]): string {
  const listen = section === "listening";
  switch (type) {
    case "judge":
      return listen
        ? "Nghe từ/cụm từ rồi xem tranh: khớp với tranh chọn ✓, không khớp chọn ✗."
        : "Đọc từ bên cạnh tranh: khớp với tranh chọn ✓, không khớp chọn ✗.";
    case "choose-picture":
      return "Nghe 1 câu, chọn tranh đúng với câu vừa nghe.";
    case "match-picture":
      return listen
        ? "Nghe đoạn hội thoại, chọn tranh A–F phù hợp. Mỗi tranh dùng 1 lần, thừa 1 tranh."
        : "Đọc câu, chọn tranh A–F phù hợp. Mỗi tranh dùng 1 lần, thừa 1 tranh.";
    case "choose-text":
      return "Nghe câu và câu hỏi (问), chọn đáp án đúng.";
    case "match-text":
      return "Chọn câu trả lời A–F phù hợp với mỗi câu hỏi. Mỗi câu trả lời dùng 1 lần.";
    case "fill-blank":
      return "Chọn từ A–F điền vào chỗ trống. Mỗi từ dùng 1 lần.";
  }
}

const STORAGE = (slug: string) => `hanni:mock-exam:${slug}`;
interface Saved {
  answers: (MockAnswer | null)[];
  flags: number[];
  startedAt: number;
}

function readSaved(slug: string, durationMin: number): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE(slug)) ?? "null") as Saved | null;
    // Quá giờ làm bài thì bài dở đó coi như bỏ — không cho "làm tiếp" vô hạn.
    if (!s || Date.now() - s.startedAt > durationMin * 60_000) return null;
    return s;
  } catch {
    return null;
  }
}

function clearSaved(slug: string) {
  try {
    localStorage.removeItem(STORAGE(slug));
  } catch {
    /* bỏ qua */
  }
}

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export function MockExamRunner({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: paper, error } = useSWR<MockPaper>(
    `/mock-exams/${slug}`,
    (p: string) => apiFetch<MockPaper>(p),
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false },
  );
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [answers, setAnswers] = useState<(MockAnswer | null)[]>([]);
  const [flags, setFlags] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [pinyin, setPinyin] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState<"submit" | "exit" | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [result, setResult] = useState<MockExamResult | null>(null);
  const [usedSec, setUsedSec] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  // Bài làm dở lưu trên máy (đọc lại sau mỗi lần nộp/xoá qua `savedVersion`).
  const saved = useMemo(
    () => (paper ? readSaved(slug, paper.durationMin) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paper, slug, savedVersion],
  );

  const showPinyin = pinyin ?? paper?.showPinyin ?? false;
  const total = paper?.questionCount ?? 0;
  const answered = answers.filter((a) => a !== null && a !== undefined).length;
  const remaining = paper
    ? Math.max(0, paper.durationMin * 60 - Math.floor((now - startedAt) / 1000))
    : 0;

  const start = useCallback(
    (resume: Saved | null) => {
      if (!paper) return;
      const t = Date.now();
      setAnswers(resume?.answers ?? new Array<MockAnswer | null>(paper.questionCount).fill(null));
      setFlags(resume?.flags ?? []);
      setStartedAt(resume?.startedAt ?? t);
      setNow(t);
      setResult(null);
      setPhase("test");
      window.scrollTo({ top: 0 });
    },
    [paper],
  );

  useEffect(() => {
    if (phase !== "test") return;
    try {
      localStorage.setItem(STORAGE(slug), JSON.stringify({ answers, flags, startedAt }));
    } catch {
      /* bỏ qua */
    }
  }, [phase, answers, flags, startedAt, slug]);

  const submit = useCallback(async () => {
    if (!paper || busy) return;
    setBusy(true);
    setSubmitError(false);
    stopListening();
    const durationSec = Math.min(paper.durationMin * 60, Math.round((Date.now() - startedAt) / 1000));
    try {
      const r = await api.post<MockExamResult>(`/mock-exams/${slug}/submit`, { answers, durationSec });
      if (!user) savePendingExam({ slug, answers, durationSec });
      clearSaved(slug);
      setSavedVersion((v) => v + 1);
      setUsedSec(durationSec);
      setResult(r);
      setConfirm(null);
      setPhase("result");
      void mutate("/mock-exams");
      window.scrollTo({ top: 0 });
    } catch {
      setSubmitError(true);
      // Tự nộp lúc hết giờ mà lỗi mạng: phải hiện hộp thoại để bấm nộp lại.
      setConfirm("submit");
    } finally {
      setBusy(false);
    }
  }, [paper, busy, startedAt, slug, answers, user]);

  // Đồng hồ; hết giờ thì tự nộp ĐÚNG 1 lần như phòng thi thật (lỗi mạng thì
  // hộp thoại nộp bài hiện ra để bấm lại, không tự thử mỗi giây).
  const submitRef = useRef(submit);
  const autoSubmitted = useRef(false);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    if (phase !== "test" || !paper) return;
    autoSubmitted.current = false;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (!autoSubmitted.current && t - startedAt >= paper.durationMin * 60_000) {
        autoSubmitted.current = true;
        void submitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, paper, startedAt]);

  const setAnswer = (no: number, v: MockAnswer) =>
    setAnswers((a) => a.map((x, i) => (i === no - 1 ? v : x)));
  const toggleFlag = (no: number) =>
    setFlags((f) => (f.includes(no) ? f.filter((n) => n !== no) : [...f, no]));
  const jump = (no: number) => {
    setNavOpen(false);
    document.getElementById(`q-${no}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted">Chưa tải được đề thi. Bạn thử lại sau nhé.</p>
        <Link href="/thi-thu-hsk" className="text-sm font-semibold text-primary hover:underline">
          Về danh sách đề
        </Link>
      </div>
    );
  if (!paper) return <StudyLoader variant="startup" label="Đang mở đề thi…" />;

  if (phase === "intro")
    return <Intro paper={paper} saved={saved} onStart={start} isGuest={!user} />;

  if (phase === "result" && result)
    return (
      <Result
        paper={paper}
        result={result}
        usedSec={usedSec}
        answers={answers}
        pinyin={showPinyin}
        setPinyin={setPinyin}
        isGuest={!user}
        onRetry={() => start(null)}
      />
    );

  const lowTime = remaining <= 5 * 60;
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setConfirm("exit")}
            className="flex h-10 items-center gap-1 rounded-xl px-2 text-sm text-muted hover:bg-surface-2"
          >
            <Icon name="back" size={18} />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{paper.title}</p>
            <p className="text-[11px] text-muted">
              Đã làm {answered}/{total}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPinyin(!showPinyin)}
            aria-pressed={showPinyin}
            className={`hidden h-10 rounded-xl border px-3 text-xs font-semibold sm:block ${
              showPinyin ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted"
            }`}
          >
            Pinyin
          </button>
          <span
            className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 font-mono text-sm font-bold tabular-nums ${
              lowTime ? "border-danger/40 bg-danger/10 text-danger" : "border-border"
            }`}
            aria-label="Thời gian còn lại"
          >
            <Icon name="clock" size={16} />
            {mmss(remaining)}
          </span>
          <Button onClick={() => setConfirm("submit")} className="h-10 px-4!">
            Nộp bài
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_260px] lg:items-start">
        <main className="min-w-0 space-y-8">
          {paper.sections.map((section) => (
            <section key={section.kind} className="space-y-6">
              <h2 className="flex items-baseline gap-3 border-l-4 border-primary pl-3">
                <span lang="zh" className="hanzi text-2xl font-bold">
                  {SECTION_VI[section.kind].zh}
                </span>
                <span className="text-sm font-semibold text-muted">
                  {SECTION_VI[section.kind].vi}
                </span>
              </h2>
              {section.parts.map((part, pi) => (
                <div key={part.no} className="space-y-3">
                  <div className="rounded-2xl bg-surface-2 px-4 py-3">
                    <p className="text-sm font-bold">
                      <span lang="zh" className="hanzi mr-2">
                        {PART_ZH[pi]}
                      </span>
                      Câu {part.no}–{part.no + part.items.length - 1}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{instruction(section.kind, part.type)}</p>
                  </div>
                  <SharedBoard part={part} pinyin={showPinyin} />
                  {part.items.map((item) => (
                    <ExamItem
                      key={item.no}
                      part={part}
                      item={item}
                      section={section.kind}
                      given={answers[item.no - 1] ?? null}
                      onChange={(v) => setAnswer(item.no, v)}
                      pinyin={showPinyin}
                      flagged={flags.includes(item.no)}
                      onFlag={() => toggleFlag(item.no)}
                    />
                  ))}
                </div>
              ))}
            </section>
          ))}
          <div className="rounded-3xl border border-border bg-surface p-5 text-center">
            <p className="text-sm text-muted">
              Đã làm {answered}/{total} câu
              {flags.length > 0 && ` · ${flags.length} câu đánh dấu xem lại`}
            </p>
            <Button onClick={() => setConfirm("submit")} className="mt-3">
              Nộp bài
              <Icon name="arrow" size={16} />
            </Button>
          </div>
        </main>

        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <Navigator paper={paper} answers={answers} flags={flags} onJump={jump} />
        </aside>
      </div>

      {/* Điện thoại: bảng câu hỏi mở dạng tấm dưới đáy. */}
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-lg lg:hidden"
      >
        <Icon name="menu" size={16} />
        Câu hỏi {answered}/{total}
      </button>
      {navOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden" onClick={() => setNavOpen(false)}>
          <div
            className="max-h-[75dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <Navigator paper={paper} answers={answers} flags={flags} onJump={jump} />
          </div>
        </div>
      )}

      {confirm && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-2xl">
            {confirm === "submit" ? (
              <>
                <h2 className="text-lg font-bold">Nộp bài?</h2>
                <p className="mt-2 text-sm text-muted">
                  {answered < total
                    ? `Bạn còn ${total - answered} câu chưa làm — câu bỏ trống tính là sai.`
                    : "Bạn đã làm hết các câu."}
                </p>
                {submitError && (
                  <p className="mt-2 text-sm text-danger">
                    Chưa nộp được — kiểm tra kết nối rồi thử lại. Bài làm vẫn được giữ trên máy.
                  </p>
                )}
                <div className="mt-5 grid gap-2">
                  <Button onClick={submit} disabled={busy}>
                    {busy ? "Đang chấm điểm…" : "Nộp bài và xem điểm"}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirm(null)}>
                    Làm tiếp
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">Thoát bài thi?</h2>
                <p className="mt-2 text-sm text-muted">
                  Bài làm được giữ tạm trên máy này — quay lại trong thời gian làm bài là làm tiếp được.
                </p>
                <div className="mt-5 grid gap-2">
                  <Button onClick={() => setConfirm(null)}>Làm tiếp</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      stopListening();
                      router.push("/thi-thu-hsk");
                    }}
                  >
                    Thoát
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Navigator({
  paper,
  answers,
  flags,
  onJump,
}: {
  paper: MockPaper;
  answers: (MockAnswer | null)[];
  flags: number[];
  onJump: (no: number) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-4">
      <p className="text-sm font-bold">Danh sách câu</p>
      {paper.sections.map((s) => {
        const nos = s.parts.flatMap((p) => p.items.map((i) => i.no));
        return (
          <div key={s.kind} className="mt-3">
            <p className="text-xs font-semibold text-muted">{SECTION_VI[s.kind].vi}</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {nos.map((no) => {
                const done = answers[no - 1] !== null && answers[no - 1] !== undefined;
                const flagged = flags.includes(no);
                return (
                  <button
                    key={no}
                    type="button"
                    onClick={() => onJump(no)}
                    className={`relative h-9 rounded-lg text-xs font-bold transition-colors ${
                      done ? "bg-foreground text-background" : "bg-surface-2 hover:bg-foreground/10"
                    } ${flagged ? "ring-2 ring-warn ring-offset-1 ring-offset-surface" : ""}`}
                  >
                    {no}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="mt-4 space-y-1.5 text-[11px] text-muted">
        <p className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-foreground" /> Đã làm
        </p>
        <p className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-surface-2" /> Chưa làm
        </p>
        <p className="flex items-center gap-2">
          <span className="h-3 w-3 rounded ring-2 ring-warn" /> Đánh dấu xem lại
        </p>
      </div>
    </div>
  );
}

function Intro({
  paper,
  saved,
  onStart,
  isGuest,
}: {
  paper: MockPaper;
  saved: Saved | null;
  onStart: (resume: Saved | null) => void;
  isGuest: boolean;
}) {
  const [voice, setVoice] = useState<"unknown" | "checking" | "ok" | "missing">("unknown");
  async function testAudio() {
    setVoice("checking");
    if (!(await hasChineseVoice())) return setVoice("missing");
    setVoice("ok");
    await playListening({ lines: [{ s: "F", zh: "你好，欢迎参加汉语水平考试。" }] });
  }
  const savedCount = saved?.answers.filter((a) => a !== null).length ?? 0;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/thi-thu-hsk" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <Icon name="back" size={18} /> Danh sách đề
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-[11px] font-bold tracking-wider text-primary">ĐỀ THI THỬ · ĐÚNG CẤU TRÚC ĐỀ THẬT</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{paper.title}</h1>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Số câu", v: `${paper.questionCount} câu` },
              { k: "Thời gian", v: `${paper.durationMin} phút` },
              { k: "Tổng điểm", v: `${paper.maxScore}` },
              { k: "Điểm đạt", v: `${paper.passScore}` },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-surface-2 px-3 py-3">
                <dt className="text-[11px] text-muted">{s.k}</dt>
                <dd className="mt-0.5 text-lg font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-5 space-y-2 text-sm leading-6">
            {paper.sections.map((s) => (
              <li key={s.kind} className="flex gap-2">
                <Icon name={s.kind === "listening" ? "headphones" : "book"} size={18} className="mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong>
                    {SECTION_VI[s.kind].vi} ({SECTION_VI[s.kind].zh})
                  </strong>{" "}
                  — {s.parts.length} phần, {s.parts.reduce((n, p) => n + p.items.length, 0)} câu, tối đa 100 điểm.
                </span>
              </li>
            ))}
            <li className="flex gap-2">
              <Icon name="sound" size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>
                Phần nghe: bấm <strong>Nghe</strong> ở từng câu, mỗi câu đọc 2 lần như đề thật (giọng đọc tiếng Trung
                của trình duyệt; từ đơn dùng bản ghi âm thật).
              </span>
            </li>
            <li className="flex gap-2">
              <Icon name="flag" size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>Làm câu nào trước cũng được, đánh dấu câu cần xem lại. Hết giờ hệ thống tự nộp bài.</span>
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <Button variant="secondary" onClick={testAudio} disabled={voice === "checking"} className="h-9 px-3! text-sm">
              <Icon name="sound" size={16} />
              Kiểm tra âm thanh
            </Button>
            <p className="min-w-0 flex-1 text-xs text-muted">
              {voice === "ok"
                ? "Nghe rõ là ổn. Nên dùng tai nghe như phòng thi thật."
                : voice === "missing"
                  ? "Thiết bị chưa có giọng đọc tiếng Trung — nên mở bằng Chrome/Edge/Safari. Không nghe được thì mỗi câu nghe sẽ cho xem lời thoại."
                  : "Bật loa/tai nghe rồi bấm thử trước khi vào thi."}
            </p>
          </div>

          {isGuest && (
            <p className="mt-4 text-xs text-muted">
              Bạn chưa đăng nhập — vẫn làm và xem điểm, chữa bài bình thường.{" "}
              <Link href={`/login?next=/thi-thu-hsk/${paper.slug}`} className="font-semibold text-primary hover:underline">
                Đăng nhập
              </Link>{" "}
              để lưu điểm và theo dõi tiến bộ.
            </p>
          )}

          <div className="mt-6 grid gap-2 sm:flex">
            {saved ? (
              <>
                <Button onClick={() => onStart(saved)}>
                  Làm tiếp bài đang dở ({savedCount}/{paper.questionCount} câu)
                  <Icon name="arrow" size={16} />
                </Button>
                <Button variant="ghost" onClick={() => onStart(null)}>
                  Làm lại từ đầu
                </Button>
              </>
            ) : (
              <Button onClick={() => onStart(null)} className="sm:px-10!">
                Bắt đầu làm bài
                <Icon name="arrow" size={16} />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Result({
  paper,
  result,
  usedSec,
  answers,
  pinyin,
  setPinyin,
  isGuest,
  onRetry,
}: {
  paper: MockPaper;
  result: MockExamResult;
  usedSec: number;
  answers: (MockAnswer | null)[];
  pinyin: boolean;
  setPinyin: (v: boolean) => void;
  isGuest: boolean;
  onRetry: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "wrong">("wrong");
  const review = useMemo(() => new Map(result.review.map((r) => [r.no, r])), [result]);
  const wrong = result.review.filter((r) => !r.correct).length;
  const pct = Math.round((result.score / result.maxScore) * 100);
  const levelLabel = paper.level === 7 ? "7–9" : String(paper.level);
  const shown = (r: MockReviewItem | undefined) => filter === "all" || (r && !r.correct);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/thi-thu-hsk" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <Icon name="back" size={18} /> Danh sách đề
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="rounded-3xl border border-border bg-surface p-6 text-center sm:p-8">
          <Image src="/anhloading.png" alt="Cáo Hanni" width={150} height={125} className="mx-auto h-28 w-auto" />
          <p className="mt-3 text-[11px] font-bold tracking-wider text-primary">KẾT QUẢ · {paper.title.toUpperCase()}</p>
          <p className="mt-2 text-5xl font-extrabold tracking-tight">
            {result.score}
            <span className="text-2xl text-muted">/{result.maxScore}</span>
          </p>
          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${
              result.passed ? "bg-good/15 text-good" : "bg-danger/10 text-danger"
            }`}
          >
            <Icon name={result.passed ? "check" : "close"} size={16} />
            {result.passed ? `ĐẠT (từ ${result.passScore} điểm)` : `CHƯA ĐẠT — cần ${result.passScore} điểm`}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            {pct >= 90
              ? "Rất vững! Bạn sẵn sàng đi thi cấp này — thử đề khác để chắc chắn."
              : result.passed
                ? "Đã qua mốc đạt. Xem lại các câu sai bên dưới để kéo điểm lên cao hơn."
                : "Chưa sao — xem kỹ các câu sai, ôn lại từ vựng rồi làm lại, điểm sẽ lên nhanh."}
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {result.sections.map((s) => (
              <div key={s.kind} className="rounded-2xl bg-surface-2 px-3 py-3">
                <dt className="text-[11px] text-muted">
                  {SECTION_VI[s.kind].vi} · đúng {s.correct}/{s.total}
                </dt>
                <dd className="mt-0.5 text-xl font-bold">{s.score}/100</dd>
              </div>
            ))}
            <div className="rounded-2xl bg-surface-2 px-3 py-3">
              <dt className="text-[11px] text-muted">Thời gian làm</dt>
              <dd className="mt-0.5 text-xl font-bold">{mmss(usedSec)}</dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-2 sm:flex sm:justify-center">
            {isGuest ? (
              <LinkButton href="/register?next=/thi-thu-hsk">
                Lưu điểm — tạo tài khoản miễn phí
                <Icon name="arrow" size={16} />
              </LinkButton>
            ) : (
              <LinkButton href="/thi-thu-hsk">
                Làm đề khác
                <Icon name="arrow" size={16} />
              </LinkButton>
            )}
            <Button variant="secondary" onClick={onRetry}>
              <Icon name="refresh" size={16} /> Làm lại đề này
            </Button>
            <LinkButton href={isGuest ? `/bat-dau?level=${paper.level}` : `/learn?level=${paper.level}`} variant="ghost">
              Ôn từ vựng HSK {levelLabel}
            </LinkButton>
          </div>
          <div className="mt-4 flex justify-center">
            <ShareButton
              title="Đề thi thử HSK — Hanni"
              text={`Mình vừa được ${result.score}/${result.maxScore} điểm đề thi thử ${paper.title} trên Hanni. Thử sức xem bạn được bao nhiêu điểm nhé:`}
              path={`/thi-thu-hsk/${paper.slug}`}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">Chữa bài</h2>
            <div className="flex gap-2">
              {(
                [
                  ["wrong", `Câu sai (${wrong})`],
                  ["all", `Tất cả (${result.review.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    filter === k ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinyin(!pinyin)}
                aria-pressed={pinyin}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  pinyin ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface text-muted"
                }`}
              >
                Pinyin
              </button>
            </div>
          </div>
          {wrong === 0 && filter === "wrong" && (
            <p className="rounded-3xl border border-border bg-surface p-6 text-center text-sm text-muted">
              Không sai câu nào — xuất sắc! Chọn &quot;Tất cả&quot; để xem lại lời thoại và bản dịch.
            </p>
          )}
          {paper.sections.map((section) =>
            section.parts.map((part, pi) => {
              const items = part.items.filter((it) => shown(review.get(it.no)));
              if (items.length === 0) return null;
              const labels = review.get(part.items[0].no)?.pictureLabels;
              return (
                <div key={part.no} className="space-y-3">
                  <p className="text-sm font-bold">
                    {SECTION_VI[section.kind].vi} ·{" "}
                    <span lang="zh" className="hanzi">
                      {PART_ZH[pi]}
                    </span>
                  </p>
                  {(part.type === "match-picture" || part.type === "match-text" || part.type === "fill-blank") && (
                    <SharedBoard part={part} pinyin={pinyin} labels={part.type === "match-picture" ? labels : undefined} />
                  )}
                  {items.map((item) => (
                    <ExamItem
                      key={item.no}
                      part={part}
                      item={item}
                      section={section.kind}
                      given={answers[item.no - 1] ?? null}
                      review={review.get(item.no)}
                      pinyin={pinyin}
                    />
                  ))}
                </div>
              );
            }),
          )}
        </section>
      </main>
    </div>
  );
}
