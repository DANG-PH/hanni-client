"use client";

import Link from "next/link";
import { useState } from "react";
import { SentencePractice } from "@/components/ai/sentence-practice";
import { Icon, type IconName } from "@/components/icon";
import { ToneCheck } from "@/components/tone/tone-check";

type Tab = "tone" | "sentence" | "write";
const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: "tone", label: "Đọc & chấm thanh", icon: "mic" },
  { key: "sentence", label: "Đặt câu (AI)", icon: "spark" },
  { key: "write", label: "Viết chữ", icon: "pencil" },
];

/** "Luyện với từ này" — gộp chấm thanh điệu, đặt câu AI chấm, tập viết vào MỘT khung có tab (trước
 * 2026-10-19 là 3 hộp xếp chồng giữa trang, nhìn như trang quảng cáo hơn là từ điển). */
export function WordPractice({
  word,
}: {
  word: { id: string; simplified: string; pinyin: string; pinyinNumeric: string; audioUrl: string | null; meaningVi: string | null };
}) {
  const [tab, setTab] = useState<Tab>("tone");
  const firstChar = Array.from(word.simplified).find((c) => /\p{Script=Han}/u.test(c)) ?? word.simplified;
  return (
    <div>
      <div role="tablist" aria-label="Cách luyện" className="mb-4 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              tab === t.key ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={15} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "tone" && (
        <div className="max-w-md">
          <ToneCheck hanzi={word.simplified} pinyin={word.pinyin} pinyinNumeric={word.pinyinNumeric} audioUrl={word.audioUrl} align="start" />
        </div>
      )}
      {tab === "sentence" && <SentencePractice word={{ id: word.id, simplified: word.simplified, meaningVi: word.meaningVi }} />}
      {tab === "write" && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <p>Xem thứ tự nét rồi tự tô từng chữ, Hanni chấm nét đúng/sai.</p>
          <Link
            href={`/writing?c=${encodeURIComponent(firstChar)}`}
            className="motion-button inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-fg"
          >
            <Icon name="pencil" size={15} /> Tập viết{" "}
            <span lang="zh" className="hanzi">
              {firstChar}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
