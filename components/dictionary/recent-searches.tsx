"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { clearHistory, readHistory, type HistoryItem } from "@/components/dictionary/dictionary-search";

const EMPTY: HistoryItem[] = [];
let cache: { raw: string; items: HistoryItem[] } = { raw: "", items: EMPTY };
function snapshot() {
  let raw = "";
  try {
    raw = localStorage.getItem("hanni:dict-history") ?? "";
  } catch {
    /* bỏ qua */
  }
  if (raw !== cache.raw) cache = { raw, items: raw ? readHistory() : EMPTY };
  return cache.items;
}
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("hanni:dict-history", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("hanni:dict-history", onChange);
  };
}

/** "Tra gần đây" ở trang chủ từ điển (như khối Lịch sử của Hanzii) — chỉ nằm trong trình duyệt này. */
export function RecentSearches() {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  if (items.length === 0)
    return <p className="text-sm text-muted">Chưa tra từ nào. Từ bạn mở sẽ hiện ở đây để tra lại nhanh.</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((h) => (
          <Link
            key={h.s}
            href={`/tu-dien/${encodeURIComponent(h.s)}`}
            title={h.m ?? undefined}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-primary/40"
          >
            <span lang="zh" className="hanzi text-primary">
              {h.s}
            </span>
            <span className="text-xs text-muted">{h.p}</span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          clearHistory();
          window.dispatchEvent(new Event("hanni:dict-history"));
        }}
        className="mt-2 text-xs text-muted hover:text-primary"
      >
        Xoá lịch sử
      </button>
    </div>
  );
}
