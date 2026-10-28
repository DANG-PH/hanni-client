"use client";

/**
 * BẢN ĐỒ TRANG — BÀI ĐỌC AI (/bai-doc/[id]) — hội thoại dùng từ của bài, bấm từ tra nghĩa, nghe cả bài
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /ai/reading/:lessonId                    ← useLessonReading() ở lib/reading.ts (← chính trang này)
 *                                                  → server: modules/ai-tools/ai-tools.controller.ts →
 *                                                    AiToolsService.reading()
 *   POST /ai/reading/:lessonId                   ← createLessonReading() ở lib/reading.ts (← nút "Viết bài đọc" ở
 *                                                  chính trang này)
 *                                                  → server: modules/ai-tools/ai-tools.controller.ts →
 *                                                    AiToolsService.createReading()
 *   GET /assistant/ask/stream                    ← streamAssistant() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.askStream()
 *   GET /assistant/sessions                      ← useAssistantSessions() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.listSessions()
 *   POST /assistant/sessions                     ← createAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.createSession()
 *   DELETE /assistant/sessions/:sessionId        ← deleteAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.deleteSession()
 *   GET /assistant/sessions/:sessionId/messages  ← useAssistantMessages() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.getMessages()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { askAssistant } from "@/components/assistant-widget";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import { Button, ErrorNote, LinkButton, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { speakSequence, stopListening } from "@/lib/listening-audio";
import { hskLabel } from "@/lib/pos";
import { createLessonReading, splitByWords, useLessonReading, type ReadingWord } from "@/lib/reading";

/**
 * Bài đọc AI viết riêng cho 1 bài học (2026-10-19): chỉ dùng từ của bài + chữ thuộc HSK ≤ cấp bài
 * (máy chủ soát từng chữ), tạo 1 lần ai cũng đọc. Cách đọc theo Du Chinese / HelloChinese: bật tắt
 * pinyin và bản dịch, nghe từng câu hoặc cả bài, chạm từ của bài để xem nghĩa + âm Hán Việt.
 */
