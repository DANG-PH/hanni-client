"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { mutate as revalidate } from "swr";
import { ChatComposer } from "./chat/chat-composer";
import { JumpToLatest, useStickToBottom } from "./chat/use-stick-to-bottom";
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
import type { AssistantAction, AssistantMessage } from "@/lib/types";

function HanniLogo({ size, fill = false }: { size: number; fill?: boolean }) {
  return (
    <Image
      src="/brand/fox-mark.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={fill ? { width: "100%", height: "100%" } : { width: size, height: size }}
      sizes={`${size}px`}
    />
  );
}

/** Điện thoại / máy tính bảng: nút trợ lý tự lùi xuống khi cuộn xuống đọc (trước đây đè lên nút, chữ ở cuối
 * thẻ — Huy hiệu, Tài khoản, Lớp học), hiện lại khi cuộn lên — cách các nút nổi trong app di động vẫn làm. */
function useTuckOnScroll(): boolean {
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (Math.abs(y - last) < 12) return;
        setTucked(y > last && y > 160);
        last = y;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return tucked;
}

const ASK_EVENT = "hanni:ask-assistant";

/** Câu hỏi gợi ý khi chưa nói gì — người mới thường không biết hỏi trợ lý cái gì. */
const STARTERS = [
  "Phân biệt 的, 地, 得 giúp mình",
  "Đặt 3 câu đơn giản với từ 学习",
  "Khi nào dùng 了?",
  "Mình nên bắt đầu học HSK mấy?",
];

/** Mở trợ lý và hỏi ngay 1 câu soạn sẵn từ chỗ khác trong app (nút "Hỏi trợ
 * lý về câu này" ở màn chữa bài thi thử — lớp "chat với trợ giảng AI" của
 * Migii HSK). Luôn mở cuộc trò chuyện MỚI để không lẫn vào chủ đề cũ. */
export function askAssistant(text: string) {
  window.dispatchEvent(new CustomEvent<string>(ASK_EVENT, { detail: text }));
}

/** Nút bấm cho hành động trợ lý gợi ý (mở trang/video) — người dùng tự bấm
 * mới điều hướng, trợ lý không tự chuyển trang thay. */
