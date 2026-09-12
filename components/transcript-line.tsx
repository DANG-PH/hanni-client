"use client";

import { TonePinyin } from "./tone-pinyin";
import type { VideoLine } from "@/lib/types";

export function TranscriptLine({
  line,
  active,
  showPinyin,
  showTrans,
  onSelect,
  compact = false,
}: {
  line: VideoLine;
  active: boolean;
  showPinyin: boolean;
  showTrans: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      data-idx={line.index}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      // content-visibility: bỏ qua layout/paint cho dòng ngoài khung nhìn →
      // bản chép hàng nghìn dòng vẫn mượt. offsetTop vẫn tính được nhờ
      // contain-intrinsic-size (nhớ kích thước thật lần render gần nhất).
      // Mobile uses natural row heights so touch scrolling and seeking do not
      // jump when estimated offscreen heights are replaced by actual heights.
      style={
        compact
          ? undefined
          : {
              contentVisibility: "auto",
              containIntrinsicSize: "auto 52px",
            }
      }
      className={`block w-full px-4 py-3 text-left transition-colors duration-300 ${
        compact
          ? `rounded-xl border ${active ? "border-primary/25 bg-primary/[0.06]" : "border-transparent hover:bg-surface-2"}`
          : active
            ? "opacity-100"
            : "opacity-45 hover:opacity-80"
      }`}
    >
      <div className="flex gap-3">
        <span
          className={`mt-1 shrink-0 text-[11px] font-semibold ${
            active ? "text-primary" : "text-muted"
          }`}
        >
          #{line.index}
        </span>
        <div className="min-w-0">
          {showPinyin ? (
            <TonePinyin
              zh={line.zh}
              pinyin={line.pinyin}
              pinyinNum={line.pinyinNum}
              size={compact || active ? "base" : "sm"}
            />
          ) : (
            <p
              className={`hanzi leading-relaxed ${
                compact || active ? "text-2xl" : "text-xl"
              }`}
            >
              {line.zh}
            </p>
          )}
          {showTrans && line.vi && (
            <p
              className={`mt-1.5 break-words leading-6 ${compact ? "" : "italic"} ${
                active && !compact
                  ? "text-[15px] text-foreground"
                  : "text-sm text-muted"
              }`}
            >
              {line.vi}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
