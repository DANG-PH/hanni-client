"use client";

import { FeatureTour, type TourStep } from "@/components/feature-tour";
import Link from "next/link";
import styles from "./messages.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ConnectionsPanel } from "@/components/connections-panel";
import { Icon } from "@/components/icon";
import { ErrorNote, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import {
  emitTyping,
  markConversationRead,
  sendDirectMessage,
  translateForCompose,
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
  if (isLoading) {
    return (
      <div className={styles.listEmpty}>
        <Spinner />
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className={styles.listEmpty}>
        <span className={styles.emptyIcon}>
          <Icon name="message" size={19} />
        </span>
        <p className={styles.emptyTitle}>Hộp thư đang trống</p>
        <p className={styles.emptyDescription}>
          Kết nối với một người học để cùng luyện tiếng Trung mỗi ngày.
        </p>
        <button
          type="button"
          onClick={onFindPeople}
          className={styles.emptyAction}
        >
          <Icon name="search" size={14} />
          Tìm bạn học
        </button>
      </div>
    );
  }
  return (
    <div className={styles.conversationList}>
      {data.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`${styles.conversationItem} ${
            activeId === c.id ? styles.conversationActive : ""
          }`}
        >
          <span className={styles.conversationAvatar}>
            <Avatar user={c.otherUser} size={40} />
          </span>
          <div className={styles.conversationCopy}>
            <div className={styles.conversationMeta}>
              <span className={styles.conversationName}>
                {c.otherUser.displayName}
              </span>
              {c.lastMessage && (
                <span className={styles.conversationTime}>
                  {timeAgo(c.lastMessage.createdAt)}
                </span>
              )}
            </div>
            <p className={styles.conversationPreview}>
              {c.lastMessage
                ? `${c.lastMessage.mine ? "Bạn: " : ""}${c.lastMessage.content}`
                : "Chưa có tin nhắn"}
            </p>
          </div>
          {c.unreadCount > 0 && (
            <span className={styles.unreadBadge}>
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
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const otherTypingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  /** "Dịch trước khi gửi" — dịch nội dung đang gõ sang ngôn ngữ CÒN LẠI rồi
   * điền lại vào ô nhập để người dùng xem/sửa trước khi bấm Gửi như bình
   * thường (không tự gửi luôn — máy dịch không phải lúc nào cũng đúng).
   * Hướng dịch tự nhận theo chữ Hán có trong nội dung, không cần chọn tay. */
  async function translateInput() {
    const text = input.trim();
    if (!text || translating || sending) return;
    setTranslating(true);
    setTranslateError("");
    setSendError("");
    try {
      const targetLang = HAS_HAN.test(text) ? "vi" : "zh";
      const { translated } = await translateForCompose(text, targetLang);
      setInput(translated);
    } catch {
      setTranslateError("Chưa dịch được, thử lại nhé.");
    } finally {
      setTranslating(false);
    }
  }

  async function send() {
    const content = input.trim();
    if (!content || sending || translating) return;
    setInput("");
    setSendError("");
    setTranslateError("");
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
        <div className={styles.threadHeader}>
          <span className={styles.threadAvatar}>
            <Avatar user={conversation.otherUser} size={36} />
          </span>
          <div className={styles.threadIdentity}>
            <p className={styles.threadName}>
              {conversation.otherUser.displayName}
            </p>
            {otherTyping && <p className={styles.threadStatus}>Đang nhập…</p>}
          </div>
        </div>
      )}
      <div
        ref={listRef}
        className={`space-y-2.5 overflow-y-auto p-4 ${styles.messageList}`}
      >
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
            {data.items.length === 0 && (
              <div className={styles.threadEmpty}>
                <div>
                  <span className={styles.emptyIcon}>
                    <Icon name="message" size={21} />
                  </span>
                  <p className={styles.emptyTitle}>Bắt đầu cuộc trò chuyện</p>
                  <p className={styles.emptyDescription}>
                    Gửi một lời chào hoặc rủ bạn học cùng ôn bài hôm nay.
                  </p>
                </div>
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
                      className={`${styles.messageBubble} ${
                        mine ? styles.messageMine : styles.messageOther
                      } max-w-[75%] break-words`}
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
      {(sendError || translateError) && (
        <div className="px-3 pt-2">
          <ErrorNote>{sendError || translateError}</ErrorNote>
        </div>
      )}
      <form
        className={styles.composeForm}
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
          placeholder="Nhắn gì đó… (gõ tiếng Việt hoặc tiếng Trung đều được)"
          disabled={sending || translating}
          className={`field ${styles.composeInput}`}
        />
        <button
          type="button"
          onClick={() => void translateInput()}
          disabled={!input.trim() || sending || translating}
          title="Dịch nội dung đang gõ sang ngôn ngữ còn lại trước khi gửi"
          className={styles.translateButton}
        >
          {translating ? "Đang dịch…" : "Dịch"}
        </button>
        <button
          type="submit"
          disabled={!input.trim() || sending || translating}
          aria-label="Gửi"
          className={styles.sendButton}
        >
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </div>
  );
}

type Tab = "chats" | "connect";

const MESSAGES_TOUR_STEPS: TourStep[] = [
  {
    icon: "user",
    title: "Phải theo dõi nhau trước",
    description:
      'Hanni chỉ cho mở hội thoại MỚI khi hai người đã theo dõi nhau (một trong hai chiều là đủ) — để không ai bị người lạ nhắn tin. Sang tab "Kết nối" để tìm người theo tên hoặc mã người dùng.',
  },
  {
    icon: "book",
    title: "Tin nhắn tiếng Trung dịch được ngay",
    description:
      'Tin nào có chữ Hán sẽ hiện nút "Dịch" để xem pinyin và nghĩa tiếng Việt — nhắn tin cho nhau cũng là lúc luyện đọc.',
  },
  {
    icon: "message",
    title: "Dịch trước khi gửi",
    description:
      'Nút "Dịch" cạnh ô nhập chuyển nội dung bạn đang gõ sang ngôn ngữ còn lại rồi điền lại vào ô — xem và sửa trước khi bấm Gửi, không tự gửi hộ.',
  },
];

function MessagesHero({ onConnect }: { onConnect: () => void }) {
  return (
    <section className={styles.hero} aria-labelledby="messages-title">
      <div className={styles.heroIdentity}>
        <span className={styles.heroIcon}>
          <Icon name="message" size={28} />
        </span>
        <p className={styles.heroEyebrow}>Góc kết nối</p>
        <h1 id="messages-title" className={styles.heroTitle}>
          Học cùng nhau, tiến bộ mỗi ngày
        </h1>
        <p className={styles.heroDescription}>
          Trò chuyện với người học khác, hỏi bài và cùng giữ nhịp học tiếng
          Trung trên Hanni.
        </p>
      </div>
      <button type="button" onClick={onConnect} className={styles.heroRoute}>
        <span className={styles.routeItem}>
          <strong>01</strong>
          Tìm bạn học
        </span>
        <span className={styles.routeArrow}>→</span>
        <span className={styles.routeItem}>
          <strong>02</strong>
          Cùng luyện tập
        </span>
      </button>
    </section>
  );
}

function MessagesWelcome({ onConnect }: { onConnect: () => void }) {
  return (
    <div className={styles.threadWelcome}>
      <div className={styles.welcomeIcon}>
        <Icon name="message" size={25} />
      </div>
      <p className={styles.welcomeKicker}>KHÔNG GIAN HỌC CÙNG NHAU</p>
      <h2 className={styles.welcomeTitle}>Chọn một cuộc trò chuyện</h2>
      <p className={styles.welcomeDescription}>
        Chọn người học ở bên trái để tiếp tục, hoặc tìm một người bạn mới để
        cùng luyện tiếng Trung.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className={styles.welcomeAction}
      >
        <Icon name="search" size={15} />
        Tìm bạn học
        <Icon name="arrow" size={15} />
      </button>
      <div className={styles.welcomeSteps} aria-label="Các bước bắt đầu">
        <span>Chọn người học</span>
        <span>→</span>
        <span>Gửi lời chào</span>
      </div>
    </div>
  );
}

function MessagesInner() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get("c");
  // Đang mở 1 hội thoại thì luôn ưu tiên hiện tab "chats" — chọn người ở
  // tab "connect" xong sẽ tự nhảy về đây (xem select()).
  const tab: Tab = activeId
    ? "chats"
    : params.get("tab") === "connect"
      ? "connect"
      : "chats";
  useMessagesSocket(activeId);

  if (loading || !user) return <Spinner />;

  function select(id: string) {
    router.push(`/messages?c=${id}`);
  }

  function switchTab(next: Tab) {
    router.push(next === "connect" ? "/messages?tab=connect" : "/messages");
  }

  return (
    <div className={`page-wrap ${styles.page}`}>
      <FeatureTour tourKey="messages" steps={MESSAGES_TOUR_STEPS} />
      <MessagesHero onConnect={() => switchTab("connect")} />
      <nav className={styles.tabs} aria-label="Khu vực tin nhắn">
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
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
          >
            <span className={styles.tabIcon}>
              <Icon name={t.icon} size={15} />
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "connect" ? (
        <div className={styles.connectionsPanel}>
          <ConnectionsPanel myUserId={user.id} />
        </div>
      ) : (
        <div className={styles.layout}>
          <div
            className={`${styles.inboxPane} ${activeId ? "hidden" : "block"} md:block`}
          >
            <div className={styles.inboxHeader}>
              <div>
                <p className={styles.inboxKicker}>Hộp thư</p>
                <h2 className={styles.inboxTitle}>Cuộc trò chuyện</h2>
              </div>
              <button
                type="button"
                onClick={() => switchTab("connect")}
                className={styles.findButton}
              >
                <Icon name="search" size={13} />
                Tìm bạn
              </button>
            </div>
            <p className={styles.inboxHint}>
              Những cuộc trò chuyện gần đây của bạn.
            </p>
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
              <div className="hidden h-full md:flex">
                <MessagesWelcome onConnect={() => switchTab("connect")} />
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