function AssistantActionButton({ action }: { action: AssistantAction }) {
  return (
    <Link
      href={action.path}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
    >
      <Icon name="arrow" size={14} />
      Mở: {action.label}
    </Link>
  );
}

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const tucked = useTuckOnScroll();
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
  // Hành động (nút mở trang/video) trợ lý vừa gợi ý — KHÔNG gắn trực tiếp
  // vào message trong `pending` vì message đó sẽ bị dọn (xem effect dưới)
  // ngay khi `data` từ server đồng bộ xong nội dung, làm mất luôn nút bấm
  // dù mới xuất hiện được vài trăm ms. Khớp theo TEXT với tin nhắn model
  // tương ứng (dù đang ở pending hay đã có trong data) để nút không biến
  // mất khi cache SWR đổi.
  const [lastAction, setLastAction] = useState<{
    text: string;
    action: AssistantAction;
  } | null>(null);
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

  // Tin mới: đang ở cuối thì tự cuộn, đang đọc lại câu trả lời cũ thì hiện nút
  // "Xuống tin mới"; câu trả lời đang hiện dần (stream) chỉ kéo theo khi đang ở cuối.
  const last = messages.at(-1);
  const stick = useStickToBottom(listRef, {
    lastItemKey: open && view === "chat" ? (last?.id ?? "empty") : undefined,
    lastIsMine: last?.role === "USER",
    contentKey: last?.text.length,
  });

  // Dữ liệu thật từ server đã phản ánh tin nhắn vừa gửi -> bỏ bản tạm để
  // tránh hiện trùng lặp.
  useEffect(() => {
    if (pending.length === 0 || !data) return;
    const lastPendingText = pending[pending.length - 1].text;
    if (data.some((m) => m.text === lastPendingText)) setPending([]);
  }, [data, pending]);

  // Đóng kết nối SSE dở dang nếu component gỡ bỏ giữa chừng (vd đăng xuất).
  useEffect(() => () => closeStreamRef.current?.(), []);

  /** `preset`: câu hỏi soạn sẵn — từ nơi khác (`askAssistant`, vào 1 phiên vừa
   * tạo, không chờ lượt trước vì lượt trước đã bị đóng) hoặc câu hỏi gợi ý
   * (`starter`, gửi vào phiên đang mở). Không đọc ô nhập. */
  function send(preset?: { text: string; sessionId?: string; starter?: boolean }) {
    const text = (preset?.text ?? input).trim();
    if (!text || (sending && (!preset || preset.starter))) return;
    if (!preset) setInput("");
    const requestSessionId = preset?.sessionId ?? effectiveSessionId ?? undefined;
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

    // Chữ đã HIỂN THỊ trên bubble, nhả dần qua revealTimer bên dưới.
    let accumulated = "";
    // Chữ đã nhận qua SSE nhưng chưa kịp hiển thị — Gemini sinh chữ theo
    // từng cụm token không đều (delta có lúc dài có lúc ngắn), đẩy thẳng
    // vào state mỗi lần nhận làm chữ nhảy khựng cục. Dồn vào buffer rồi
    // "nhả" đều theo nhịp cố định (revealTimer) mượt hơn nhiều, giống cách
    // game bù khung hình khi dữ liệu mạng đến không đều.
    let backlog = "";
    let onNetworkDone: (() => void) | null = null;
    const revealTimer = setInterval(() => {
      if (backlog) {
        // Backlog càng dồn nhiều thì nhả càng nhanh để không bị tụt lại
        // quá xa phía sau so với chữ thực đã sinh xong.
        const step = Math.max(1, Math.round(backlog.length / 10));
        accumulated += backlog.slice(0, step);
        backlog = backlog.slice(step);
        setPending((p) =>
          p.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m)),
        );
      } else if (onNetworkDone) {
        clearInterval(revealTimer);
        const finalize = onNetworkDone;
        onNetworkDone = null;
        finalize();
      }
    }, 20);

    const closeStream = streamAssistant(
      text,
      requestSessionId,
      {
        onDelta: (delta) => {
          backlog += delta;
        },
        onDone: (newSessionId, action) => {
          onNetworkDone = () => {
            if (action) setLastAction({ text: accumulated, action });
            if (newSessionId && requestSessionId !== newSessionId) {
              setSessionId(newSessionId);
            } else if (preset?.sessionId) {
              // `mutate` của lần render này còn trỏ phiên cũ.
              void revalidate(`/assistant/sessions/${preset.sessionId}/messages`);
            } else {
              void mutate();
            }
            void sessions.mutate();
            setStreamingId(null);
            setSending(false);
          };
          // Chữ đã nhả hết từ trước khi mạng báo xong (câu ngắn) -> hoàn
          // tất luôn, không cần đợi tick kế tiếp.
          if (!backlog) {
            clearInterval(revealTimer);
            onNetworkDone();
            onNetworkDone = null;
          }
        },
        onError: () => {
          clearInterval(revealTimer);
          setPending((p) =>
            p.map((m) =>
              m.id === modelMsgId && !accumulated && !backlog
                ? { ...m, text: "Có lỗi mạng, thử lại nhé." }
                : m,
            ),
          );
          setStreamingId(null);
          setSending(false);
        },
      },
    );
    closeStreamRef.current = () => {
      clearInterval(revealTimer);
      closeStream();
    };
  }

  // Câu hỏi soạn sẵn từ nơi khác: mở widget, tạo phiên mới rồi gửi luôn.
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    async function onAsk(event: Event) {
      const text = (event as CustomEvent<string>).detail;
      if (!text) return;
      setOpen(true);
      setView("chat");
      closeStreamRef.current?.();
      const created = await createAssistantSession();
      setSessionId(created.id);
      setPending([]);
      setLastAction(null);
      // `sessions.mutate` trong closure này gắn khoá lúc widget còn đóng (null).
      void revalidate("/assistant/sessions");
      sendRef.current({ text, sessionId: created.id });
    }
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  async function startNewChat() {
    closeStreamRef.current?.();
    const created = await createAssistantSession();
    setSessionId(created.id);
    setPending([]);
    setLastAction(null);
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
      setLastAction(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng trợ lý Hanni" : "Mở trợ lý Hanni"}
        aria-expanded={open}
        className={`motion-button fixed right-4 z-40 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-fg shadow-lg shadow-black/15 transition-[translate,opacity] duration-300 hover:bg-primary/90 sm:right-5 sm:h-14 sm:w-14 ${open ? "max-sm:hidden" : ""} ${tucked && !open ? "max-lg:pointer-events-none max-lg:translate-y-24 max-lg:opacity-0" : ""} ${promptDialogVisible ? "bottom-[calc(var(--bottom-nav-h,0px)_+_14rem)]" : "bottom-[calc(var(--bottom-nav-h,0px)_+_1rem)]"}`}
      >
        {open ? <Icon name="close" size={24} /> : <HanniLogo size={56} fill />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý Hanni"
          className={`fixed z-40 flex flex-col overflow-hidden bg-surface max-sm:inset-0 max-sm:pt-[env(safe-area-inset-top)] max-sm:pb-[env(safe-area-inset-bottom)] sm:right-5 sm:h-[min(32rem,calc(100dvh_-_var(--bottom-nav-h,0px)_-_11rem))] sm:w-[min(23rem,90vw)] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl ${promptDialogVisible ? "sm:bottom-[calc(var(--bottom-nav-h,0px)_+_18rem)]" : "sm:bottom-[calc(var(--bottom-nav-h,0px)_+_6rem)]"}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <HanniLogo size={32} />
              <div>
                <p className="text-sm font-bold">Trợ lý Hanni</p>
                <p className="text-xs text-muted">
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng trợ lý"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground sm:hidden"
              >
                <Icon name="close" size={16} />
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
                        setLastAction(null);
                        setView("chat");
                      }}
                      className="min-w-0 flex-1 truncate text-left"
                    >
                      {s.title ?? "Cuộc trò chuyện mới"}
                      <span className="ml-2 text-xs text-muted">
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
              <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {isLoading && messages.length === 0 ? (
                  <p className="text-center text-xs text-muted">Đang tải…</p>
                ) : messages.length === 0 ? (
                  <div className="flex items-start gap-2.5">
                    <HanniLogo size={28} />
                    <div className="min-w-0 space-y-2.5">
                      <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm leading-6">
                        Chào {user?.displayName ?? "bạn"}! Mình là Hanni 👋 Mình
                        có thể giúp gì cho bạn hôm nay — hỏi về từ vựng, ngữ
                        pháp, phát âm, hay lộ trình học đều được nhé.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {STARTERS.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() =>
                              send({ text: q, sessionId: effectiveSessionId ?? undefined, starter: true })
                            }
                            disabled={sending}
                            className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${m.role === "USER" ? "flex-row-reverse" : ""}`}
                    >
                      {m.role === "MODEL" && <HanniLogo size={28} />}
                      <div
                        className={`max-w-[78%] space-y-2 break-words rounded-xl px-3 py-2.5 text-sm leading-6 ${
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
                        {m.role === "MODEL" &&
                          lastAction &&
                          m.text === lastAction.text && (
                            <AssistantActionButton action={lastAction.action} />
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!stick.atBottom && (
                <JumpToLatest unseen={stick.unseen} onClick={() => stick.scrollToBottom(true)} />
              )}
              </div>
              {/* Server nhận tối đa 1.000 ký tự (MaxLength ở ask-assistant.dto.ts). */}
              <ChatComposer
                value={input}
                onChange={setInput}
                onSubmit={() => send()}
                maxLength={1000}
                placeholder="Nhập câu hỏi…"
                busy={sending}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
