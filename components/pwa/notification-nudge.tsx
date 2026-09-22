"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui";
import {
  getPushSubscription,
  pushSupported,
  subscribeToPush,
} from "@/lib/pwa/push";

const DISMISS_KEY = "hanni-push-nudge-dismissed";

/**
 * Dải mời bật thông báo ở dashboard.
 *
 * Lý do tồn tại: đo production thấy **0 người** từng bật thông báo đẩy, nên
 * toàn bộ hệ nhắc học + thông báo tương tác chưa từng tới được ai. Chỗ bật
 * duy nhất trước đó nằm trong `/settings` — quá sâu, và `/settings` giờ còn
 * không có trong sidebar nữa.
 *
 * Cố ý KHÔNG tự gọi `Notification.requestPermission()` khi vừa vào trang:
 * trình duyệt ghi nhớ lựa chọn vĩnh viễn, bị từ chối một lần là mất luôn cơ
 * hội. Phải để người dùng bấm, và nói rõ đổi lại được gì.
 *
 * Tự ẩn khi: trình duyệt không hỗ trợ, đã đăng ký rồi, đã bị từ chối trước
 * đó (`Notification.permission === "denied"`), hoặc người dùng đã tắt dải này.
 */
export function NotificationNudge() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission === "denied") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // localStorage bị chặn (chế độ riêng tư) — vẫn hiện được, không sao.
    }
    void getPushSubscription().then((sub) => {
      if (!sub) setShow(true);
    });
  }, []);

  if (!show) return null;

  if (done) {
    return (
      <div className="panel flex items-center gap-3 p-4 text-sm">
        <Icon name="check" size={18} className="text-good" />
        Đã bật thông báo — Hanni sẽ nhắc bạn ôn tập và báo khi có tin nhắn mới.
      </div>
    );
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // không lưu được thì thôi, chỉ ẩn trong phiên này
    }
    setShow(false);
  }

  return (
    <div className="panel tint-primary flex flex-wrap items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon name="flame" size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Đừng để mất chuỗi ngày học</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Bật thông báo để Hanni nhắc bạn ôn đúng lúc sắp quên, và báo khi có
          tin nhắn hay ai đó trả lời bạn.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await subscribeToPush();
              setDone(true);
            } catch {
              // Bị từ chối hoặc lỗi — ẩn đi, không nài thêm.
              dismiss();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Đang bật…" : "Bật thông báo"}
        </Button>
        <Button variant="ghost" onClick={dismiss}>
          Để sau
        </Button>
      </div>
    </div>
  );
}
