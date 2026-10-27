"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { HandwritingPad } from "@/components/dictionary/handwriting-pad";
import { API_BASE } from "@/lib/api";
import { DICT_TABS, dictHref, type DictTab } from "@/lib/dictionary";
import { recognizerCtor, useCanRecognize, type Recognizer } from "@/lib/speech";
import type { Paginated, Word } from "@/lib/types";

/** Từ đã mở gần đây (trang từ ghi qua `rememberWord`) — chỉ trong trình duyệt này. */
const HISTORY_KEY = "hanni:dict-history";
const HISTORY_MAX = 12;
/** Số từ gợi ý xổ xuống khi đang gõ (server giới hạn pageSize ≤ 100). */
const SUGGEST_LIMIT = 6;
/** Ngừng gõ bao lâu (ms) mới gọi API gợi ý — nhỏ quá thì mỗi phím một request, lớn quá thì thấy trễ. */
const SUGGEST_DEBOUNCE_MS = 180;

export interface HistoryItem {
  s: string; // chữ giản thể
  p: string; // pinyin
  m: string | null; // nghĩa ngắn
}

export function readHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HistoryItem[]).slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* bỏ qua */
  }
}

export function rememberWord(item: HistoryItem) {
  try {
    const rest = readHistory().filter((h) => h.s !== item.s);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...rest].slice(0, HISTORY_MAX)));
    window.dispatchEvent(new Event("hanni:dict-history"));
  } catch {
    /* trình duyệt chặn bộ nhớ cục bộ — bỏ qua, chỉ là tiện ích */
  }
}

const shortMeaning = (m: string | null) => (m ? m.split(";")[0].trim() : null);

/**
 * Ô tra từ điển kiểu Hanzii (làm lại 2026-10-19): ô tròn lớn có micro (nói tiếng Trung để tra),
 * quét ảnh, xoá, nút tra; 4 tab Từ vựng · Hán tự · Ví dụ · Ngữ pháp ngay dưới. Tab Từ vựng gợi ý
 * ngay khi gõ (Hán tự, pinyin không dấu, nghĩa, âm Hán Việt), ↑/↓/Enter để chọn, "Tra gần đây" khi ô
 * trống. Vẫn là `<form method="get">` nên không JS vẫn tra được.
 */
