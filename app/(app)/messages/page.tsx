"use client";

import Link from "next/link";
import styles from "./messages.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectionsPanel } from "@/components/connections-panel";
import { Icon } from "@/components/icon";
import { ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import {
  emitTyping,
  markConversationRead,
  sendDirectMessage,
  translateMessage,
  useConversationMessages,
  useConversations,
  useMessagesSocket,
} from "@/lib/messages";
import { timeAgo } from "@/lib/time";
import type { DirectMessage, Paginated } from "@/lib/types";

const HAS_HAN = /\p{Script=Han}/u;

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Translation = { pinyin: string; vi: string | null } | "loading" | "error";

function MessageTranslation({
  content,
  mine,
}: {
  content: string;
  mine: boolean;
}) {
  const [translation, setTranslation] = useState<Translation | null>(null);

  if (!HAS_HAN.test(content)) return null;

  const dim = mine ? "text-primary-fg/75" : "text-muted";

  if (!translation) {
    return (
      <button
        type="button"
        onClick={() => {
          setTranslation("loading");
          translateMessage(content)
            .then(setTranslation)
            .catch(() => setTranslation("error"));
        }}
        className={`mt-1 block text-[11px] font-medium underline-offset-2 hover:underline ${mine ? "text-primary-fg/90" : "text-primary"}`}
      >
        Dịch
      </button>
    );
  }

  if (translation === "loading") {
    return <p className={`mt-1 text-[11px] ${dim}`}>Đang dịch…</p>;
  }
  if (translation === "error") {
    return <p className="mt-1 text-[11px] text-danger">Chưa dịch được.</p>;
  }
  return (
    <div
      className={`mt-1.5 border-t pt-1.5 text-[11px] leading-4 ${mine ? "border-primary-fg/20" : "border-border"} ${dim}`}
    >
      <p className="italic">{translation.pinyin}</p>
      {translation.vi && <p>{translation.vi}</p>}
    </div>
  );
}

function ConversationList({
  activeId,
  onSelect,
  onFindPeople,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
  onFindPeople: () => void;
}) {
  const { data, isLoading } = useConversations();
  if (isLoading) return <Spinner />;
  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted">
        <p>Chưa có cuộc trò chuyện nào.</p>
        <button
          type="button"
          onClick={onFindPeople}
          className="mt-2 font-semibold text-primary hover:underline"
        >
          Tìm người quen để bắt đầu
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      {data.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
            activeId === c.id ? "bg-primary/8" : "hover:bg-surface-2"
          }`}
        >
          <Avatar user={c.otherUser} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">
                {c.otherUser.displayName}
              </span>
              {c.lastMessage && (
                <span className="shrink-0 text-[11px] text-muted">
                  {timeAgo(c.lastMessage.createdAt)}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">
              {c.lastMessage
                ? `${c.lastMessage.mine ? "Bạn: " : ""}${c.lastMessage.content}`
                : "Chưa có tin nhắn"}
            </p>
          </div>
          {c.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-fg">
              {c.unreadCount > 9 ? "9+" : c.unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatThread({ conversationId }: { conversationId: string }) {
  const { data: conversations } = useConversations();
  const { data, mutate } = useConversationMessages(conversationId);
  const conversation = conversations?.find((c) => c.id === conversationId);
  const otherUserId = conversation?.otherUser.id;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const otherTypingTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastTypingEmit = useRef(0);
  const lastMessageId = data?.items.at(-1)?.id;

  const handleTypingEvent = useCallback(
    (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId !== otherUserId) return;
      setOtherTyping(true);
      if (otherTypingTimeout.current) clearTimeout(otherTypingTimeout.current);
      otherTypingTimeout.current = setTimeout(
        () => setOtherTyping(false),
        3000,
      );
    },
    [conversationId, otherUserId],
  );
  useMessagesSocket(conversationId, handleTypingEvent);

  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  // ChatThread được remount mỗi lần đổi hội thoại (key={activeId} ở
  // MessagesInner) nên state otherTyping tự về false, chỉ cần dọn timeout.
  useEffect(
    () => () => {
      if (otherTypingTimeout.current) clearTimeout(otherTypingTimeout.current);
    },
    [],
  );

  // Chỉ tự cuộn xuống cuối khi có tin nhắn MỚI (id cuối cùng đổi) — không
  // cuộn khi tải thêm tin nhắn cũ ở trên (xử lý riêng trong loadOlder()),
  // tránh giật màn hình về cuối ngay khi vừa bấm "Xem tin nhắn cũ hơn".
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lastMessageId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  async function loadOlder() {
    if (!data || loadingOlder || data.page >= data.totalPages) return;
    const el = listRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const nextPage = data.page + 1;
      const older = await apiFetch<Paginated<DirectMessage>>(
        `/messages/conversations/${conversationId}/messages?page=${nextPage}`,
      );
      await mutate(
        (current) =>
          current && {
            ...current,
            items: [...older.items, ...current.items],
            page: nextPage,
          },
        { revalidate: false },
      );
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSendError("");
    setSending(true);
    try {
      const message = await sendDirectMessage(conversationId, content);
      void mutate(
        (current) =>
          current && {
            ...current,
            items: [...current.items, message],
          },
        { revalidate: false },
      );
    } catch {
      setInput(content); // khôi phục để người dùng thử gửi lại
      setSendError("Chưa gửi được tin nhắn. Kiểm tra mạng và thử lại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {conversation && (
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Avatar user={conversation.otherUser} size={32} />
          <div className="min-w-0">
            <p className="font-semibold">{conversation.otherUser.displayName}</p>
            {otherTyping && (
              <p className="text-xs text-primary">Đang nhập…</p>
            )}
          </div>
        </div>
      )}
      <div ref={listRef} className={`flex-1 space-y-2.5 overflow-y-auto p-4 ${styles.messageList}`}>
        {!data ? (
          <Spinner />
        ) : (
          <>
            {data.page < data.totalPages && (
              <div className="flex justify-center pb-2">
                <button
                  type="button"
                  onClick={() => void loadOlder()}
                  disabled={loadingOlder}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
                >
                  {loadingOlder ? "Đang tải…" : "Xem tin nhắn cũ hơn"}
                </button>
              </div>
            )}
            {data.items.map((m: DirectMessage, i) => {
              const mine = m.senderId !== conversation?.otherUser.id;
              const prev = data.items[i - 1];
              const showDay =
                !prev ||
                new Date(prev.createdAt).toDateString() !==
                  new Date(m.createdAt).toDateString();
              const isLast = i === data.items.length - 1;
              return (
                <div key={m.id}>
                  {showDay && (
                    <p className="my-3 text-center text-[11px] font-medium text-muted">
                      {dayLabel(m.createdAt)}
                    </p>
                  )}
                  <div
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] break-words rounded-xl px-3 py-2 text-sm ${
                        mine ? "bg-primary text-primary-fg" : "bg-surface-2"
                      }`}
                    >
                      {m.content}
                      <MessageTranslation content={m.content} mine={mine} />
                      <p
                        className={`mt-1 text-[10px] ${mine ? "text-primary-fg/70" : "text-muted"}`}
                      >
                        {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                  {mine && isLast && (
                    <p className="mt-0.5 text-right text-[10px] text-muted">
                      {m.readAt ? "Đã xem" : "Đã gửi"}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
      {sendError && (
        <div className="px-3 pt-2">
          <ErrorNote>{sendError}</ErrorNote>
        </div>
      )}
      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            const now = Date.now();
            if (otherUserId && now - lastTypingEmit.current > 2000) {
              lastTypingEmit.current = now;
              emitTyping(conversationId, otherUserId);
            }
          }}
          placeholder="Nhắn gì đó…"
          disabled={sending}
          className="field min-w-0 flex-1"
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
  );
}

