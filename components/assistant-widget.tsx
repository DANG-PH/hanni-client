"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { MarkdownLite } from "./markdown-lite";
import { useAuth } from "@/lib/auth";
import {
  createAssistantSession,
  deleteAssistantSession,
  streamAssistant,
  useAssistantMessages,
  useAssistantSessions,
} from "@/lib/hooks";
import { usePwaState } from "@/lib/pwa/store";
import { timeAgo } from "@/lib/time";
import type { AssistantMessage } from "@/lib/types";

function HanniLogo({ size }: { size: number }) {
  return (
    <Image
      src="/brand/hanni.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      sizes={`${size}px`}
    />
  );
}

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessions = useAssistantSessions(open);
  // Chưa chọn phiên nào -> tự tiếp tục cuộc trò chuyện gần nhất (nếu có),
  // giống ChatGPT/Claude khi mở lại app — tính trực tiếp lúc render thay vì
  // đồng bộ qua effect + setState.
  const effectiveSessionId = sessionId ?? sessions.data?.[0]?.id ?? null;
  const { data, mutate, isLoading } = useAssistantMessages(effectiveSessionId);
  const [input, setInput] = useState("");
  // Tin nhắn vừa gửi/nhận, hiện ngay lập tức bất kể đang ở khoá SWR nào —
  // cần tách riêng khỏi cache SWR vì lúc gửi tin đầu tiên của 1 cuộc trò
  // chuyện MỚI, session id chỉ biết được SAU khi server trả lời, nghĩa là
  // khoá cache (`/assistant/sessions/<id>/messages`) đổi ngay sau đó — nếu
  // cập nhật lạc quan thẳng vào cache theo khoá cũ thì sẽ "biến mất" khi
  // khoá đổi. Dọn sạch khi dữ liệu thật từ server đã có tin nhắn vừa gửi.
  const [pending, setPending] = useState<AssistantMessage[]>([]);
  const messages = [...(data ?? []), ...pending];
  // Popup mời cài PWA cũng nổi ở đúng góc này (z-[60], xem install-prompt.tsx)
  // — đẩy widget lên cao hơn khi popup đó ĐANG THẬT SỰ hiện (đọc cờ do chính
  // component đó cập nhật, xem lib/pwa/store.ts — trước đây tự đoán "có thể
  // hiện" bằng cách chép lại 1 phần logic của nó nên sai, coi gần như lúc nào
  // cũng "có thể hiện" trên desktop, khiến nút bị đẩy lên lơ lửng giữa màn
  // hình hầu hết thời gian dù popup thật sự không hiện).
  const { promptDialogVisible } = usePwaState();
  const [sending, setSending] = useState(false);
  // id tin nhắn model đang được đẩy từng đoạn qua stream — dùng để hiện
  // chấm nhấp nháy trong lúc chưa có chữ nào, và biết bubble nào cần cập
  // nhật liên tục khi nhận thêm delta.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, sending]);

  // Dữ liệu thật từ server đã phản ánh tin nhắn vừa gửi -> bỏ bản tạm để
  // tránh hiện trùng lặp.
  useEffect(() => {
    if (pending.length === 0 || !data) return;
    const lastPendingText = pending[pending.length - 1].text;
    if (data.some((m) => m.text === lastPendingText)) setPending([]);
  }, [data, pending]);

  // Đóng kết nối SSE dở dang nếu component gỡ bỏ giữa chừng (vd đăng xuất).
  useEffect(() => () => closeStreamRef.current?.(), []);

  function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const modelMsgId = `tmp-m-${Date.now()}`;
    setStreamingId(modelMsgId);
    setPending((p) => [
      ...p,
      {
        id: `tmp-u-${Date.now()}`,
        role: "USER",
        text,
        createdAt: new Date().toISOString(),
      },
      { id: modelMsgId, role: "MODEL", text: "", createdAt: new Date().toISOString() },
    ]);

    let accumulated = "";
    closeStreamRef.current = streamAssistant(
      text,
      effectiveSessionId ?? undefined,
      {
        onDelta: (delta) => {
          accumulated += delta;
          setPending((p) =>
            p.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m)),
          );
        },
        onDone: (newSessionId) => {
          if (newSessionId && effectiveSessionId !== newSessionId) {
            setSessionId(newSessionId);
          } else {
            void mutate();
          }
          void sessions.mutate();
          setStreamingId(null);
          setSending(false);
        },
        onError: () => {
          setPending((p) =>
            p.map((m) =>
              m.id === modelMsgId && !accumulated
                ? { ...m, text: "Có lỗi mạng, thử lại nhé." }
                : m,
            ),
          );
          setStreamingId(null);
          setSending(false);
        },
      },
    );
  }

  async function startNewChat() {
    closeStreamRef.current?.();
    const created = await createAssistantSession();
    setSessionId(created.id);
    setPending([]);
    setStreamingId(null);
    setView("chat");
    void sessions.mutate((current) => [created, ...(current ?? [])], {
      revalidate: false,
    });
  }

  async function removeSession(id: string) {
    if (!confirm("Xoá cuộc trò chuyện này?")) return;
    await deleteAssistantSession(id);
    void sessions.mutate(
      (current) => (current ?? []).filter((s) => s.id !== id),
      { revalidate: false },
    );
    if (id === effectiveSessionId) {
      setSessionId(null);
      setPending([]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng trợ lý Hanni" : "Mở trợ lý Hanni"}
        aria-expanded={open}
        className={`motion-button fixed right-5 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-fg shadow-lg shadow-black/15 hover:bg-primary/90 ${promptDialogVisible ? "bottom-56" : "bottom-5"}`}
      >
        {open ? <Icon name="close" size={24} /> : <HanniLogo size={56} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý Hanni"
          className={`fixed right-5 z-40 flex h-[min(32rem,70vh)] w-[min(23rem,90vw)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ${promptDialogVisible ? "bottom-72" : "bottom-24"}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <HanniLogo size={32} />
              <div>
                <p className="text-sm font-bold">Trợ lý Hanni</p>
                <p className="text-[11px] text-muted">
                  Hỏi về tiếng Trung, ngữ pháp, lộ trình học
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void startNewChat()}
                title="Cuộc trò chuyện mới"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-primary"
              >
                <Icon name="plus" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView(view === "history" ? "chat" : "history")}
                title="Lịch sử trò chuyện"
                aria-pressed={view === "history"}
                className={`flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-2 ${view === "history" ? "text-primary" : "text-muted hover:text-foreground"}`}
              >
                <Icon name="clock" size={16} />
              </button>
            </div>
          </div>

          {view === "history" ? (
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {!sessions.data || sessions.data.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted">
                  Chưa có cuộc trò chuyện nào.
                </p>
              ) : (
                sessions.data.map((s) => (
                  <div
                    key={s.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-surface-2 ${s.id === effectiveSessionId ? "bg-surface-2" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSessionId(s.id);
                        setPending([]);
                        setView("chat");
                      }}
                      className="min-w-0 flex-1 truncate text-left"
                    >
                      {s.title ?? "Cuộc trò chuyện mới"}
                      <span className="ml-2 text-[11px] text-muted">
                        {timeAgo(s.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSession(s.id)}
                      aria-label="Xoá cuộc trò chuyện"
                      className="shrink-0 rounded-md p-1.5 text-muted opacity-0 hover:text-danger group-hover:opacity-100"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div
                ref={listRef}
                className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {isLoading && messages.length === 0 ? (
                  <p className="text-center text-xs text-muted">Đang tải…</p>
                ) : messages.length === 0 ? (
                  <div className="flex items-start gap-2.5">
                    <HanniLogo size={28} />
                    <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm leading-6">
                      Chào {user?.displayName ?? "bạn"}! Mình là Hanni 👋 Mình
                      có thể giúp gì cho bạn hôm nay — hỏi về từ vựng, ngữ
                      pháp, phát âm, hay lộ trình học đều được nhé.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${m.role === "USER" ? "flex-row-reverse" : ""}`}
                    >
                      {m.role === "MODEL" && <HanniLogo size={28} />}
                      <div
                        className={`max-w-[78%] break-words rounded-xl px-3 py-2.5 text-sm leading-6 ${
                          m.role === "USER"
                            ? "bg-primary text-primary-fg"
                            : "bg-surface-2"
                        }`}
                      >
                        {m.role === "MODEL" ? (
                          m.id === streamingId && !m.text ? (
                            <span
                              aria-label="Đang trả lời…"
                              className="flex gap-1 py-1"
                            >
                              {[0, 1, 2].map((i) => (
                                <span
                                  key={i}
                                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
                                  style={{ animationDelay: `${i * 120}ms` }}
                                />
                              ))}
                            </span>
                          ) : (
                            <MarkdownLite text={m.text} />
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{m.text}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                className="flex items-center gap-2 border-t border-border p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Nhập câu hỏi…"
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
        </div>
      )}
    </>
  );
}
