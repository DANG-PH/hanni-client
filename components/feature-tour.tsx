"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";

export interface TourStep {
  icon: IconName;
  title: string;
  description: string;
}

function seen(key: string): boolean {
  try {
    return localStorage.getItem(`hanni-tour-${key}`) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  try {
    localStorage.setItem(`hanni-tour-${key}`, "1");
  } catch {
    /* trình duyệt có thể chặn bộ nhớ cục bộ */
  }
}

/**
 * Popup hướng dẫn từng bước (kiểu "product tour") giới thiệu tác dụng của
 * các tính năng chính trên 1 trang — chỉ hiện 1 LẦN cho mỗi `tourKey`, đánh
 * dấu đã xem qua localStorage (cùng cách install-prompt.tsx nhớ đã tắt).
 * Bỏ qua bất cứ lúc nào cũng được, không ép xem hết.
 */
export function FeatureTour({
  tourKey,
  steps,
}: {
  tourKey: string;
  steps: TourStep[];
}) {
  const [hidden, setHidden] = useState(
    () => typeof window === "undefined" || seen(tourKey),
  );
  const [index, setIndex] = useState(0);

  if (hidden || steps.length === 0) return null;

  function close() {
    markSeen(tourKey);
    setHidden(true);
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Hướng dẫn sử dụng"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Bỏ qua hướng dẫn"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Icon name="close" size={16} />
        </button>

        <div className="icon-tile mx-auto flex h-16 w-16 items-center justify-center text-primary">
          <Icon name={step.icon} size={32} />
        </div>
        <h2 className="mt-4 text-center text-base font-bold">{step.title}</h2>
        <p className="mt-2 text-center text-sm leading-6 text-muted">
          {step.description}
        </p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={close}>
            Bỏ qua
          </Button>
          <Button onClick={() => (isLast ? close() : setIndex((i) => i + 1))}>
            {isLast ? "Đã hiểu, bắt đầu thôi!" : "Tiếp theo"}
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
