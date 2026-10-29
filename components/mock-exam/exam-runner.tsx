"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Icon } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { Overlay } from "@/components/overlay";
import { ShareButton } from "@/components/share-button";
import { StudyLoader } from "@/components/study-loader";
import { signalInstallMoment } from "@/components/pwa/install-prompt";
import { Button, LinkButton } from "@/components/ui";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { confetti } from "@/lib/confetti";
import { addWordToSrs } from "@/lib/hooks";
import { hasChineseVoice, playListening, stopListening } from "@/lib/listening-audio";
import {
  assistantPrompt,
  clearSaved,
  isRightAnswer,
  officialIndexes,
  partInfo,
  partScores,
  practiceHref,
  readSaved,
  SECTION_VI,
  weakest,
  writeSaved,
  type SavedExam,
} from "@/lib/mock-exam";
import { savePendingExam } from "@/lib/pending-lessons";
import { savePendingWords } from "@/lib/pending-words";
import type {
  MockAnswer,
  MockExamResult,
  MockPaper,
  MockPart,
  MockReviewItem,
  MockSectionKind,
  MockWord,
} from "@/lib/types";
import { AssistantWidget, askAssistant } from "@/components/assistant-widget";
import { ExamItem, LETTERS, SharedBoard } from "./exam-items";
const PART_ZH = ["第一部分", "第二部分", "第三部分", "第四部分"];

/** Hướng dẫn từng dạng câu — đề thật in bằng tiếng Trung kèm ví dụ, ở đây nói
 * thẳng bằng tiếng Việt để người mới khỏi đoán. Bộ phương án dùng chung có
 * thể là A–F thừa 1 (như đề thật) hoặc A–E vừa đủ (HSK 2 câu 16–20, 56–60). */
function instruction(section: MockSectionKind, part: MockPart): string {
  const listen = section === "listening";
  const board = part.pictures ?? part.options ?? [];
  const range = `A–${LETTERS[Math.max(0, board.length - 1)]}`;
  const spare = board.length > part.items.length;
  switch (part.type) {
    case "judge":
      return listen
        ? "Nghe rồi xem tranh: khớp với tranh chọn ✓, không khớp chọn ✗."
        : "Đọc từ bên cạnh tranh: khớp với tranh chọn ✓, không khớp chọn ✗.";
    case "choose-picture":
      return "Nghe 1 câu, chọn tranh đúng với câu vừa nghe.";
    case "match-picture":
      return `${listen ? "Nghe đoạn hội thoại" : "Đọc câu"}, chọn tranh ${range} phù hợp. Mỗi tranh dùng 1 lần${spare ? ", thừa 1 tranh" : ""}.`;
    case "choose-text":
      return listen
        ? "Nghe câu và câu hỏi (问), chọn đáp án đúng."
        : "Đọc đoạn văn rồi trả lời câu hỏi có dấu ★, chọn đáp án đúng.";
    case "match-text":
      return `Chọn câu trả lời ${range} phù hợp với mỗi câu hỏi. Mỗi câu trả lời dùng 1 lần${spare ? ", thừa 1 câu" : ""}.`;
    case "fill-blank":
      return `Chọn từ ${range} điền vào chỗ trống. Mỗi từ dùng 1 lần${spare ? ", thừa 1 từ" : ""}.`;
    case "judge-text":
      return listen
        ? "Nghe một đoạn văn rồi xét câu có dấu ★ in trên đề: đúng với điều vừa nghe chọn ✓, sai chọn ✗."
        : "Đọc đoạn văn rồi xét câu có dấu ★: đúng với đoạn văn chọn ✓, sai chọn ✗.";
    case "order":
      return section === "reading"
        ? "Bấm lần lượt 3 câu để sắp thành đoạn văn đúng thứ tự; bấm vào câu đã xếp để bỏ ra."
        : "Bấm lần lượt các từ để sắp thành câu đúng; bấm vào từ đã xếp để bỏ ra.";
    case "pinyin-char":
      return "Nhìn pinyin, chọn chữ Hán đúng cho chỗ trống — như thi trên máy: gõ pinyin rồi chọn chữ trong danh sách.";
    case "write-sentence":
      return "Nhìn tranh, dùng từ cho sẵn viết 1 câu — gõ bằng bàn phím tiếng Trung hoặc bấm “Viết tay”.";
  }
}

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

