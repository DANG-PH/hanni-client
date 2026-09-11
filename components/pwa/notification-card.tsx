"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ApiError } from "@/lib/api";
import {
  getPushSubscription,
  pushSupported,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pwa/push";
import { usePwaState } from "@/lib/pwa/store";

export function NotificationCard() {
  const state = usePwaState();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"subscribe" | "unsubscribe" | "test" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (state.workerStatus !== "ready" || !pushSupported()) return;
    void getPushSubscription().then((sub) => setSubscribed(Boolean(sub)));
  }, [state.workerStatus]);

  async function enable() {
    if (busy) return;
    setBusy("subscribe");
    setError("");
    setMessage("");
    try {
      await subscribeToPush();
      setSubscribed(true);
      setMessage("Đã bật thông báo cho Hanni trên thiết bị này.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Chưa bật được thông báo. Vui lòng thử lại.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy("unsubscribe");
    setError("");
    setMessage("");
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      setMessage("Đã tắt thông báo trên thiết bị này.");
    } catch {
      setError("Chưa tắt được thông báo. Vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    if (busy) return;
    setBusy("test");
    setError("");
    setMessage("");
    try {
      const result = await sendTestPush();
      setMessage(
        result.sent > 0
          ? "Đã gửi thông báo thử — kiểm tra trên thiết bị của bạn."
          : "Chưa gửi được tới thiết bị nào, thử bật lại thông báo.",
      );
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "Chưa đăng ký nhận thông báo trên thiết bị nào."
          : "Chưa gửi được thông báo thử. Vui lòng thử lại.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (state.workerStatus !== "ready" || !pushSupported()) return null;

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile">
          <Icon name="bell" size={21} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Thông báo nhắc học</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Nhận thông báo ngay trên thiết bị khi có bài ôn tới hạn.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
        {subscribed === null ? (
          <p role="status" className="text-sm text-muted">
            Đang kiểm tra trạng thái thông báo…
          </p>
        ) : subscribed ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-good">
              <Icon name="check" size={18} />
              Đã bật thông báo trên thiết bị này.
            </p>
            <Button
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void test()}
            >
              {busy === "test" ? "Đang gửi…" : "Gửi thử"}
            </Button>
            <Button
              variant="secondary"
              disabled={busy !== null}
              onClick={() => void disable()}
            >
              {busy === "unsubscribe" ? "Đang tắt…" : "Tắt thông báo"}
            </Button>
          </div>
        ) : (
          <Button disabled={busy !== null} onClick={() => void enable()}>
            <Icon name="bell" size={17} />
            {busy === "subscribe" ? "Đang bật…" : "Bật thông báo"}
          </Button>
        )}
      </div>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-good/8 p-3 text-sm leading-6 text-good"
        >
          {message}
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
    </Card>
  );
}
