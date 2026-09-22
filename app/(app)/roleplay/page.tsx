"use client";

import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { MarkdownLite } from "@/components/markdown-lite";
import { NextStep } from "@/components/next-step";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
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
import type { RoleplayMessage } from "@/lib/types";

const ROLEPLAY_TOUR_STEPS: TourStep[] = [
  {
    icon: "message",
    title: "AI đóng vai, không dạy ngữ pháp",
    description:
      "Chọn một tình huống, AI sẽ giữ đúng vai đó và chỉ nói tiếng Trung — giống nói chuyện thật. Mỗi câu của AI đều có pinyin ngay bên dưới.",
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
      <PageHeading
        icon="message"
        tone="accent"
        eyebrow="Luyện phản xạ"
        title="Luyện nói với AI"
        description="Chọn 1 tình huống đời thường, AI đóng vai để bạn luyện phản xạ tiếng Trung — không giải thích ngữ pháp giữa chừng, đúng như hội thoại thật."
      >
        <TourButton tourKey="roleplay" />
      </PageHeading>
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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

  async function send() {
    const text = input.trim();
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
    <Card className="flex h-[70vh] flex-col p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <Icon name="back" size={16} /> Chọn tình huống khác
        </button>
        <Button
          variant="ghost"
          disabled={ending}
          onClick={() => void endSession()}
        >
          <Icon name="trash" size={15} />
          Kết thúc
        </Button>
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
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
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
                  </div>
                </div>
              ))
            )}
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

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <button
              type="button"
              onClick={() => void getHint()}
              disabled={hinting || sending}
              title="Gợi ý câu trả lời"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent disabled:opacity-50"
            >
              <Icon name="spark" size={18} />
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập câu trả lời bằng tiếng Trung…"
              disabled={sending}
              className="field flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Gửi"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg disabled:opacity-50"
            >
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </>
      )}
    </Card>
  );
}
