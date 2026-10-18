"use client";

import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { JumpToLatest, useStickToBottom } from "@/components/chat/use-stick-to-bottom";
import { Icon } from "@/components/icon";
import { MarkdownLite } from "@/components/markdown-lite";
import { NextStep } from "@/components/next-step";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { speakChinese, stopListening } from "@/lib/listening-audio";
import {
  deleteRoleplaySession,
  feedbackRoleplay,
  hintRoleplay,
  replyRoleplay,
  startRoleplaySession,
  useRoleplayMessages,
  useRoleplayScenarios,
  useRoleplaySessions,
} from "@/lib/roleplay";
import { recognizerCtor, useCanRecognize, type Recognizer } from "@/lib/speech";
import type { RoleplayMessage } from "@/lib/types";

const SPEAK_KEY = "hanni:roleplay-speak";

const ROLEPLAY_TOUR_STEPS: TourStep[] = [
  {
    icon: "message",
    title: "AI đóng vai, không dạy ngữ pháp",
    description:
      "Chọn một tình huống, AI sẽ giữ đúng vai đó và chỉ nói tiếng Trung — giống nói chuyện thật. Mỗi câu của AI đều có pinyin ngay bên dưới.",
  },
  {
    icon: "mic",
    title: "Nói bằng giọng, nghe bằng tai",
    description:
      "Bấm micro rồi nói tiếng Trung — Hanni ghi lại câu bạn nói và gửi luôn, AI đọc to câu trả lời. Thấy chữ ghi lại khác ý mình là dấu hiệu phát âm cần sửa. (Micro chạy trên Chrome, Edge, Safari.)",
  },
  {
    icon: "spark",
    title: 'Bí thì bấm "Gợi ý"',
    description:
      'Nút gợi ý cạnh ô nhập đưa ra một câu bạn có thể nói tiếp kèm nghĩa tiếng Việt. Bấm "Dùng câu này" để điền vào ô nhập rồi tự sửa trước khi gửi.',
  },
  {
    icon: "info",
    title: "Muốn hỏi-đáp thì dùng trợ lý",
    description:
      "Trang này để luyện phản xạ. Cần giải thích ngữ pháp hay hỏi cách dùng từ thì mở bong bóng trợ lý Hanni ở góc màn hình.",
  },
];

export default function RoleplayPage() {
  const { user, loading } = useRequireAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <FeatureTour tourKey="roleplay" steps={ROLEPLAY_TOUR_STEPS} />
      {/* Đang trong buổi luyện trên điện thoại: ẩn khối tiêu đề để khung chat và ô soạn
       * vừa màn hình (trước đó ô soạn nằm dưới mép, bị thanh tab che). */}
      <div className={activeSessionId ? "max-md:hidden" : undefined}>
        <PageHeading
          icon="message"
          tone="accent"
          eyebrow="Luyện phản xạ"
          title="Luyện nói với AI"
          description="Chọn 1 tình huống đời thường, AI đóng vai để bạn luyện phản xạ tiếng Trung — không giải thích ngữ pháp giữa chừng, đúng như hội thoại thật."
        >
          <TourButton tourKey="roleplay" />
        </PageHeading>
      </div>
      {activeSessionId ? (
        <ChatView
          sessionId={activeSessionId}
          onExit={() => setActiveSessionId(null)}
        />
      ) : (
        <ScenarioPicker onStart={setActiveSessionId} />
      )}
    </div>
  );
}

