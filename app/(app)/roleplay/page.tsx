"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import {
  deleteRoleplaySession,
  replyRoleplay,
  startRoleplaySession,
  useRoleplayMessages,
  useRoleplayScenarios,
  useRoleplaySessions,
} from "@/lib/roleplay";
import type { RoleplayMessage } from "@/lib/types";

export default function RoleplayPage() {
  const { user, loading } = useRequireAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        icon="message"
        tone="accent"
        eyebrow="Luyện phản xạ"
        title="Luyện nói với AI"
        description="Chọn 1 tình huống đời thường, AI đóng vai để bạn luyện phản xạ tiếng Trung — không giải thích ngữ pháp giữa chừng, đúng như hội thoại thật."
      />
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
        err instanceof ApiError ? err.message : "Chưa bắt đầu được, thử lại nhé.",
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
              <p className="mt-1 text-xs text-muted">AI đóng vai: {s.persona}</p>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    setInput("");
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

  async function endSession() {
    if (ending) return;
    setEnding(true);
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
        <Button variant="ghost" disabled={ending} onClick={() => void endSession()}>
          <Icon name="trash" size={15} />
          Kết thúc
        </Button>
      </div>

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
    </Card>
  );
}
