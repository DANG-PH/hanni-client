"use client";

import { TonePinyin } from "./tone-pinyin";
import type { VideoLine } from "@/lib/types";

export function TranscriptLine({
  line,
  active,
  showPinyin,
  showTrans,
  onSelect,
}: {
  line: VideoLine;
  active: boolean;
  showPinyin: boolean;
  showTrans: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      data-idx={line.index}
      onClick={onSelect}
      className={`w-full scroll-mt-4 rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? "border-primary/40 bg-primary/8"
          : "border-transparent hover:bg-surface-2"
      }`}
    >
      <div className="flex gap-3">
        <span className="mt-1 shrink-0 text-[11px] font-semibold text-muted">
          #{line.index}
        </span>
        <div className="min-w-0">
          {showPinyin ? (
            <TonePinyin
              zh={line.zh}
              pinyin={line.pinyin}
              pinyinNum={line.pinyinNum}
              size="sm"
            />
          ) : (
            <p className="hanzi text-xl leading-relaxed">{line.zh}</p>
          )}
          {showTrans && line.vi && (
            <p className="mt-1.5 text-sm italic leading-6 text-muted">
              {line.vi}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