export function DictionarySearch({
  defaultValue = "",
  tab = "tu-vung",
  showTabs = true,
  autoFocus = false,
}: {
  defaultValue?: string;
  tab?: DictTab;
  showTabs?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState(defaultValue);
  const [current, setCurrent] = useState<DictTab>(tab);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ term: string; items: Word[] }>({ term: "", items: [] });
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [listening, setListening] = useState(false);
  const [writing, setWriting] = useState(false);
  const recognizer = useRef<Recognizer | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const canSpeak = useCanRecognize();

  const term = q.trim();
  const suggest = current === "tu-vung";
  const items = suggest && term && result.term === term ? result.items : [];

  // LUỒNG "GÕ CHỮ → RA GỢI Ý" (thầy hay hỏi): mỗi phím gõ đổi `q` → effect này đặt hẹn giờ SUGGEST_DEBOUNCE_MS;
  // gõ tiếp trước khi hết giờ thì hẹn giờ cũ bị huỷ (cleanup bên dưới) → chỉ gọi API khi người dùng NGỪNG gõ.
  // → GET /words?q=…&pageSize=SUGGEST_LIMIT → server: vocabulary.controller.ts listWords() → WordsService.list() →
  //   search(): bảng ~11k từ cache trong RAM → word-search.util.ts prepareQuery() (bỏ dấu, pinyin viết liền) +
  //   rankWords() (chấm bậc khớp: mặt chữ → âm Hán Việt/pinyin → nghĩa…) → trả 6 từ tốt nhất.
  // `seq` bỏ qua phản hồi CŨ về muộn (gõ "ho" rồi "hoc": kết quả "ho" về sau không được ghi đè "hoc").
  // Bấm Enter / nút → → form GET sang /tu-dien?q=… (trang server, app/(site)/tu-dien/page.tsx WordResults).
  useEffect(() => {
    if (!term || !suggest) return;
    const id = ++seq.current;
    const timer = setTimeout(() => {
      // API → GET /words · server: modules/vocabulary/vocabulary.controller.ts → WordsService.list()
      fetch(`${API_BASE}/words?q=${encodeURIComponent(term)}&pageSize=${SUGGEST_LIMIT}`)
        .then((r) => (r.ok ? (r.json() as Promise<Paginated<Word>>) : null))
        .then((data) => {
          if (id === seq.current) {
            setResult({ term, items: data?.items ?? [] });
            setActive(-1);
          }
        })
        .catch(() => undefined);
    }, SUGGEST_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term, suggest]);

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

  function pickTab(key: DictTab) {
    setCurrent(key);
    if (term) router.push(dictHref(term, key));
    else input.current?.focus();
  }

  // Đang mở ô viết tay thì không thả danh sách gợi ý đè lên ô viết.
  const showHistory = suggest && open && !writing && !term && history.length > 0;
  const showItems = open && !writing && items.length > 0;
  const placeholder = listening
    ? "Đang nghe… nói một từ tiếng Trung"
    : (DICT_TABS.find((t) => t.key === current)?.placeholder ?? "");

  return (
    <form
      action="/tu-dien"
      method="get"
      role="search"
      className="mx-auto w-full max-w-3xl"
      onSubmit={(e) => {
        if (active >= 0 && items[active]) {
          e.preventDefault();
          go(items[active].simplified);
        }
      }}
    >
      {current !== "tu-vung" && <input type="hidden" name="tab" value={current} />}
      <div className="relative">
        <div className="flex h-14 items-center gap-1 rounded-full border-2 border-primary/20 bg-surface pr-1.5 pl-5 shadow-[0_6px_24px_-14px_color-mix(in_srgb,var(--primary)_55%,transparent)] transition-colors focus-within:border-primary/70">
          <Icon name="search" size={19} className="shrink-0 text-muted" />
          <input
            ref={input}
            type="search"
            name="q"
            value={q}
            autoFocus={autoFocus}
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
            placeholder={placeholder}
            aria-label="Tra từ"
            role="combobox"
            aria-expanded={showItems || showHistory}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              aria-label="Xoá chữ đã gõ"
              onClick={() => {
                setQ("");
                input.current?.focus();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <Icon name="close" size={17} />
            </button>
          )}
          {canSpeak && (
            <button
              type="button"
              onClick={listen}
              aria-label={listening ? "Đang nghe" : "Tra bằng giọng nói"}
              title="Nói tiếng Trung để tra"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                listening ? "animate-pulse bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-primary"
              }`}
            >
              <Icon name="mic" size={18} />
            </button>
          )}
          {/* Viết tay như bút ở ô tra của Hanzii — cho chữ không biết đọc, không gõ được pinyin. */}
          <button
            type="button"
            onClick={() => setWriting((w) => !w)}
            aria-label="Viết tay để tra"
            aria-pressed={writing}
            title="Viết tay chữ Hán để tra"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              writing ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-2 hover:text-primary"
            }`}
          >
            <Icon name="pencil" size={18} />
          </button>
          {/* Tra bằng ảnh như "Dịch ảnh" của Hanzii/Google Dịch — chụp thực đơn, biển hiệu. */}
          <Link
            href="/tu-dien/quet"
            aria-label="Quét ảnh để tra"
            title="Quét ảnh: thực đơn, biển hiệu, sách"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-primary"
          >
            <Icon name="camera" size={18} />
          </Link>
          <button
            type="submit"
            aria-label="Tra"
            className="ml-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_62%,#000)] hover:brightness-105 active:translate-y-px"
          >
            <Icon name="arrow" size={18} />
          </button>
        </div>

        {(showItems || showHistory) && (
          <div
            id={listId}
            role="listbox"
            className="absolute inset-x-2 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
          >
            {showItems ? (
              items.map((w, i) => (
                <Link
                  key={w.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i === active ? "bg-primary/8" : "hover:bg-surface-2"}`}
                >
                  <span lang="zh" className="hanzi shrink-0 text-xl text-primary">
                    {w.simplified}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-muted">
                      {w.pinyin}
                      {w.hanViet && <span className="ml-1.5 font-semibold text-hanviet uppercase">{w.hanViet}</span>}
                    </span>
                    <span className="block truncate text-sm">{shortMeaning(w.meaningVi) ?? w.meaningEn}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    HSK {w.hskLevel >= 7 ? "7–9" : w.hskLevel}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted">Tra gần đây</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      clearHistory();
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

      {writing && (
        <HandwritingPad
          onPick={(char) => {
            setQ((v) => v + char);
            setResult({ term: "", items: [] });
          }}
          onClose={() => {
            setWriting(false);
            input.current?.focus();
          }}
        />
      )}

      {showTabs && (
        <div role="tablist" aria-label="Kiểu tra" className="mt-3 flex justify-center gap-1 overflow-x-auto">
          {DICT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={current === t.key}
              onClick={() => pickTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                current === t.key ? "chip-on shadow-sm" : "text-muted hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
