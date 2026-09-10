"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { getPwaState, updatePwaState, usePwaState } from "@/lib/pwa/store";

/** Chỉ mở lời mời cài đặt từ sự kiện thật do trình duyệt cung cấp. */
export function InstallCard() {
  const state = usePwaState();
  const [busy, setBusy] = useState<"install" | "update" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cleanupUpdate = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupUpdate.current?.(), []);

  async function install() {
    const prompt = getPwaState().installPrompt;
    if (!prompt || busy) return;
    setBusy("install");
    setError("");
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(
        choice.outcome === "accepted"
          ? "Bạn đã chấp nhận cài Hanni. Hoàn tất hướng dẫn của trình duyệt để mở từ màn hình chính."
          : "Bạn có thể cài Hanni sau từ menu trình duyệt.",
      );
    } catch {
      setError(
        "Chưa mở được lời mời cài đặt. Bạn có thể thử từ menu trình duyệt.",
      );
    } finally {
      if (getPwaState().installPrompt === prompt)
        updatePwaState({ installPrompt: null });
      setBusy(null);
    }
  }

  async function applyUpdate() {
    if (busy || !state.online) return;
    setBusy("update");
    setError("");
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      if (!registration?.waiting) {
        updatePwaState({ updateAvailable: false });
        setMessage(
          "Bản cập nhật đã được áp dụng. Bạn có thể mở lại ứng dụng khi thuận tiện.",
        );
        setBusy(null);
        return;
      }
      const onChanged = () => {
        cleanupUpdate.current?.();
        window.location.reload();
      };
      const timeout = window.setTimeout(() => {
        cleanupUpdate.current?.();
        setBusy(null);
        setError(
          "Chưa áp dụng được bản cập nhật. Bạn hãy đóng các cửa sổ Hanni rồi mở lại.",
        );
      }, 12_000);
      cleanupUpdate.current = () => {
        window.clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onChanged,
        );
        cleanupUpdate.current = null;
      };
      navigator.serviceWorker.addEventListener("controllerchange", onChanged, {
        once: true,
      });
      registration.waiting.postMessage({ type: "HANNI_APPLY_UPDATE" });
    } catch {
      cleanupUpdate.current?.();
      setBusy(null);
      setError(
        "Chưa kiểm tra được bản cập nhật. Bạn hãy thử lại khi mạng ổn định.",
      );
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile">
          <Icon name="home" size={21} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Hanni trên thiết bị của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Mở nhanh từ màn hình chính, tiếp tục học với cùng tài khoản.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-surface-2/50 p-5">
        {!state.initialized ? (
          <p role="status" className="text-sm text-muted">
            Đang kiểm tra khả năng cài ứng dụng…
          </p>
        ) : state.standalone ? (
          <p
            role="status"
            className="flex items-center gap-2 text-sm font-semibold text-good"
          >
            <Icon name="check" size={18} />
            Hanni đã được mở hoặc cài như ứng dụng trên thiết bị này.
          </p>
        ) : state.workerStatus === "unsupported" ? (
          <p className="text-sm leading-7 text-muted">
            Chưa thể cài ứng dụng từ trình duyệt hoặc địa chỉ hiện tại. Hãy mở
            Hanni bằng trình duyệt cập nhật tại địa chỉ HTTPS.
          </p>
        ) : state.workerStatus === "development" ? (
          <p className="text-sm leading-7 text-muted">
            Chức năng cài ứng dụng có trên bản Hanni đã triển khai. Bạn vẫn có
            thể học trong trình duyệt này.
          </p>
        ) : state.installPrompt ? (
          <Button
            disabled={busy !== null || !state.online}
            onClick={() => void install()}
          >
            <Icon name="plus" size={17} />
            {busy === "install" ? "Đang mở cài đặt…" : "Cài ứng dụng Hanni"}
          </Button>
        ) : state.ios ? (
          <div className="space-y-2 text-sm leading-7">
            <h3 className="font-semibold">Cài trên iPhone hoặc iPad</h3>
            <p className="text-muted">
              Mở Hanni trong Safari, chọn{" "}
              <strong className="text-foreground">Chia sẻ</strong>, sau đó{" "}
              <strong className="text-foreground">
                Thêm vào Màn hình chính
              </strong>
              . Bật “Mở dưới dạng ứng dụng web” nếu có rồi chọn Thêm.
            </p>
          </div>
        ) : (
          <div className="space-y-2 text-sm leading-7">
            <h3 className="font-semibold">Cài từ menu trình duyệt</h3>
            <p className="text-muted">
              Mở menu của trình duyệt, tìm{" "}
              <strong className="text-foreground">Cài đặt ứng dụng</strong> hoặc{" "}
              <strong className="text-foreground">
                Thêm vào màn hình chính
              </strong>{" "}
              nếu có. Một số trình duyệt hiển thị biểu tượng cài đặt ngay trên
              thanh địa chỉ.
            </p>
          </div>
        )}
      </div>
      {state.workerStatus === "error" && (
        <ErrorNote>
          Chưa chuẩn bị được ứng dụng trên thiết bị. Kiểm tra kết nối rồi tải
          lại trang để thử lại.
        </ErrorNote>
      )}
      {state.updateAvailable && (
        <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold">Hanni có bản cập nhật mới</h3>
          <p className="text-xs leading-6 text-muted">
            Hoàn tất bài học và lưu thay đổi trước khi cập nhật. Nút bên dưới sẽ
            tải lại trang này.
          </p>
          <Button
            variant="secondary"
            disabled={busy !== null || !state.online}
            onClick={() => void applyUpdate()}
          >
            <Icon name="refresh" size={16} />
            {busy === "update" ? "Đang cập nhật…" : "Cập nhật và mở lại"}
          </Button>
        </div>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-good/8 p-3 text-sm leading-6 text-good"
        >
          {message}
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
      <p className="flex items-start gap-2 text-xs leading-6 text-muted">
        <Icon name="info" size={15} className="mt-1 shrink-0" />
        Các bài học, âm thanh và tiến độ cần kết nối mạng. Khi mất mạng, Hanni
        hiển thị hướng dẫn kết nối lại.
      </p>
    </Card>
  );
}