/**
 * LUỒNG PHÒNG THI (/thi-thu-hsk/[slug]): GET /mock-exams/:slug lấy đề KHÔNG kèm đáp án → màn giới thiệu → "Bắt đầu"
 * bật đồng hồ (durationMin của đề) → mỗi lần chọn đáp án lưu bài làm dở vào localStorage (tải lại trang vẫn "Làm
 * tiếp") → bấm Nộp bài hoặc hết giờ → POST /mock-exams/:slug/submit { answers, durationSec } → server chấm
 * (hanni-server mock-exam.content.ts scorePaper) → màn kết quả: điểm từng phần, bảng đáp án, chữa bài, luyện lại câu
 * sai, lưu từ sai vào ôn tập. Phần nghe đọc bằng giọng tiếng Trung của trình duyệt (lib/listening-audio.ts).
 */
export function MockExamRunner({ slug }: { slug: string }) {
  const { user } = useAuth();
  const router = useRouter();
  // API → GET /mock-exams/:slug · server: modules/mock-exams/mock-exams.controller.ts → MockExamsService.paper()
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
    (resume: SavedExam | null) => {
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
    if (phase === "test") writeSaved(slug, { answers, flags, startedAt });
  }, [phase, answers, flags, startedAt, slug]);

  const submit = useCallback(async () => {
    if (!paper || busy) return;
    setBusy(true);
    setSubmitError(false);
    stopListening();
    const durationSec = Math.min(paper.durationMin * 60, Math.round((Date.now() - startedAt) / 1000));
    try {
      // API → POST /mock-exams/:slug/submit · server: modules/mock-exams/mock-exams.controller.ts → MockExamsService.submit()
      const r = await api.post<MockExamResult>(`/mock-exams/${slug}/submit`, { answers, durationSec });
      if (!user) savePendingExam({ slug, answers, durationSec });
      clearSaved(slug);
      setSavedVersion((v) => v + 1);
      setUsedSec(durationSec);
      setResult(r);
      setConfirm(null);
      setPhase("result");
      // Danh sách đề (điểm cao nhất), lịch sử và phân tích điểm mạnh/yếu.
      void mutate((key) => typeof key === "string" && key.startsWith("/mock-exams"));
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

  const setAnswer = (no: number, v: MockAnswer | null) =>
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
        <Link href="/thi-thu-hsk" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary hover:underline">
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
            aria-label="Thoát bài thi"
            className="flex h-10 items-center gap-1 rounded-xl px-2 text-sm text-muted hover:bg-surface-2"
          >
            <Icon name="back" size={18} />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{paper.title}</p>
            <p className="text-xs text-muted">
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
                        {PART_ZH[officialIndexes(section.parts)[pi]]}
                      </span>
                      Câu {part.no}–{part.no + part.items.length - 1}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{instruction(section.kind, part)}</p>
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
          <div className="rounded-2xl border border-border bg-surface p-5 text-center">
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
        <Overlay>
          <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden" onClick={() => setNavOpen(false)}>
            <div
              className="max-h-[75dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigator paper={paper} answers={answers} flags={flags} onJump={jump} />
            </div>
          </div>
        </Overlay>
      )}

      {confirm && (
        <Overlay>
          <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-2xl">
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
        </Overlay>
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
    <div className="rounded-2xl border border-border bg-surface p-4">
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
      <div className="mt-4 space-y-1.5 text-xs text-muted">
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
  saved: SavedExam | null;
  onStart: (resume: SavedExam | null) => void;
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
          <Link href="/thi-thu-hsk" className="flex min-h-8 items-center gap-1 text-sm text-muted hover:text-foreground">
            <Icon name="back" size={18} /> Danh sách đề
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-xs font-bold tracking-wider text-primary">ĐỀ THI THỬ · ĐÚNG CẤU TRÚC ĐỀ THẬT</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{paper.title}</h1>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Số câu", v: `${paper.questionCount} câu` },
              { k: "Thời gian", v: `${paper.durationMin} phút` },
              { k: "Tổng điểm", v: `${paper.maxScore}` },
              { k: "Điểm đạt", v: `${paper.passScore}` },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-surface-2 px-3 py-3">
                <dt className="text-xs text-muted">{s.k}</dt>
                <dd className="mt-0.5 text-lg font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-5 space-y-2 text-sm leading-6">
            {paper.sections.map((s) => (
              <li key={s.kind} className="flex gap-2">
                <Icon
                  name={s.kind === "listening" ? "headphones" : s.kind === "writing" ? "pencil" : "book"}
                  size={18}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <span>
                  <strong>
                    {SECTION_VI[s.kind].vi} ({SECTION_VI[s.kind].zh})
                  </strong>{" "}
                  — {s.parts.filter((p) => !p.continues).length} phần, {s.parts.reduce((n, p) => n + p.items.length, 0)} câu, tối đa 100 điểm.
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

          {/* Điện thoại: nút trên, lời nhắc dưới — để cùng hàng `flex-wrap` thì
           * lời nhắc `flex-1` bị bóp còn ~60px ở màn 360px. */}
          <div className="mt-5 flex flex-col items-start gap-2 rounded-2xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <Button variant="secondary" onClick={testAudio} disabled={voice === "checking"} className="h-9 shrink-0 px-3! text-sm">
              <Icon name="sound" size={16} />
              Kiểm tra âm thanh
            </Button>
            <p className="min-w-0 text-xs text-muted sm:flex-1">
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

const SECTION_SHORT: Record<MockSectionKind, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết" };
/** Từ thêm vào ôn tập là đến hạn ôn NGAY — lưu cả đống một lúc thì hàng ôn
 * ngợp (thử làm bừa 1 đề HSK 1: 89 từ ở câu sai). Mỗi lần lưu tối đa 20. */
const SAVE_MAX = 20;

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
  useEffect(() => signalInstallMoment(), []);
  useEffect(() => {
    if (result.passed) confetti();
  }, [result.passed]);
  const [filter, setFilter] = useState<"all" | "wrong">("wrong");
  const [mode, setMode] = useState<"review" | "practice">("review");
  const [practice, setPractice] = useState<Record<number, MockAnswer>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const review = useMemo(() => new Map(result.review.map((r) => [r.no, r])), [result]);
  const wrongItems = useMemo(() => result.review.filter((r) => !r.correct), [result]);
  const wrong = wrongItems.length;
  const parts = useMemo(() => partScores(paper, review), [paper, review]);
  const weak = weakest(parts);
  // Từ ở các câu sai (không trùng, theo thứ tự câu) — "sai ở đâu ôn từ đó" bằng 1 nút.
  const allWrongWords = useMemo(() => {
    const byId = new Map<string, MockWord>();
    for (const r of wrongItems) for (const w of r.words ?? []) byId.set(w.id, w);
    return [...byId.values()];
  }, [wrongItems]);
  const wrongWords = allWrongWords.slice(0, SAVE_MAX);
  const pct = Math.round((result.score / result.maxScore) * 100);
  const levelLabel = paper.level === 7 ? "7–9" : String(paper.level);
  const shown = (r: MockReviewItem | undefined) => filter === "all" || (r && !r.correct);
  const practiceDone = Object.keys(practice).length;
  const practiceRight = wrongItems.filter((r) => isRightAnswer(r, practice[r.no] ?? null)).length;

  /** Câu hỏi gửi trợ lý AI cho 1 câu đã chữa: nội dung câu, đáp án đúng và
   * đáp án mình chọn — trợ lý trả lời đúng chỗ vướng, không phải hỏi lại. */
  function askAbout(no: number, picked: MockAnswer | null) {
    for (const section of paper.sections)
      for (const [pi, part] of section.parts.entries()) {
        const item = part.items.find((it) => it.no === no);
        const r = review.get(no);
        if (!item || !r) continue;
        askAssistant(
          assistantPrompt({
            title: paper.title,
            section: section.kind,
            officialPart: officialIndexes(section.parts)[pi] + 1,
            part,
            item,
            review: r,
            picked,
          }),
        );
        return;
      }
  }

  function jumpTo(no: number) {
    if (filter === "wrong" && review.get(no)?.correct) setFilter("all");
    setMode("review");
    setTimeout(() => document.getElementById(`q-${no}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  function startPractice() {
    setPractice({});
    setMode("practice");
    setTimeout(() => document.getElementById("chua-bai")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  async function saveWords() {
    setSaveState("saving");
    await Promise.allSettled(wrongWords.map((w) => addWordToSrs(w.id)));
    setSaveState("saved");
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/thi-thu-hsk" className="flex min-h-8 items-center gap-1 text-sm text-muted hover:text-foreground">
            <Icon name="back" size={18} /> Danh sách đề
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
          <Mascot
            emote={result.passed ? "e04-vui-mung" : "e05-co-len"}
            size={136}
            alt={result.passed ? "Cáo Hanni vỗ tay chúc mừng" : "Cáo Hanni cổ vũ bạn"}
            priority
            className="mascot-pop mx-auto"
          />
          <p className="mt-3 text-xs font-bold tracking-wider text-primary">KẾT QUẢ · {paper.title.toUpperCase()}</p>
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
                ? "Đã qua mốc đạt. Xem phần nào còn yếu bên dưới để kéo điểm lên cao hơn."
                : "Chưa sao — xem phần nào đang yếu, luyện lại các câu sai rồi làm lại, điểm sẽ lên nhanh."}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {result.sections.map((s) => (
              <div key={s.kind} className="rounded-2xl bg-surface-2 px-3 py-3">
                <dt className="text-xs text-muted">
                  {SECTION_VI[s.kind].vi} · đúng {s.correct}/{s.total}
                </dt>
                <dd className="mt-0.5 text-xl font-bold">{s.score}/100</dd>
              </div>
            ))}
            <div className="col-span-2 rounded-2xl bg-surface-2 px-3 py-3 sm:col-span-1">
              <dt className="text-xs text-muted">Thời gian làm</dt>
              <dd className="mt-0.5 text-xl font-bold">{mmss(usedSec)}</dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:justify-center">
            {isGuest ? (
              <LinkButton
                href="/register?next=/thi-thu-hsk"
                onClick={() => wrongWords.length > 0 && savePendingWords(wrongWords.map((w) => w.id))}
              >
                {wrongWords.length > 0
                  ? `Lưu điểm + ${wrongWords.length} từ ở câu sai — tạo tài khoản`
                  : "Lưu điểm — tạo tài khoản miễn phí"}
                <Icon name="arrow" size={16} />
              </LinkButton>
            ) : (
              <LinkButton href="/thi-thu-hsk">
                Làm đề khác
                <Icon name="arrow" size={16} />
              </LinkButton>
            )}
            {wrong > 0 && (
              <Button variant="secondary" onClick={startPractice}>
                <Icon name="target" size={16} /> Luyện lại {wrong} câu sai
              </Button>
            )}
            <Button variant="ghost" onClick={onRetry}>
              <Icon name="refresh" size={16} /> Làm lại cả đề
            </Button>
          </div>
          <div className="mt-4 flex justify-center">
            <ShareButton
              title="Đề thi thử HSK — Hanni"
              text={`Mình vừa được ${result.score}/${result.maxScore} điểm đề thi thử ${paper.title} trên Hanni. Thử sức xem bạn được bao nhiêu điểm nhé:`}
              path={`/thi-thu-hsk/${paper.slug}`}
            />
          </div>
        </section>

        {/* Bảng đáp án: nhìn 1 lượt câu nào đúng/sai, bấm số để tới câu đó. */}
        <section aria-labelledby="answer-grid" className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="answer-grid" className="font-bold">Bảng đáp án</h2>
            <p className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-good" /> Đúng</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Sai</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted/30" /> Bỏ trống</span>
            </p>
          </div>
          {paper.sections.map((s) => (
            <div key={s.kind} className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-muted">{SECTION_VI[s.kind].vi}</p>
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {s.parts.flatMap((p) => p.items).map((it) => {
                  const r = review.get(it.no);
                  const tone = r?.correct
                    ? "bg-good/15 text-good"
                    : r?.given === null || r?.given === undefined
                      ? "bg-surface-2 text-muted"
                      : "bg-danger/12 text-danger";
                  return (
                    <button
                      key={it.no}
                      type="button"
                      onClick={() => jumpTo(it.no)}
                      aria-label={`Câu ${it.no}: ${r?.correct ? "đúng" : r?.given === null ? "bỏ trống" : "sai"}`}
                      className={`h-8 rounded-lg text-xs font-bold tabular-nums sm:h-9 ${tone}`}
                    >
                      {it.no}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="part-analysis" className="rounded-2xl border border-border bg-surface p-5">
          <h2 id="part-analysis" className="font-bold">Phân tích từng phần</h2>
          <ul className="mt-3 space-y-3">
            {parts.map((p) => {
              const ratio = p.correct / Math.max(1, p.total);
              return (
                <li key={`${p.section}-${p.part}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="font-semibold">
                        {SECTION_SHORT[p.section]} {p.part}
                      </span>
                      <span className="text-muted"> · {partInfo(p.section, p.type).label}</span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">
                      {p.correct}/{p.total}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full rounded-full ${ratio >= 0.8 ? "bg-good" : ratio >= 0.6 ? "bg-warn" : "bg-danger"}`}
                      style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {weak.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-bold">Nên luyện thêm</p>
              {weak.map((p) => {
                const info = partInfo(p.section, p.type);
                return (
                  <div key={`${p.section}-${p.part}`} className="rounded-2xl border border-warn/30 bg-warn/8 p-3 text-sm">
                    <p className="font-semibold">
                      {SECTION_SHORT[p.section]} {p.part} · {info.label} — đúng {p.correct}/{p.total}
                    </p>
                    <p className="mt-1 leading-6 text-muted">{info.tip}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      {/* Luyện đúng dạng câu này, gom từ mọi đề cùng cấp — khách làm được. */}
                      <Link
                        href={practiceHref(paper.level, p.section, p.part)}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        Luyện riêng dạng này <Icon name="arrow" size={14} />
                      </Link>
                      {!isGuest && (
                        <Link href={info.href} className="inline-flex items-center gap-1 font-semibold text-muted hover:text-primary">
                          {info.cta} <Icon name="arrow" size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-good">Phần nào cũng đúng từ 80% trở lên — đều tay!</p>
          )}
        </section>

        <section id="chua-bai" className="scroll-mt-4 space-y-4">
          {mode === "practice" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight">Luyện lại câu sai</h2>
                <p className="text-sm text-muted">
                  Đã làm {practiceDone}/{wrong} · đúng {practiceRight}
                </p>
              </div>
              <p className="text-sm text-muted">Chọn lại đáp án — Hanni chấm ngay và hiện lời giải từng câu.</p>
              {paper.sections.map((section) =>
                section.parts.map((part, pi) => {
                  const items = part.items.filter((it) => !review.get(it.no)?.correct);
                  if (items.length === 0) return null;
                  return (
                    <div key={part.no} className="space-y-3">
                      <p className="text-sm font-bold">
                        {SECTION_VI[section.kind].vi} ·{" "}
                        <span lang="zh" className="hanzi">
                          {PART_ZH[officialIndexes(section.parts)[pi]]}
                        </span>
                      </p>
                      {(part.type === "match-picture" || part.type === "match-text" || part.type === "fill-blank") && (
                        <SharedBoard part={part} pinyin={pinyin} />
                      )}
                      {items.map((item) => {
                        const r = review.get(item.no)!;
                        const picked = practice[item.no];
                        const done = picked !== undefined;
                        return (
                          <ExamItem
                            key={item.no}
                            part={part}
                            item={item}
                            section={section.kind}
                            given={done ? picked : null}
                            onChange={
                              done ? undefined : (v) => v !== null && setPractice((p) => ({ ...p, [item.no]: v }))
                            }
                            review={done ? { ...r, given: picked, correct: isRightAnswer(r, picked) } : undefined}
                            pinyin={pinyin}
                            onAsk={isGuest || !done ? undefined : () => askAbout(item.no, picked)}
                          />
                        );
                      })}
                    </div>
                  );
                }),
              )}
              <div className="rounded-2xl border border-border bg-surface p-5 text-center">
                {practiceDone === wrong ? (
                  <p className="font-bold">
                    Lần này đúng {practiceRight}/{wrong} câu{practiceRight === wrong ? " — sửa được hết rồi!" : "."}
                  </p>
                ) : (
                  <p className="text-sm text-muted">Còn {wrong - practiceDone} câu chưa làm lại.</p>
                )}
                <div className="mt-3 grid gap-2 sm:flex sm:justify-center">
                  <Button variant="secondary" onClick={() => setMode("review")}>
                    Xem chữa bài
                  </Button>
                  <Button variant="ghost" onClick={onRetry}>
                    <Icon name="refresh" size={16} /> Làm lại cả đề
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight">Chữa bài</h2>
                <div className="flex flex-wrap gap-2">
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
                        filter === k ? "chip-on" : "border-border bg-surface"
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
              {!isGuest && wrongWords.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center">
                  <p className="flex min-w-0 items-start gap-3 sm:flex-1">
                    <Icon name="cards" size={18} className="mt-0.5 shrink-0 text-primary" />
                    <span>
                    {saveState === "saved" ? (
                      <>Đã thêm {wrongWords.length} từ vào Ôn tập — Hanni sẽ nhắc đúng lúc bạn sắp quên.</>
                    ) : (
                      <>
                        <strong>{wrongWords.length} từ</strong>
                        {allWrongWords.length > SAVE_MAX ? ` (trong ${allWrongWords.length})` : ""} ở các câu sai. Lưu
                        để ôn, lần sau gặp là nhận ra.
                      </>
                    )}
                    </span>
                  </p>
                  {saveState === "saved" ? (
                    <Link href="/study" className="font-semibold text-primary hover:underline">
                      Ôn ngay
                    </Link>
                  ) : (
                    <Button onClick={saveWords} disabled={saveState === "saving"} className="h-9 shrink-0 px-4! text-sm">
                      {saveState === "saving" ? "Đang lưu…" : "Lưu vào Ôn tập"}
                    </Button>
                  )}
                </div>
              )}
              {wrong === 0 && filter === "wrong" && (
                <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
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
                          {PART_ZH[officialIndexes(section.parts)[pi]]}
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
                          onAsk={isGuest ? undefined : () => askAbout(item.no, answers[item.no - 1] ?? null)}
                        />
                      ))}
                    </div>
                  );
                }),
              )}
              <p className="text-center text-xs text-muted">
                Ôn thêm từ vựng HSK {levelLabel}:{" "}
                <Link
                  href={isGuest ? `/bat-dau?level=${paper.level}` : `/learn?level=${paper.level}`}
                  className="font-semibold text-primary hover:underline"
                >
                  học theo lộ trình
                </Link>
              </p>
            </>
          )}
        </section>
      </main>
      {/* Màn làm bài nằm ngoài khung app nên không có sẵn trợ lý — gắn riêng ở
       * màn kết quả cho người đã đăng nhập (trợ lý cần tài khoản). */}
      {!isGuest && <AssistantWidget />}
    </div>
  );
}
