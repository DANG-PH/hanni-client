"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import useSWR, { mutate } from "swr";
import { api, apiFetch, SERVER_ORIGIN } from "./api";
import { useAuth } from "./auth";
import type { AppNotification, NotificationsPage } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

const NOTIFICATIONS_KEY = "/notifications?pageSize=15";

export function useNotifications() {
  return useSWR<NotificationsPage>(NOTIFICATIONS_KEY, fetcher);
}

function patchCache(
  patch: (current: NotificationsPage) => NotificationsPage,
) {
  void mutate<NotificationsPage>(
    NOTIFICATIONS_KEY,
    (current) => (current ? patch(current) : current),
    { revalidate: false },
  );
}

let socket: Socket | null = null;

/**
 * Mở kết nối WebSocket nhận thông báo realtime khi đã đăng nhập (đặt trong
 * AppShell nên chạy suốt phiên làm việc trong app). Đăng xuất → ngắt kết nối
 * để lần đăng nhập sau bắt tay lại với cookie mới.
 */
export function useNotificationSocket() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      socket = null;
      return;
    }
    if (!socket) {
      socket = io(`${SERVER_ORIGIN}/notifications`, {
        withCredentials: true,
      });
    }
    const s = socket;
    function onNew(notification: AppNotification) {
      patchCache((current) => ({
        ...current,
        items: [notification, ...current.items].slice(0, current.pageSize),
        total: current.total + 1,
        unreadCount: current.unreadCount + 1,
      }));
    }
    s.on("notification:new", onNew);
    return () => {
      s.off("notification:new", onNew);
    };
  }, [user]);
}

export async function markNotificationRead(id: string) {
  patchCache((current) => ({
    ...current,
    items: current.items.map((n) =>
      n.id === id && !n.readAt
        ? { ...n, readAt: new Date().toISOString() }
        : n,
    ),
    unreadCount: current.items.some((n) => n.id === id && !n.readAt)
      ? Math.max(0, current.unreadCount - 1)
      : current.unreadCount,
  }));
  await api.patch(`/notifications/${id}/read`).catch(() => undefined);
}

export async function markAllNotificationsRead() {
  patchCache((current) => ({
    ...current,
    items: current.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    unreadCount: 0,
  }));
  await api.post("/notifications/read-all").catch(() => undefined);
}