type Tab = "chats" | "connect";

function MessagesInner() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("c");
  // Đang mở 1 hội thoại thì luôn ưu tiên hiện tab "chats" — chọn người ở
  // tab "connect" xong sẽ tự nhảy về đây (xem select()).
  const tab: Tab = activeId ? "chats" : params.get("tab") === "connect" ? "connect" : "chats";
  useMessagesSocket(activeId);

  if (loading || !user) return <Spinner />;

  function select(id: string) {
    router.push(`/messages?c=${id}`);
  }

  function switchTab(next: Tab) {
    router.push(next === "connect" ? "/messages?tab=connect" : "/messages");
  }

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        icon="message"
        tone="primary"
        eyebrow="Kết nối với bạn bè"
        title="Tin nhắn"
        description="Trò chuyện và kết nối với những người học khác trên Hanni."
      />
      <div className="flex gap-1 border-b border-border">
        {(
          [
            { key: "chats", label: "Trò chuyện", icon: "message" },
            { key: "connect", label: "Kết nối", icon: "share" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => switchTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "connect" ? (
        <div className={styles.connectionsPanel}>
          <ConnectionsPanel myUserId={user.id} />
        </div>
      ) : (
        <div className={styles.layout}>
          <div
            className={`border-border p-2 md:block md:border-r ${activeId ? "hidden" : "block"}`}
          >
            <ConversationList
              activeId={activeId}
              onSelect={select}
              onFindPeople={() => switchTab("connect")}
            />
          </div>
          <div className={styles.threadPane} data-active={!!activeId}>
            {activeId ? (
              <>
                <Link
                  href="/messages"
                  className={`flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs font-medium text-primary md:hidden ${styles.backLink}`}
                >
                  <Icon name="back" size={14} /> Danh sách hội thoại
                </Link>
                <ChatThread key={activeId} conversationId={activeId} />
              </>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center gap-3 text-sm text-muted md:flex">
                <p>Chọn 1 cuộc trò chuyện để bắt đầu</p>
                <button
                  type="button"
                  onClick={() => switchTab("connect")}
                  className="font-semibold text-primary hover:underline"
                >
                  Tìm người để nhắn tin →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MessagesInner />
    </Suspense>
  );
}
