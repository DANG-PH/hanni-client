"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import {
  askAssistant,
  clearAssistantSession,
  useAssistantMessages,
} from "@/lib/hooks";
import { usePwaState } from "@/lib/pwa/store";
import type { AssistantMessage } from "@/lib/types";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const { data, mutate, isLoading } = useAssistantMessages(open);
  const [input, setInput] = useState("");
  // Popup mời cài PWA cũng nổi ở đúng góc này (z-[60], xem install-prompt.tsx)
  // — đẩy widget lên cao hơn hẳn khi popup đó CÓ THỂ đang hiện, để 2 khối nổi
  // không đè lên nhau (chưa tính trạng thái đã tự tắt/snooze của popup kia,
  // nên có thể đẩy lên hơi thừa vài lần — chấp nhận được, còn hơn bị che nút).
  const pwa = usePwaState();
  const pathname = usePathname();
  const iosHint = pwa.ios && !pwa.installPrompt;
  const genericHint =
    !pwa.ios && !pwa.installPrompt && pwa.workerStatus === "ready";
  const installPromptMightShow =
    pwa.initialized &&
    pwa.online &&
    !pwa.standalone &&
    pathname !== "/install" &&
    (Boolean(pwa.installPrompt) || iosHint || genericHint);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [data, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const optimisticUser: AssistantMessage = {
      id: `tmp-u-${Date.now()}`,
      role: "USER",
      text,
      createdAt: new Date().toISOString(),
    };
    void mutate((current) => [...(current ?? []), optimisticUser], {
      revalidate: false,
    });
    try {
      const res = await askAssistant(text);
      const modelMsg: AssistantMessage = {
        id: `tmp-m-${Date.now()}`,
        role: "MODEL",
        text: res.message,
        createdAt: new Date().toISOString(),
      };
      void mutate((current) => [...(current ?? []), modelMsg], {
        revalidate: false,
      });
    } catch {
      void mutate(
        (current) => [
          ...(current ?? []),
          {
            id: `tmp-err-${Date.now()}`,
            role: "MODEL" as const,
            text: "Có lỗi mạng, thử lại nhé.",
            createdAt: new Date().toISOString(),
          },
        ],
        { revalidate: false },
      );
    } finally {
      setSending(false);
    }
  }

  async function clear() {
    if (!confirm("Xoá cuộc trò chuyện này?")) return;
    await clearAssistantSession();
    void mutate([], { revalidate: false });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng trợ lý Hanni" : "Mở trợ lý Hanni"}
        aria-expanded={open}
        className={`motion-button fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg shadow-black/15 hover:bg-primary/90 ${installPromptMightShow ? "bottom-56" : "bottom-5"}`}
      >
        <Icon name={open ? "close" : "spark"} size={24} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý Hanni"
          className={`fixed right-5 z-40 flex h-[min(32rem,70vh)] w-[min(23rem,90vw)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ${installPromptMightShow ? "bottom-72" : "bottom-24"}`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="spark" size={16} />
              </span>
              <div>
                <p className="text-sm font-bold">Trợ lý Hanni</p>
                <p className="text-[11px] text-muted">
                  Hỏi về tiếng Trung, ngữ pháp, lộ trình học
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void clear()}
              title="Xoá cuộc trò chuyện"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {isLoading ? (
              <p className="text-center text-xs text-muted">Đang tải…</p>
            ) : !data || data.length === 0 ? (
              <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm leading-6">
                Xin chào! Mình là Hanni 👋 Hỏi mình bất cứ điều gì về tiếng
                Trung, ngữ pháp, hoặc lộ trình học của bạn nhé.
              </p>
            ) : (
              data.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2.5 text-sm leading-6 ${
                    m.role === "USER"
                      ? "ml-auto bg-primary text-primary-fg"
                      : "bg-surface-2"
                  }`}
                >
                  {m.text}
                </div>
              ))
            )}
            {sending && (
              <div className="max-w-[85%] rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">
                Đang trả lời…
              </div>
            )}
          </div>

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
        </div>
      )}
    </>
  );
}
