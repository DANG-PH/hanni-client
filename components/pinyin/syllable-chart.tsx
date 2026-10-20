"use client";

import { useState } from "react";
import { playWord } from "@/components/lesson-session/steps";
import { TONE_CLASS } from "@/components/tone-pinyin";
import { CHART_TABS, initialOf } from "@/lib/pinyin";
import type { PinyinOverview } from "@/lib/types";
import { usePinyinOverview } from "./use-pinyin";

const TAB_LABEL: Record<string, string> = { "∅": "a o e", "y/w": "y w" };
const TONES = ["1", "2", "3", "4"] as const;

/** Bảng ghép âm: chọn phụ âm đầu → mọi âm tiết của nó, bấm từng thanh để
 * nghe (ghi âm thật của 1 chữ đọc đúng âm đó). Thanh nào từ điển không có chữ
 * đơn 1 cách đọc thì để trống thay vì phát sai. */
export function SyllableChart({ initial }: { initial: PinyinOverview | null }) {
  const data = usePinyinOverview(initial);
  const [tab, setTab] = useState("b");
  const [last, setLast] = useState<string | null>(null);
  const list = (data?.syllables ?? []).filter((s) => initialOf(s.base) === tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Phụ âm đầu">
        {CHART_TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tab}
            onClick={() => setTab(t)}
            className={`min-w-10 rounded-xl border-2 px-2.5 py-1.5 text-sm font-bold ${
              t === tab ? "chip-on" : "border-border bg-surface hover:border-primary/40"
            }`}
          >
            {TAB_LABEL[t] ?? t}
          </button>
        ))}
      </div>
      {!data ? (
        <p className="text-sm text-muted">Đang tải bảng âm…</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((s) => (
            <li key={s.base} className="rounded-2xl border border-border bg-surface p-2.5">
              <p className="px-1 text-sm font-extrabold">{s.base}</p>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {TONES.map((t) => {
                  const sound = s.tones[t];
                  if (!sound)
                    return (
                      <span key={t} className="flex h-11 items-center justify-center rounded-lg bg-surface-2/60 text-xs text-muted/50">
                        –
                      </span>
                    );
                  const id = `${s.base}${t}`;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        playWord(sound.url);
                        setLast(id);
                      }}
                      aria-label={`Nghe ${sound.mark} (${sound.char})`}
                      className={`flex h-11 flex-col items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                        last === id ? "bg-primary/15" : "bg-surface-2 hover:bg-primary/10"
                      } ${TONE_CLASS[t]}`}
                    >
                      {sound.mark}
                      <span lang="zh" className="hanzi text-xs font-normal text-muted">
                        {sound.char}
                      </span>
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
