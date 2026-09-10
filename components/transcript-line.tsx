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
      // content-visibility: bỏ qua layout/paint cho dòng ngoài khung nhìn →
      // bản chép hàng nghìn dòng vẫn mượt. offsetTop vẫn tính được nhờ
      // contain-intrinsic-size (nhớ kích thước thật lần render gần nhất).
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 52px" }}
      className={`block w-full px-4 py-3 text-left transition-all duration-300 ${
        active
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
              size={active ? "base" : "sm"}
            />
          ) : (
            <p
              className={`hanzi leading-relaxed ${
                active ? "text-2xl" : "text-xl"
              }`}
            >
              {line.zh}
            </p>
          )}
          {showTrans && line.vi && (
            <p
              className={`mt-1.5 italic leading-6 ${
                active ? "text-[15px] text-foreground" : "text-sm text-muted"
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