function ScenarioPicker({ onStart }: { onStart: (sessionId: string) => void }) {
  const scenarios = useRoleplayScenarios();
  const sessions = useRoleplaySessions();
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function start(scenarioKey: string) {
    if (startingKey) return;
    setStartingKey(scenarioKey);
    setError("");
    try {
      const res = await startRoleplaySession(scenarioKey);
      onStart(res.sessionId);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa bắt đầu được, thử lại nhé.",
      );
    } finally {
      setStartingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.data?.map((s) => (
          <Card key={s.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="icon-tile bg-accent/10 text-accent">
                <Icon name="message" size={18} />
              </span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">
                HSK{s.hskLevel}+
              </span>
            </div>
            <div>
              <h2 className="font-semibold">{s.titleVi}</h2>
              <p className="mt-1 text-xs text-muted">
                AI đóng vai: {s.persona}
              </p>
            </div>
            <Button
              variant="secondary"
              className="mt-auto"
              disabled={startingKey !== null}
              onClick={() => void start(s.key)}
            >
              {startingKey === s.key ? "Đang bắt đầu…" : "Bắt đầu luyện"}
            </Button>
          </Card>
        ))}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      {!!sessions.data?.length && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted">
            Cuộc hội thoại gần đây
          </h2>
          <div className="space-y-2">
            {sessions.data.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStart(s.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:border-primary/40"
              >
                <span className="icon-tile bg-surface-2 text-muted">
                  <Icon name="message" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.titleVi}</p>
                  <p className="truncate text-xs text-muted">
                    {s.lastMessage ?? "Chưa có tin nhắn"}
                  </p>
                </div>
                <Icon name="arrow" size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trang này trước đó KHÔNG dẫn đi đâu — luyện nói xong là cụt đường.
       * Bước tiếp theo tự nhiên: luyện phát âm chuẩn, hoặc ôn lại từ vựng. */}
      <NextStep
        title="Luyện nói xong, củng cố thêm nhé"
        description="Phản xạ hội thoại tốt nhất khi phát âm chuẩn và vốn từ đủ dùng."
        actions={[
          {
            href: "/pronunciation",
            label: "Luyện phát âm",
            icon: "mic" as const,
          },
          { href: "/study", label: "Ôn tập flashcard", icon: "cards" as const },
        ]}
      />
    </div>
  );
}

function ChatView({
  sessionId,
  onExit,
}: {
  sessionId: string;
  onExit: () => void;
}) {
  const { data: messages, mutate } = useRoleplayMessages(sessionId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hinting, setHinting] = useState(false);
  const [hint, setHint] = useState<{
    suggestionZh: string;
    meaningVi: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canRecognize = useCanRecognize();
  const [listening, setListening] = useState(false);
  const recognizer = useRef<Recognizer | null>(null);
  // Mặc định đọc to câu trả lời — luyện nói mà chỉ đọc chữ thì mất nửa bài tập nghe.
  const [speakOn, setSpeakOn] = useState(() => {
    try {
      return localStorage.getItem(SPEAK_KEY) !== "0";
    } catch {
      return true;
    }
  });

  useEffect(
    () => () => {
      recognizer.current?.abort();
      stopListening();
    },
    [],
  );

  function toggleSpeak() {
    const next = !speakOn;
    setSpeakOn(next);
    if (!next) stopListening();
    try {
      localStorage.setItem(SPEAK_KEY, next ? "1" : "0");
    } catch {
      /* chỉ là tuỳ chọn hiển thị */
    }
  }

  /** Nói bằng giọng: chữ hiện dần trong ô nhập, nói xong (trình duyệt tự nhận
   * ra lúc dừng nói) thì gửi luôn — hội thoại rảnh tay như gọi điện. */
  function listen() {
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const Ctor = recognizerCtor();
    if (!Ctor) return;
    stopListening(); // đang đọc câu AI thì dừng, kẻo micro thu lại giọng máy
    const r = new Ctor();
    r.lang = "zh-CN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let finalText = "";
    r.onresult = (e) => {
      let text = "";
      let done = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
        if (e.results[i].isFinal) done = true;
      }
      setInput(text);
      if (done) finalText = text;
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setError("Trình duyệt chưa cho dùng micro — bật quyền micro cho trang này rồi thử lại.");
      else if (e.error === "no-speech") setError("Chưa nghe thấy gì — nói to, rõ hơn một chút nhé.");
    };
    r.onend = () => {
      setListening(false);
      recognizer.current = null;
      if (finalText.trim()) void send(finalText);
    };
    recognizer.current = r;
    setError("");
    setHint(null);
    setListening(true);
    r.start();
  }

  // Đang ở cuối thì tự cuộn theo lượt mới, đang đọc lại lượt cũ thì hiện nút "Xuống tin mới".
  const stick = useStickToBottom(scrollRef, {
    lastItemKey: messages?.at(-1)?.id,
    lastIsMine: messages?.at(-1)?.role === "USER",
  });

  async function getHint() {
    if (hinting) return;
    setHinting(true);
    setError("");
    try {
      const res = await hintRoleplay(sessionId);
      setHint(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Chưa gợi ý được, thử lại nhé.",
      );
    } finally {
      setHinting(false);
    }
  }

  function useHint() {
    if (!hint) return;
    setInput(hint.suggestionZh);
    setHint(null);
  }

  async function send(spoken?: string) {
    const text = (spoken ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setInput("");
    setHint(null);
    const optimistic: RoleplayMessage = {
      id: `optimistic-${Date.now()}`,
      role: "USER",
      text,
      pinyin: null,
      createdAt: new Date().toISOString(),
    };
    await mutate([...(messages ?? []), optimistic], { revalidate: false });
    try {
      const reply = await replyRoleplay(sessionId, text);
      await mutate([...(messages ?? []), optimistic, reply], {
        revalidate: false,
      });
      if (speakOn) void speakChinese(reply.text);
    } catch (err) {
      setInput(text);
      await mutate(messages, { revalidate: false });
      setError(
        err instanceof ApiError ? err.message : "Chưa gửi được, thử lại nhé.",
      );
    } finally {
      setSending(false);
    }
  }

  /** Kết thúc = XIN NHẬN XÉT trước, chưa xoá gì. Trước đó bấm "Kết thúc" là
   * hội thoại biến mất ngay, luyện xong không biết mình sai chỗ nào —
   * `/listening` và `/pronunciation` đều đã có phần "kết quả buổi luyện". */
  async function endSession() {
    if (ending) return;
    setEnding(true);
    setError("");
    try {
      const res = await feedbackRoleplay(sessionId);
      setFeedback(res.feedbackVi);
    } catch (err) {
      // Không chặn đường thoát chỉ vì AI bận: bỏ qua nhận xét, đóng luôn.
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa lấy được nhận xét, nhưng bạn vẫn kết thúc được buổi luyện.",
      );
      setFeedback("");
    } finally {
      setEnding(false);
    }
  }

  /** Đóng hẳn: xoá hội thoại rồi về màn chọn tình huống. */
  async function closeSession() {
    try {
      await deleteRoleplaySession(sessionId);
    } catch {
      /* xoá được hay không cũng thoát về màn chọn tình huống */
    } finally {
      onExit();
    }
  }

  return (
    <Card className="flex h-[70vh] flex-col p-0 max-md:h-[calc(100dvh_-_var(--bottom-nav-h,0px)_-_6.5rem)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted hover:text-foreground"
        >
          <Icon name="back" size={16} />
          <span className="max-sm:hidden">Chọn tình huống khác</span>
          <span className="sm:hidden">Tình huống</span>
        </button>
        {feedback === null && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSpeak}
              aria-pressed={speakOn}
              aria-label={speakOn ? "Đọc to: bật" : "Đọc to: tắt"}
              title={speakOn ? "Tắt đọc to câu trả lời" : "Bật đọc to câu trả lời"}
              className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-xs font-semibold transition-colors ${
                speakOn ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2"
              }`}
            >
              <Icon name="sound" size={15} />
              <span className="max-sm:hidden">{speakOn ? "Đọc to: bật" : "Đọc to: tắt"}</span>
            </button>
            <Button
              variant="ghost"
              className="whitespace-nowrap"
              disabled={ending}
              onClick={() => void endSession()}
            >
              <Icon name="check" size={15} />
              {ending ? "Đang tổng kết…" : "Kết thúc"}
            </Button>
          </div>
        )}
      </div>

      {feedback !== null ? (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-lg space-y-4 text-center">
            <span className="icon-tile mx-auto flex h-14 w-14 items-center justify-center text-good">
              <Icon name="check" size={26} />
            </span>
            <h3 className="text-lg font-bold">Xong buổi luyện!</h3>
            {feedback ? (
              <div className="rounded-2xl border border-border bg-surface-2 p-4 text-left text-sm leading-6">
                <MarkdownLite text={feedback} />
              </div>
            ) : (
              <p className="text-sm text-muted">
                Lần này chưa lấy được nhận xét từ trợ lý. Bạn vẫn giữ nguyên
                phần luyện tập vừa rồi nhé.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button onClick={() => void closeSession()}>
                Đóng buổi luyện
                <Icon name="arrow" size={16} />
              </Button>
              {/* Chưa xoá gì cho tới khi bấm "Đóng" — đọc nhận xét xong vẫn
               * quay lại nói tiếp được. */}
              <Button variant="secondary" onClick={() => setFeedback(null)}>
                Nói tiếp
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {!messages ? (
              <Spinner />
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] space-y-1 rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                      m.role === "USER"
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-2"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.pinyin && (
                      <p
                        className={`text-xs ${m.role === "USER" ? "text-primary-fg/75" : "text-muted"}`}
                      >
                        {m.pinyin}
                      </p>
                    )}
                    {m.role !== "USER" && (
                      <button
                        type="button"
                        onClick={() => void speakChinese(m.text)}
                        className="inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-muted hover:text-primary"
                      >
                        <Icon name="sound" size={13} /> Nghe
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {!stick.atBottom && <JumpToLatest unseen={stick.unseen} onClick={() => stick.scrollToBottom(true)} />}
          </div>

          {hint && (
            <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 px-3.5 py-2.5">
              <Icon
                name="spark"
                size={16}
                className="mt-0.5 shrink-0 text-accent"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{hint.suggestionZh}</p>
                {hint.meaningVi && (
                  <p className="mt-0.5 text-xs text-muted">{hint.meaningVi}</p>
                )}
              </div>
              <button
                type="button"
                onClick={useHint}
                className="shrink-0 text-xs font-semibold text-accent hover:underline"
              >
                Dùng câu này
              </button>
              <button
                type="button"
                onClick={() => setHint(null)}
                aria-label="Đóng gợi ý"
                className="shrink-0 text-muted hover:text-foreground"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {error && (
            <div className="px-4 pb-2">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          {/* Server nhận tối đa 1.000 ký tự mỗi lượt (MaxLength ở roleplay.dto.ts). */}
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={() => void send()}
            maxLength={1000}
            placeholder={listening ? "Đang nghe…" : canRecognize ? "Gõ hoặc nói…" : "Nhập tiếng Trung…"}
            busy={sending || listening}
            before={
              <button
                type="button"
                onClick={() => void getHint()}
                disabled={hinting || sending}
                title="Gợi ý câu trả lời"
                aria-label="Gợi ý câu trả lời"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent disabled:opacity-50"
              >
                <Icon name="spark" size={18} />
              </button>
            }
            after={
              canRecognize ? (
                <button
                  type="button"
                  onClick={listen}
                  disabled={sending}
                  aria-pressed={listening}
                  aria-label={listening ? "Dừng nghe" : "Nói bằng giọng"}
                  title={listening ? "Dừng nghe" : "Nói bằng giọng"}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50 ${
                    listening ? "animate-pulse bg-primary text-primary-fg" : "bg-surface-2 text-primary"
                  }`}
                >
                  <Icon name="mic" size={18} />
                </button>
              ) : undefined
            }
          />
        </>
      )}
    </Card>
  );
}
