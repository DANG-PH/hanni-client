"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import useSWR, { mutate } from "swr";
import { api, apiFetch, SERVER_ORIGIN } from "./api";
import { useAuth } from "./auth";
import type { ConversationSummary, DirectMessage, Paginated } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

const CONVERSATIONS_KEY = "/messages/conversations";
const UNREAD_KEY = "/messages/unread-count";

export function useConversations() {
  return useSWR<ConversationSummary[]>(CONVERSATIONS_KEY, fetcher);
}

export function useUnreadMessageCount() {
  return useSWR<{ count: number }>(UNREAD_KEY, fetcher, {
    refreshInterval: 30_000,
  });
}

export function useConversationMessages(
  conversationId: string | null,
  page = 1,
) {
  return useSWR<Paginated<DirectMessage>>(
    conversationId
      ? `/messages/conversations/${conversationId}/messages?page=${page}`
      : null,
    fetcher,
  );
}

export function getOrCreateConversation(userId: string) {
  return api.post<ConversationSummary>(`/messages/with/${userId}`);
}

export function sendDirectMessage(conversationId: string, content: string) {
  return api.post<DirectMessage>(
    `/messages/conversations/${conversationId}/messages`,
    { content },
  );
}

export function markConversationRead(conversationId: string) {
  return api
    .post(`/messages/conversations/${conversationId}/read`)
    .catch(() => undefined);
}

/** Dịch nhanh 1 tin nhắn (pinyin + nghĩa) để luyện đọc ngay trong khung chat. */
export function translateMessage(text: string) {
  return api.post<{ pinyin: string; vi: string | null }>(
    "/messages/translate",
    { text },
  );
}

// Dùng chung 1 kết nối với /notifications (socket.io-client tự cache theo
// URL, không mở thêm socket mới) — NotificationsGateway đã phát "message:new"
// qua đúng namespace này khi có tin nhắn tới (xem messages.service.ts).
let socket: Socket | null = null;

/** Báo cho người kia biết mình đang gõ — không lưu DB, chỉ chuyển tiếp qua
 * socket (xem `NotificationsGateway.handleTyping()`). Im lặng bỏ qua nếu
 * chưa có kết nối (vd mất mạng) — chỉ là hiệu ứng phụ, không cần đảm bảo gửi. */
export function emitTyping(conversationId: string, toUserId: string) {
  socket?.emit("typing", { conversationId, toUserId });
}

/** Lắng nghe tin nhắn mới, cập nhật badge chưa đọc + danh sách hội thoại
 * (và bơm thẳng vào luồng tin nhắn nếu người dùng đang mở đúng hội thoại).
 * `onTyping` (tuỳ chọn) nhận sự kiện "đang nhập" của đúng hội thoại đang mở. */
export function useMessagesSocket(
  activeConversationId: string | null,
  onTyping?: (payload: { conversationId: string; userId: string }) => void,
) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      socket = null;
      return;
    }
    if (!socket) {
      socket = io(`${SERVER_ORIGIN}/notifications`, { withCredentials: true });
    }
    const s = socket;

    function onNew(payload: { conversationId: string; message: DirectMessage }) {
      void mutate(CONVERSATIONS_KEY);
      void mutate(UNREAD_KEY);
      if (payload.conversationId === activeConversationId) {
        void mutate(
          `/messages/conversations/${payload.conversationId}/messages?page=1`,
        );
        void markConversationRead(payload.conversationId);
      }
    }
    function onRead(payload: { conversationId: string }) {
      if (payload.conversationId === activeConversationId) {
        void mutate(
          `/messages/conversations/${payload.conversationId}/messages?page=1`,
        );
      }
    }
    function onTypingEvent(payload: { conversationId: string; userId: string }) {
      onTyping?.(payload);
    }
    s.on("message:new", onNew);
    s.on("message:read", onRead);
    s.on("typing", onTypingEvent);
    return () => {
      s.off("message:new", onNew);
      s.off("message:read", onRead);
      s.off("typing", onTypingEvent);
    };
  }, [user, activeConversationId, onTyping]);
}
