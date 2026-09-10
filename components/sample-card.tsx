"use client";

import { useState } from "react";
import { Icon } from "./icon";

export function SampleCard() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-3xl border border-primary/15 bg-primary/5"
      />
      <div className="relative rounded-3xl border border-border bg-surface p-7 text-center shadow-xl shadow-primary/5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="rounded-lg bg-primary/8 px-2.5 py-1.5 font-medium text-primary">
            THẺ HỌC THỬ
          </span>
          <Icon name="cards" size={18} />
        </div>
        <div lang="zh" className="hanzi mb-3 mt-10 text-7xl text-foreground">
          你好
        </div>
        <p className="text-lg tracking-wide text-muted">nǐ hǎo</p>
        <div
          className="flex min-h-24 items-center justify-center"
          aria-live="polite"
        >
          {revealed ? (
            <div>
              <p className="text-xl font-semibold">Xin chào</p>
              <p className="mt-1 text-sm text-muted">
                Một lời chào, một khởi đầu mới.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Bạn có nhớ nghĩa của từ này?</p>
          )}
        </div>
        <button
          onClick={() => setRevealed(!revealed)}
          aria-pressed={revealed}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary/8 text-sm font-semibold text-primary hover:bg-primary/15"
        >
          <Icon name="refresh" size={17} />
          {revealed ? "Lật về mặt trước" : "Lật thẻ xem nghĩa"}
        </button>
        <p className="mt-4 text-xs text-muted">
          Thử một từ nhỏ, bắt đầu một hành trình lớn.
        </p>
      </div>
    </div>
  );
}