export default function LessonReadingPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, loading } = useAuth();
  const { data, error, isLoading } = useLessonReading(lessonId);
  // Mặc định: HSK 1–2 hiện pinyin, cấp cao ẩn (như đề HSK 3+ không in pinyin) — người học tự bật/tắt.
  const [pinyinPref, setShowPinyin] = useState<boolean | null>(null);
  const [showVi, setShowVi] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [picked, setPicked] = useState<ReadingWord | null>(null);
  const [writing, setWriting] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [noVoice, setNoVoice] = useState(false);

  useEffect(() => () => stopListening(), []);

  if (loading || isLoading) return <Spinner />;
  if (error || !data)
    return (
      <div className="page-wrap max-w-2xl! py-10!">
        <ErrorNote>Không tìm thấy bài học này.</ErrorNote>
      </div>
    );

  const { lesson, words, reading } = data;
  const showPinyin = pinyinPref ?? lesson.hskLevel <= 2;

  async function play(from: number | null) {
    if (!reading) return;
    if (playing !== null) {
      stopListening();
      setPlaying(null);
      return;
    }
    const lines = (from === null ? reading.sentences : [reading.sentences[from]]).map((s) => ({
      zh: s.zh,
      s: s.speaker === "B" ? ("M" as const) : s.speaker === "A" ? ("F" as const) : ("N" as const),
    }));
    setPlaying(from ?? 0);
    const r = await speakSequence(lines, (i) => setPlaying((from ?? 0) + i));
    if (r === "no-voice") setNoVoice(true);
    setPlaying(null);
  }

  async function write() {
    setWriting(true);
    setWriteError(null);
    try {
      await createLessonReading(lesson.id);
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "AI chưa viết được bài đọc, thử lại sau nhé.");
    } finally {
      setWriting(false);
    }
  }

  return (
    <div className="page-wrap max-w-3xl! space-y-5 py-8! sm:py-10!">
      <div>
        <Link href={`/learn/${lesson.id}`} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-muted hover:text-primary">
          <Icon name="back" size={14} /> {hskLabel(lesson.hskLevel)} · Bài {lesson.orderIndex}: {lesson.title}
        </Link>
        <p className="eyebrow mt-3">BÀI ĐỌC AI · CHỈ DÙNG TỪ {hskLabel(lesson.hskLevel).toUpperCase()}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{reading ? reading.title : `Bài đọc cho "${lesson.title}"`}</h1>
      </div>

      {!reading ? (
        <section className="panel space-y-4 p-6">
          <p className="text-sm leading-6 text-muted">
            AI viết một đoạn hội thoại ngắn dùng chính các từ của bài này, chỉ với chữ thuộc {hskLabel(lesson.hskLevel)} — Hanni soát lại
            từng chữ trước khi lưu. Bài đọc tạo một lần, ai học bài này cũng đọc được.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {words.map((w) => (
              <span key={w.id} className="rounded-lg bg-surface-2 px-2 py-1 text-sm">
                <span lang="zh" className="hanzi">
                  {w.simplified}
                </span>{" "}
                <span className="text-xs text-muted">{w.meaningVi?.split(";")[0]}</span>
              </span>
            ))}
          </div>
          {writeError && <ErrorNote>{writeError}</ErrorNote>}
          {!data.enabled ? (
            <p className="text-sm text-muted">Bài đọc AI đang tạm đóng — bạn thử lại sau nhé.</p>
          ) : user ? (
            <Button onClick={() => void write()} disabled={writing}>
              <Icon name="spark" size={16} />
              {writing ? "AI đang viết… (khoảng 10 giây)" : "Viết bài đọc cho bài này (1 lượt AI)"}
            </Button>
          ) : (
            <LinkButton href={`/login?next=${encodeURIComponent(`/bai-doc/${lesson.id}`)}`}>Đăng nhập để AI viết bài đọc</LinkButton>
          )}
        </section>
      ) : (
        <>
          <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/95 p-2 backdrop-blur">
            <Button onClick={() => void play(null)} className="min-h-10! px-3.5!">
              <Icon name={playing !== null ? "pause" : "play"} size={16} />
              {playing !== null ? "Dừng" : "Nghe cả bài"}
            </Button>
            {(
              [
                ["Pinyin", showPinyin, setShowPinyin],
                ["Dịch", showVi, setShowVi],
              ] as const
            ).map(([label, on, set]) => (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => set(!on)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${on ? "border-primary/40 bg-primary/8 text-primary" : "border-border text-muted"}`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto pr-2 text-xs text-muted">
              Dùng {reading.wordsUsed.length}/{words.length} từ của bài
            </span>
          </div>
          {noVoice && <p className="text-xs text-muted">Máy này chưa có giọng đọc tiếng Trung — vẫn đọc được bài và bấm loa từng từ.</p>}

          <ol className="space-y-3">
            {reading.sentences.map((s, i) => {
              const right = s.speaker === "B";
              return (
                <li key={i} className={`flex gap-2 ${right ? "flex-row-reverse text-right" : ""}`}>
                  {s.speaker && (
                    <span
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${right ? "bg-accent/15 text-accent" : "bg-primary/12 text-primary"}`}
                      aria-label={`Người ${s.speaker}`}
                    >
                      {s.speaker}
                    </span>
                  )}
                  <div
                    className={`min-w-0 rounded-2xl border px-4 py-3 ${playing === i ? "border-primary/50 bg-primary/5" : "border-border bg-surface"} ${s.speaker ? "max-w-[85%]" : "w-full"}`}
                  >
                    <p lang="zh" className="hanzi text-xl leading-9">
                      {splitByWords(s.zh, words).map((part, k) =>
                        part.word ? (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setPicked(part.word!)}
                            className="rounded px-0.5 font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:bg-primary/8"
                          >
                            {part.text}
                          </button>
                        ) : (
                          <span key={k}>{part.text}</span>
                        ),
                      )}
                    </p>
                    {showPinyin && <p className="mt-0.5 text-sm text-muted">{s.pinyin}</p>}
                    {showVi && <p className="mt-1 text-sm">{s.vi}</p>}
                    <div className={`mt-1.5 flex gap-3 text-xs ${right ? "justify-end" : ""}`}>
                      <button type="button" onClick={() => void play(i)} className="inline-flex items-center gap-1 font-semibold text-muted hover:text-primary">
                        <Icon name="sound" size={13} /> Nghe
                      </button>
                      {!showVi && (
                        <details className="inline">
                          <summary className="cursor-pointer list-none font-semibold text-muted hover:text-primary">Nghĩa</summary>
                          <span className="mt-1 block text-sm text-foreground">{s.vi}</span>
                        </details>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {picked && (
            <div className="fixed inset-x-3 bottom-[calc(var(--bottom-nav-h,0px)+12px)] z-40 mx-auto max-w-md rounded-2xl border border-border bg-surface p-4 shadow-xl sm:bottom-6">
              <div className="flex items-start gap-3">
                <span lang="zh" className="hanzi text-3xl">
                  {picked.simplified}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {picked.pinyin}
                    {picked.hanViet && <b className="ml-2 text-hanviet">{picked.hanViet}</b>}
                  </p>
                  <p className="text-sm text-muted">{picked.meaningVi}</p>
                </div>
                <AudioButton src={picked.audioUrl} />
                <button type="button" aria-label="Đóng" onClick={() => setPicked(null)} className="rounded-lg p-1 text-muted hover:text-foreground">
                  <Icon name="close" size={16} />
                </button>
              </div>
              <Link href={`/tu-dien/${encodeURIComponent(picked.simplified)}`} className="mt-2 inline-block text-xs font-semibold text-primary">
                Xem trong từ điển →
              </Link>
            </div>
          )}

          <section className="panel space-y-3 p-5">
            <h2 className="text-sm font-bold">Từ của bài trong bài đọc</h2>
            <div className="flex flex-wrap gap-1.5">
              {words.map((w) => {
                const used = reading.wordsUsed.includes(w.simplified);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setPicked(w)}
                    className={`rounded-lg px-2 py-1 text-sm ${used ? "bg-primary/8 text-primary" : "bg-surface-2 text-muted"}`}
                    title={used ? "Có trong bài đọc" : "Chưa có trong bài đọc"}
                  >
                    <span lang="zh" className="hanzi">
                      {w.simplified}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {user && (
                <LinkButton href={`/study?lesson=${lesson.id}`} variant="secondary">
                  <Icon name="cards" size={16} /> Ôn từ của bài
                </LinkButton>
              )}
              {user && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    askAssistant(
                      `Giải thích ngữ pháp trong bài đọc này giúp mình (HSK ${lesson.hskLevel}):\n${reading.sentences.map((s) => s.zh).join("\n")}`.slice(0, 1000),
                    )
                  }
                >
                  <Icon name="spark" size={16} /> Hỏi trợ lý về bài đọc
                </Button>
              )}
              <LinkButton href={`/learn/${lesson.id}`} variant="ghost">
                Về bài học
              </LinkButton>
            </div>
            <p className="text-xs leading-5 text-muted">Bài đọc do AI viết, Hanni đã soát chữ theo cấp; pinyin theo từ điển Hanni.</p>
          </section>
        </>
      )}
    </div>
  );
}
