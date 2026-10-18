"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import { recognizerCtor, useCanRecognize, type Recognizer } from "@/lib/speech";
import type { Paginated, Word } from "@/lib/types";

/** Từ đã mở gần đây (trang từ ghi qua `rememberWord`) — chỉ trong trình duyệt này. */
const HISTORY_KEY = "hanni:dict-history";
const HISTORY_MAX = 8;

export interface HistoryItem {
  s: string; // chữ giản thể
  p: string; // pinyin
  m: string | null; // nghĩa ngắn
}

function readHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HistoryItem[]).slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function rememberWord(item: HistoryItem) {
  try {
    const rest = readHistory().filter((h) => h.s !== item.s);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...rest].slice(0, HISTORY_MAX)));
  } catch {
    /* trình duyệt chặn bộ nhớ cục bộ — bỏ qua, chỉ là tiện ích */
  }
}

const shortMeaning = (m: string | null) => (m ? m.split(";")[0].trim() : null);

/**
 * Ô tra từ điển theo kiểu Hanzii (2026-10-18): gợi ý ngay khi gõ (Hán tự, pinyin
 * không dấu, nghĩa, âm Hán Việt — cùng API tìm kiếm của trang), ↑/↓/Enter để chọn,
 * lịch sử tra gần đây khi ô trống, nói tiếng Trung để tra (trình duyệt có nhận dạng
 * giọng nói). Vẫn là `<form method="get">` nên không có JS vẫn tra được.
 */
export function DictionarySearch({
  defaultValue = "",
  showScan = false,
}: {
  defaultValue?: string;
  showScan?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ term: string; items: Word[] }>({ term: "", items: [] });
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [listening, setListening] = useState(false);
  const recognizer = useRef<Recognizer | null>(null);
  const seq = useRef(0);
  const canSpeak = useCanRecognize();

  const term = q.trim();
  const items = term && result.term === term ? result.items : [];

  useEffect(() => {
    if (!term) return;
    const id = ++seq.current;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/words?q=${encodeURIComponent(term)}&pageSize=6`)
        .then((r) => (r.ok ? (r.json() as Promise<Paginated<Word>>) : null))
        .then((data) => {
          if (id === seq.current) {
            setResult({ term, items: data?.items ?? [] });
            setActive(-1);
          }
        })
        .catch(() => undefined);
    }, 180);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => () => recognizer.current?.abort(), []);

  function go(simplified: string) {
    setOpen(false);
    router.push(`/tu-dien/${encodeURIComponent(simplified)}`);
  }

  function listen() {
    const Ctor = recognizerCtor();
    if (!Ctor) return;
    recognizer.current?.abort();
    const r = new Ctor();
    r.lang = "zh-CN";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = (e.results[0]?.[0]?.transcript ?? "").replace(/[，。！？、,.!?\s]/g, "");
      if (text) {
        setQ(text);
        setOpen(true);
      }
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognizer.current = r;
    setListening(true);
    r.start();
  }

  const showHistory = open && !term && history.length > 0;
  const showItems = open && items.length > 0;

  return (
    <form
      action="/tu-dien"
      method="get"
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        if (active >= 0 && items[active]) {
          e.preventDefault();
          go(items[active].simplified);
        }
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Icon name="search" size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setHistory(readHistory());
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (!items.length) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
            }
          }}
          placeholder={listening ? "Đang nghe… nói một từ tiếng Trung" : "Hán tự, pinyin, nghĩa hoặc âm Hán Việt…"}
          aria-label="Tra từ"
          role="combobox"
          aria-expanded={showItems || showHistory}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className={`field w-full pl-10! ${canSpeak ? "pr-11!" : ""}`}
        />
        {canSpeak && (
          <button
            type="button"
            onClick={listen}
            aria-label={listening ? "Đang nghe" : "Tra bằng giọng nói"}
            title="Nói tiếng Trung để tra"
            className={`absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg ${
              listening ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-primary"
            }`}
          >
            <Icon name="mic" size={17} />
          </button>
        )}

        {(showItems || showHistory) && (
          <div
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
          >
            {showItems
              ? items.map((w, i) => (
                  <Link
                    key={w.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 ${i === active ? "bg-primary/8" : "hover:bg-surface-2"}`}
                  >
                    <span lang="zh" className="hanzi shrink-0 text-xl text-primary">
                      {w.simplified}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs text-muted">
                        {w.pinyin}
                        {w.hanViet && <span className="ml-1.5 font-semibold text-primary">{w.hanViet}</span>}
                      </span>
                      <span className="block truncate text-sm">{shortMeaning(w.meaningVi) ?? w.meaningEn}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                      HSK {w.hskLevel >= 7 ? "7–9" : w.hskLevel}
                    </span>
                  </Link>
                ))
              : (
                <div className="p-3">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-muted">Tra gần đây</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        try {
                          localStorage.removeItem(HISTORY_KEY);
                        } catch {
                          /* bỏ qua */
                        }
                        setHistory([]);
                      }}
                      className="text-xs text-muted hover:text-primary"
                    >
                      Xoá
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((h) => (
                      <Link
                        key={h.s}
                        href={`/tu-dien/${encodeURIComponent(h.s)}`}
                        onMouseDown={(e) => e.preventDefault()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40"
                        title={h.m ?? undefined}
                      >
                        <span lang="zh" className="hanzi text-primary">
                          {h.s}
                        </span>
                        <span className="text-xs text-muted">{h.p}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
      <button type="submit" className="motion-button inline-flex min-h-11 shrink-0 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">
        Tra
      </button>
      {showScan && (
        // Tra bằng ảnh như "Dịch ảnh" của Hanzii/Google Dịch — chụp thực đơn, biển hiệu.
        <LinkButton href="/tu-dien/quet" variant="secondary" className="px-3.5!">
          <Icon name="camera" size={18} />
          <span className="sr-only sm:not-sr-only">Quét ảnh</span>
        </LinkButton>
      )}
    </form>
  );
}

/** Đặt trên trang từ: ghi từ đang xem vào "Tra gần đây". */
export function RememberWord(item: HistoryItem) {
  useEffect(() => {
    rememberWord(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ ghi 1 lần khi mở trang
  }, [item.s]);
  return null;
}
