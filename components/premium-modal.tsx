"use client";

import { useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ApiError } from "@/lib/api";
import { createPremiumCheckout, useTopUpConfigured } from "@/lib/payments";
import type { PremiumPlan } from "@/lib/types";

/** Quyền lợi Premium — CHỈ liệt kê đúng những gì THẬT SỰ đã cài (không hứa
 * suông) — xem `hanni-server/CLAUDE.md` mục Premium cho chi tiết kỹ thuật
 * từng dòng. Dòng cuối nhắc lại rõ KHÔNG khoá nội dung học, tránh hiểu lầm
 * "mua Premium mới học được HSK cao" như một số app tham khảo khác. */
const BENEFITS = [
  "Nhận GẤP ĐÔI xu từ minigame và nhiệm vụ hàng ngày — mua khung/danh hiệu nhanh hơn nhiều",
  "Trợ lý AI Hanni hỏi không giới hạn lượt/ngày (bản miễn phí giới hạn 15 lượt/ngày)",
  "Khung avatar “Phượng Hoàng” độc quyền, không mua được bằng xu",
  "Huy hiệu Premium hiện cạnh tên trên hồ sơ công khai",
  "Toàn bộ 9 cấp HSK, từ vựng, ngữ pháp vẫn MIỄN PHÍ như hiện tại",
];

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export function PremiumModal({
  plans,
  onClose,
}: {
  plans: PremiumPlan[];
  onClose: () => void;
}) {
  const configured = useTopUpConfigured();
  const defaultPlan = plans.find((p) => p.badge) ?? plans[0];
  const [selectedKey, setSelectedKey] = useState(defaultPlan?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = plans.find((p) => p.key === selectedKey) ?? null;

  async function upgrade() {
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await createPremiumCheckout(selected.key);
      // Điều hướng ra ngoài (payOS checkout), cùng cách WalletCard.topUp() đã làm.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa tạo được link thanh toán, thử lại nhé.",
      );
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Nâng cấp Premium"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="icon-tile bg-accent/10 text-accent">
              <Icon name="crown" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Nâng cấp Premium</h2>
              <p className="mt-0.5 text-sm text-muted">
                Không khoá bài học nào — Premium chỉ mở thêm tiện ích.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[1.1fr_1fr]">
            <div className="space-y-2.5">
              {plans.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedKey(plan.key)}
                  aria-pressed={selectedKey === plan.key}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedKey === plan.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                          selectedKey === plan.key
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedKey === plan.key && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </span>
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2 pl-6">
                    <span className="text-lg font-bold">
                      {formatVnd(plan.priceVnd)}
                    </span>
                    {plan.originalPriceVnd && (
                      <span className="text-xs text-muted line-through">
                        {formatVnd(plan.originalPriceVnd)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-surface-2/60 p-4">
              <h3 className="text-sm font-semibold">Quyền lợi Premium</h3>
              <ul className="mt-3 space-y-2.5">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs leading-5">
                    <Icon
                      name="check"
                      size={15}
                      className="mt-0.5 shrink-0 text-good"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {!configured.isLoading && !configured.data?.configured ? (
            <p className="mt-6 text-sm text-muted">
              Thanh toán chưa sẵn sàng lúc này, thử lại sau nhé.
            </p>
          ) : (
            <Button
              className="mt-6 w-full justify-center"
              disabled={busy || !selected}
              onClick={() => void upgrade()}
            >
              <Icon name="crown" size={17} />
              {busy
                ? "Đang tạo link thanh toán…"
                : `Nâng cấp qua payOS — ${selected ? formatVnd(selected.priceVnd) : ""}`}
            </Button>
          )}
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-muted">
            Thanh toán 1 lần cho đúng thời hạn đã chọn, KHÔNG tự động trừ tiền
            gia hạn — hết hạn app tự trở về bản miễn phí.
          </p>
        </div>
      </div>
    </div>
  );
}
