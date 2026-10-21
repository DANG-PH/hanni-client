/**
 * Từ điển CÔNG KHAI `/tu-dien` — làm lại 2026-10-19 theo Hanzii (user: "phần từ điển đang thấy hơi đần").
 * 3 chế độ, đều Server Component (Google đọc được):
 * - không tham số: trang chủ tra cứu như Hanzii — ô tra lớn + 4 tab, lưới 3 cột (từ khoá phổ biến, tra gần
 *   đây, chủ đề | mẹo Hán Việt, tra theo cấp, từ hôm nay | công cụ).
 * - `?q=` (+ `tab=han-tu|vi-du|ngu-phap`): kết quả theo tab; tab Từ vựng có thẻ "khớp chính xác" ở đầu.
 * - `?level=N`: danh sách từ theo cấp HSK (URL index được — trước đây là trang mặc định).
 * Không còn ảnh minh hoạ trong danh sách (Hanzii không có; ảnh Wikimedia hay lạc nghĩa).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";
import { SentenceAnalysis } from "@/components/ai/sentence-analysis";
import { AudioButton } from "@/components/audio-button";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { StrokeAnimation } from "@/components/dictionary/glyph-panel";
import { HanVietTips } from "@/components/dictionary/hanviet-tips";
import { RecentSearches } from "@/components/dictionary/recent-searches";
import { Icon, type IconName } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { WordOfTheDayCard } from "@/components/word-of-the-day";
import { API_BASE } from "@/lib/api";
import { dictHref, type DictTab } from "@/lib/dictionary";
import { HSK_LEVELS, hskLabel, POS_VI } from "@/lib/pos";
import { fetchPublic } from "@/lib/public-fetch";
import type { LearnPath, Paginated, Word } from "@/lib/types";

export const revalidate = 86400;

const LEVELS: readonly number[] = HSK_LEVELS;
const TABS: DictTab[] = ["tu-vung", "han-tu", "vi-du", "ngu-phap"];
const HOT_WORDS = ["你好", "谢谢", "学习", "喜欢", "朋友", "工作", "时间", "汉语", "漂亮", "努力", "加油", "没关系"];

type SP = { level?: string; q?: string; page?: string; tab?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const { level, q } = await searchParams;
  const lv = Number(level);
  if (q) return { title: `Tra "${q}" — Từ điển tiếng Trung | Hanni`, robots: { index: false } };
  if (LEVELS.includes(lv))
    return {
      title: `Từ vựng ${hskLabel(lv)} — Danh sách đầy đủ kèm âm Hán Việt | Hanni`,
      description: `Toàn bộ từ vựng ${hskLabel(lv)} chuẩn HSK 3.0: Hán tự, pinyin, âm Hán Việt, nghĩa tiếng Việt, audio. Miễn phí, không cần đăng nhập.`,
      alternates: { canonical: `/tu-dien?level=${lv}` },
    };
  return {
    title: "Từ điển Trung – Việt có âm Hán Việt — Tra từ HSK | Hanni",
    description:
      "Tra 10.900+ từ tiếng Trung chuẩn HSK 3.0: pinyin, âm Hán Việt, nghĩa tiếng Việt, câu ví dụ, lượng từ, bộ thủ, cách viết, phát âm chuẩn. Tra bằng giọng nói hoặc ảnh. Miễn phí.",
    alternates: { canonical: "/tu-dien" },
  };
}

/** Trang dựng lúc build cũng gọi hàm này → lỗi API phải nuốt (không làm sập build), trả null. */
async function getJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

const short = (m: string | null) => (m ? m.split(";")[0].trim() : "");

function WordRow({ w }: { w: Word }) {
  return (
    <li>
      <Link
        href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
        className="hover-card flex h-full items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3"
      >
        <span lang="zh" className="hanzi min-w-[2.5em] shrink-0 text-2xl text-primary">
          {w.simplified}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">
            {w.pinyin}
            {w.hanViet && <b className="ml-2 text-xs tracking-wide text-hanviet uppercase">{w.hanViet}</b>}
          </span>
          <span className="block truncate text-sm text-muted">{short(w.meaningVi) || w.meaningEn || "Đang cập nhật"}</span>
        </span>
        <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{hskLabel(w.hskLevel)}</span>
      </Link>
    </li>
  );
}

function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-3 text-sm">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-full border border-border px-4 py-1.5 hover:text-primary">
          ← Trước
        </Link>
      )}
      <span className="text-muted">
        Trang {page}/{totalPages}
      </span>
      {page < totalPages && (
        <Link href={href(page + 1)} className="rounded-full border border-border px-4 py-1.5 hover:text-primary">
          Sau →
        </Link>
      )}
    </nav>
  );
}

function Card({ title, icon, children, action }: { title: string; icon: IconName; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Icon name={icon} size={16} className="text-primary" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Gõ cả CÂU (hoặc cụm không có mục từ nào) thì mời AI phân tích/dịch — như Hanzii dịch câu ngay ở ô tra. */
function offerAnalysis(q: string, items: Word[]): boolean {
  const han = (q.match(/\p{Script=Han}/gu) ?? []).length;
  const words = q.split(/\s+/).filter(Boolean).length;
  if (han >= 5 || (han >= 3 && /[，。！？、,.!?\s]/.test(q)) || (han === 0 && words >= 3)) return true;
  const lower = q.toLowerCase();
  const exact = items.some(
    (w) => w.simplified === q || w.hanViet?.toLowerCase() === lower || w.meaningVi?.split(";")[0].trim().toLowerCase() === lower,
  );
  return !exact && (han >= 2 || (han === 0 && words >= 2));
}

export default async function TuDienPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // Dữ liệu gộp HSK 7–9 thành cấp 7 — link cũ ?level=8/9 từng là trang rỗng.
  if (sp.level === "8" || sp.level === "9") permanentRedirect("/tu-dien?level=7");
  const q = sp.q?.trim() || undefined;
  const tab = (TABS.includes(sp.tab as DictTab) ? sp.tab : "tu-vung") as DictTab;
  const lv = Number(sp.level);
  const page = Math.max(1, Number(sp.page) || 1);

  if (q) return <Results q={q} tab={tab} page={page} />;
  if (LEVELS.includes(lv)) return <LevelList level={lv} page={page} />;
  return <DictionaryHome />;
}

async function DictionaryHome() {
  const [stats, path, levels] = await Promise.all([
    getJson<{ total: number; withHanViet: number }>("/words/stats"),
    getJson<LearnPath>("/learn/path?level=1"),
    getJson<{ level: number; wordsInDb: number }[]>("/levels"),
  ]);
  // Chủ đề HSK 1: gộp "Gia đình (1/2)", "(2/2)" thành 1 ô, mở bài đầu của chủ đề.
  const topics = new Map<string, { id: string; words: number; preview: string[] }>();
  for (const l of path?.lessons ?? []) {
    const name = l.title.replace(/\s*\(\d+\/\d+\)$/, "");
    const t = topics.get(name);
    if (t) t.words += l.wordCount;
    else topics.set(name, { id: l.id, words: l.wordCount, preview: l.previewWords ?? [] });
  }
  const fmt = (n?: number) => (n ? n.toLocaleString("vi-VN") : null);

  return (
    <div className="page-wrap max-w-7xl! space-y-7 py-8! sm:py-10!">
      <section className="text-center">
        <p className="eyebrow">TỪ ĐIỂN TRUNG – VIỆT</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tra từ tiếng Trung, có <span className="text-primary">âm Hán Việt</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
          {fmt(stats?.total) ?? "10.900+"} từ chuẩn HSK 3.0 · {fmt(stats?.withHanViet) ?? "9.800+"} từ có âm Hán Việt · câu ví dụ, lượng
          từ, bộ thủ, cách viết, phát âm chuẩn. Gõ Hán tự, pinyin, tiếng Việt — hoặc nói, hoặc chụp ảnh.
        </p>
      </section>
      <DictionarySearch />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card title="Từ khoá phổ biến" icon="flame">
            <div className="flex flex-wrap gap-2">
              {HOT_WORDS.map((w) => (
                <Link
                  key={w}
                  href={`/tu-dien/${encodeURIComponent(w)}`}
                  lang="zh"
                  className="hanzi rounded-xl bg-surface-2 px-3 py-1.5 text-base hover:bg-primary/10 hover:text-primary"
                >
                  {w}
                </Link>
              ))}
            </div>
          </Card>
          <Card title="Tra gần đây" icon="clock">
            <RecentSearches />
          </Card>
          <Card
            title="Từ vựng theo chủ đề · HSK 1"
            icon="route"
            action={
              <Link href="/learn" className="text-xs font-semibold text-primary hover:underline">
                Lộ trình →
              </Link>
            }
          >
            <ul className="grid grid-cols-2 gap-2">
              {[...topics].slice(0, 8).map(([name, t]) => (
                <li key={name} className="min-w-0">
                  <Link href={`/learn/${t.id}`} className="hover-card block h-full rounded-xl border border-border bg-surface px-3 py-2.5">
                    <span className="block truncate text-xs font-semibold">{name}</span>
                    <span lang="zh" className="hanzi mt-0.5 block truncate text-sm text-primary">
                      {t.preview.slice(0, 3).join(" · ")}
                    </span>
                    <span className="block text-xs text-muted">{t.words} từ</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Mẹo Hán Việt" icon="spark">
            <HanVietTips />
          </Card>
          <Card title="Tra theo cấp HSK" icon="target">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <Link key={l} href={`/tu-dien?level=${l}`} className="hover-card rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
                  <span className="block text-sm font-bold">{hskLabel(l)}</span>
                  <span className="block text-xs text-muted">
                    {fmt(levels?.find((x) => x.level === l)?.wordsInDb) ?? "—"} từ
                  </span>
                </Link>
              ))}
            </div>
          </Card>
          <WordOfTheDayCard />
        </div>

        <div className="space-y-5">
          <Card title="Công cụ tra cứu" icon="grid">
            <ul className="space-y-2">
              {(
                [
                  ["/tu-dien/quet", "camera", "Quét ảnh học từ", "Thực đơn, biển hiệu, sách — ra từ kèm Hán Việt"],
                  ["/phien-am", "sound", "Bảng phiên âm", "Thanh điệu, ghép âm, bấm nghe từng âm"],
                  ["/writing", "pencil", "Luyện viết chữ Hán", "Thứ tự nét, tự tô và chấm nét"],
                  ["/tu-da-biet", "heart", "Từ bạn đã biết sẵn", "Âm Hán Việt trùng nghĩa tiếng Việt"],
                  ["/ngu-phap", "book", "Ngữ pháp & mẫu câu", "235 điểm giải thích bằng tiếng Việt"],
                  ["/kiem-tra-trinh-do", "chart", "Kiểm tra trình độ", "Vài phút biết nên học HSK mấy"],
                ] as [string, IconName, string, string][]
              ).map(([href, icon, label, desc]) => (
                <li key={href}>
                  <Link href={href} className="hover-card flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <span className="icon-tile flex h-10 w-10 shrink-0 items-center justify-center">
                      <Icon name={icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      <span className="block truncate text-xs text-muted">{desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <section className="panel tint-primary p-5">
            <h2 className="text-sm font-bold">Tra xong rồi học luôn</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Mỗi từ có nút &ldquo;Lưu để ôn tập&rdquo; — Hanni nhắc ôn đúng lúc sắp quên. Muốn học có lộ trình thì bắt đầu từ bài 1.
            </p>
            <LinkButton href="/bat-dau" className="mt-3 w-full">
              Học bài đầu tiên — miễn phí <Icon name="arrow" size={16} />
            </LinkButton>
          </section>
        </div>
      </div>
    </div>
  );
}

async function LevelList({ level, page }: { level: number; page: number }) {
  const data = await fetchPublic<Paginated<Word>>(`/words?level=${level}&page=${page}&pageSize=40`, revalidate);
  return (
    <div className="page-wrap max-w-6xl! space-y-6 py-8!">
      <DictionarySearch />
      <section>
        <nav className="text-xs text-muted">
          <Link href="/tu-dien" className="hover:text-primary">
            Từ điển
          </Link>{" "}
          › {hskLabel(level)}
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Từ vựng {hskLabel(level)}</h1>
        <p className="mt-1 text-sm text-muted">
          {data ? `${data.total.toLocaleString("vi-VN")} từ theo chuẩn HSK 3.0, ` : ""}sắp theo mức thông dụng — kèm pinyin, âm Hán Việt, nghĩa.
        </p>
      </section>
      <nav aria-label="Chọn cấp HSK" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {LEVELS.map((l) => (
          <Link
            key={l}
            href={`/tu-dien?level=${l}`}
            aria-current={l === level ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              l === level ? "chip-on" : "border-border text-muted hover:border-primary/40 hover:text-primary"
            }`}
          >
            {hskLabel(l)}
          </Link>
        ))}
      </nav>
      {!data ? (
        <p className="panel p-6 text-center text-sm text-muted">Chưa tải được danh sách. Vui lòng thử lại sau.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {data.items.map((w) => (
              <WordRow key={w.id} w={w} />
            ))}
          </ul>
          <Pager page={data.page} totalPages={data.totalPages} href={(p) => `/tu-dien?level=${level}${p > 1 ? `&page=${p}` : ""}`} />
        </>
      )}
    </div>
  );
}

interface CharInfo {
  char: string;
  strokes: number | null;
  radical: { number: number; char: string; nameVi: string } | null;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
  hskLevel: number | null;
  wordSlug: string | null;
  words: { simplified: string; pinyin: string; hanViet: string | null; meaningVi: string | null; hskLevel: number }[];
}
interface ExampleHit {
  id: string;
  zh: string;
  pinyin: string | null;
  vi: string | null;
  word: { simplified: string; pinyin: string; hanViet: string | null; hskLevel: number };
}
interface SegToken {
  text: string;
  simplified: string | null;
  pinyin: string | null;
  hanViet: string | null;
  meaningVi: string | null;
}

/** Dán cả câu vào ô tra: tách theo từ điển Hanni, mỗi từ có pinyin (trên) + âm Hán Việt (dưới) — không gọi AI,
 * khách dùng được (như "Convert pinyin" của Hanbeego; Hanzii bắt dịch bằng AI). Dịch + ngữ pháp bằng AI ở dưới. */
function Segmented({ tokens }: { tokens: SegToken[] }) {
  const words = [...new Map(tokens.filter((t) => t.simplified).map((t) => [t.simplified, t])).values()];
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="phien-am-cau">
      <h2 id="phien-am-cau" className="flex items-center gap-2 text-sm font-bold">
        <Icon name="book" size={16} className="text-primary" /> Phiên âm + âm Hán Việt từng từ
      </h2>
      <p className="mt-1 text-xs text-muted">Tách theo từ điển Hanni — bấm một từ để xem đầy đủ.</p>
      <div className="mt-4 flex flex-wrap items-end gap-x-1 gap-y-3">
        {tokens.map((t, i) =>
          t.simplified ? (
            <Link
              key={i}
              href={`/tu-dien/${encodeURIComponent(t.simplified)}`}
              title={t.meaningVi ?? undefined}
              className="group flex flex-col items-center rounded-lg px-1.5 py-1 hover:bg-primary/5"
            >
              <span className="text-xs text-muted">{t.pinyin}</span>
              <span lang="zh" className="hanzi text-2xl group-hover:text-primary">
                {t.text}
              </span>
              <span className="text-xs font-bold tracking-wide text-hanviet uppercase">{t.hanViet ?? "\u00a0"}</span>
            </Link>
          ) : (
            <span key={i} className="flex flex-col items-center px-0.5 py-1">
              <span className="text-xs text-muted">{t.pinyin ?? "\u00a0"}</span>
              <span lang="zh" className="hanzi text-2xl">
                {t.text}
              </span>
              <span className="text-xs">{"\u00a0"}</span>
            </span>
          ),
        )}
      </div>
      {words.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 border-t border-border pt-3 text-sm sm:grid-cols-2">
          {words.map((w) => (
            <li key={w.simplified} className="min-w-0 truncate">
              <Link href={`/tu-dien/${encodeURIComponent(w.simplified!)}`} className="hover:text-primary">
                <span lang="zh" className="hanzi">
                  {w.simplified}
                </span>{" "}
                <span className="text-muted">{w.pinyin}</span>
              </Link>{" "}
              — {w.meaningVi ?? "đang cập nhật"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface GrammarHit {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
}

async function Results({ q, tab, page }: { q: string; tab: DictTab; page: number }) {
  return (
    <div className="page-wrap max-w-6xl! space-y-6 py-8!">
      <DictionarySearch key={`${q}-${tab}`} defaultValue={q} tab={tab} />
      {tab === "tu-vung" && <WordResults q={q} page={page} />}
      {tab === "han-tu" && <CharResults q={q} />}
      {tab === "vi-du" && <ExampleResults q={q} page={page} />}
      {tab === "ngu-phap" && <GrammarResults q={q} />}
    </div>
  );
}

async function WordResults({ q, page }: { q: string; page: number }) {
  const data = await fetchPublic<Paginated<Word>>(`/words?q=${encodeURIComponent(q)}&page=${page}&pageSize=24`, revalidate);
  const items = data?.items ?? [];
  const offer = offerAnalysis(q, items);
  const seg =
    offer && page === 1 && /\p{Script=Han}/u.test(q)
      ? await getJson<{ tokens: SegToken[] }>(`/ai/segment?q=${encodeURIComponent(q)}`)
      : null;
  const lower = q.toLowerCase();
  const top = page === 1 ? items[0] : undefined;
  const exact =
    top &&
    (top.simplified === q ||
      top.hanViet?.toLowerCase() === lower ||
      top.pinyin.replace(/\s+/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "") === lower.replace(/\s+/g, ""))
      ? top
      : undefined;
  const rest = exact ? items.slice(1) : items;
  return (
    <>
      {seg && seg.tokens.length > 0 && <Segmented tokens={seg.tokens} />}
      {offer && <SentenceAnalysis key={q} text={q} />}
      {exact && (
        <article className="panel overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <Link href={`/tu-dien/${encodeURIComponent(exact.simplified)}`} lang="zh" className="hanzi shrink-0 text-6xl text-primary hover:underline">
              {exact.simplified}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-3 text-lg">
                [{exact.pinyin}]{exact.hanViet && <b className="tracking-wide text-hanviet uppercase">[{exact.hanViet}]</b>}
                {exact.audioUrl && <AudioButton src={exact.audioUrl} size={18} />}
              </p>
              <p className="mt-1 text-xs font-bold tracking-wide text-primary uppercase">
                {hskLabel(exact.hskLevel)}
                {exact.pos.length > 0 && ` · ${exact.pos.map((p) => POS_VI[p] ?? p).join(" · ")}`}
              </p>
              <p className="mt-1.5 text-[15px] font-medium">{(exact.meaningVi ?? exact.meaningEn ?? "").split(";").slice(0, 4).join("; ")}</p>
            </div>
            <LinkButton href={`/tu-dien/${encodeURIComponent(exact.simplified)}`} variant="secondary" className="shrink-0">
              Xem đầy đủ <Icon name="arrow" size={16} />
            </LinkButton>
          </div>
        </article>
      )}
      {items.length === 0 ? (
        // Dán cả câu: khối phiên âm ở trên đã là kết quả — báo "không khớp" ở đây chỉ gây rối.
        seg?.tokens.some((t) => t.simplified) ? null : (
          <div className="panel p-6 text-center text-sm text-muted">
            Không có từ nào khớp &ldquo;{q}&rdquo;. Thử tab{" "}
            <Link href={dictHref(q, "vi-du")} className="font-semibold text-primary">
              Ví dụ
            </Link>{" "}
            hoặc gõ Hán tự, pinyin, âm Hán Việt.
          </div>
        )
      ) : (
        rest.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold text-muted">
              {exact ? "Từ liên quan" : `Kết quả cho "${q}"`} {data ? `· ${data.total}` : ""}
            </h2>
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {rest.map((w) => (
                <WordRow key={w.id} w={w} />
              ))}
            </ul>
          </section>
        )
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} href={(p) => `${dictHref(q)}${p > 1 ? `&page=${p}` : ""}`} />}
    </>
  );
}

async function CharResults({ q }: { q: string }) {
  const chars = [...new Set(Array.from(q).filter((c) => /\p{Script=Han}/u.test(c)))].slice(0, 6);
  if (chars.length === 0)
    return <p className="panel p-6 text-center text-sm text-muted">Tab Hán tự cần chữ Hán — gõ hoặc dán một chữ, vd 学, 好, 爱.</p>;
  const infos = await Promise.all(chars.map((c) => getJson<CharInfo>(`/dictionary/char/${encodeURIComponent(c)}`)));
  return (
    <div className="space-y-4">
      {infos.map((info, i) =>
        !info ? (
          <p key={chars[i]} className="panel p-5 text-sm text-muted">
            Chữ{" "}
            <span lang="zh" className="hanzi">
              {chars[i]}
            </span>{" "}
            không có trong từ vựng HSK.
          </p>
        ) : (
          <article key={info.char} className="panel grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
            <div className="flex flex-col items-center gap-2">
              <StrokeAnimation char={info.char} />
              <Link href={`/writing?c=${encodeURIComponent(info.char)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <Icon name="pencil" size={13} /> Tập viết
              </Link>
            </div>
            <div className="min-w-0">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {info.hanViet && (
                  <>
                    <dt className="text-muted">Hán Việt</dt>
                    <dd className="font-bold text-hanviet uppercase">{info.hanViet}</dd>
                  </>
                )}
                {info.pinyin && (
                  <>
                    <dt className="text-muted">Pinyin</dt>
                    <dd>{info.pinyin}</dd>
                  </>
                )}
                <dt className="text-muted">Nghĩa</dt>
                <dd>
                  {info.meaningVi ? (
                    info.meaningVi.split(";").slice(0, 4).join("; ")
                  ) : (
                    <span className="text-muted">không đứng riêng thành từ — xem các từ bên dưới</span>
                  )}
                </dd>
                {info.radical && (
                  <>
                    <dt className="text-muted">Bộ thủ</dt>
                    <dd>
                      <span lang="zh" className="hanzi mr-1 text-base text-primary">
                        {info.radical.char}
                      </span>
                      <b className="uppercase">{info.radical.nameVi}</b> <span className="text-muted">· bộ số {info.radical.number}</span>
                    </dd>
                  </>
                )}
                {info.strokes && (
                  <>
                    <dt className="text-muted">Số nét</dt>
                    <dd>{info.strokes}</dd>
                  </>
                )}
                {info.hskLevel && (
                  <>
                    <dt className="text-muted">Cấp</dt>
                    <dd>{hskLabel(info.hskLevel)}</dd>
                  </>
                )}
              </dl>
              {info.wordSlug && (
                <Link href={`/tu-dien/${encodeURIComponent(info.wordSlug)}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  Xem mục từ{" "}
                  <span lang="zh" className="hanzi">
                    {info.wordSlug}
                  </span>{" "}
                  →
                </Link>
              )}
              {info.words.length > 0 && (
                <>
                  <p className="mt-4 mb-2 text-xs font-bold text-muted">TỪ CÓ CHỮ {info.char}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {info.words.slice(0, 18).map((w) => (
                      <li key={w.simplified}>
                        <Link
                          href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                          title={`${w.pinyin} — ${short(w.meaningVi)}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1 text-sm hover:border-primary/40"
                        >
                          <span lang="zh" className="hanzi">
                            {w.simplified}
                          </span>
                          {w.hanViet && <span className="text-xs font-semibold text-hanviet uppercase">{w.hanViet}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </article>
        ),
      )}
    </div>
  );
}

async function ExampleResults({ q, page }: { q: string; page: number }) {
  const data = await getJson<{ items: ExampleHit[]; total: number; page: number; pageSize: number }>(
    `/dictionary/examples?q=${encodeURIComponent(q)}&page=${page}`,
  );
  const items = data?.items ?? [];
  if (items.length === 0)
    return (
      <p className="panel p-6 text-center text-sm text-muted">
        Chưa có câu ví dụ nào chứa &ldquo;{q}&rdquo;. Câu ví dụ hiện có cho từ HSK 1–3 — thử một từ thông dụng như 学习, 喜欢.
      </p>
    );
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-muted">
        {data?.total} câu ví dụ có &ldquo;{q}&rdquo;
      </h2>
      <ul className="space-y-2">
        {items.map((ex) => (
          <li key={ex.id} className="panel p-4">
            <p lang="zh" className="hanzi text-lg leading-8">
              {ex.zh}
            </p>
            {ex.pinyin && <p className="text-xs text-muted">{ex.pinyin}</p>}
            {ex.vi && <p className="mt-0.5 text-sm">{ex.vi}</p>}
            <Link href={`/tu-dien/${encodeURIComponent(ex.word.simplified)}`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary">
              Ví dụ của{" "}
              <span lang="zh" className="hanzi text-sm text-primary">
                {ex.word.simplified}
              </span>
              {ex.word.hanViet && <b className="text-hanviet uppercase">{ex.word.hanViet}</b>} · {hskLabel(ex.word.hskLevel)}
            </Link>
          </li>
        ))}
      </ul>
      <Pager page={page} totalPages={totalPages} href={(p) => `${dictHref(q, "vi-du")}${p > 1 ? `&page=${p}` : ""}`} />
    </section>
  );
}

async function GrammarResults({ q }: { q: string }) {
  const items = (await getJson<GrammarHit[]>(`/grammar/search?q=${encodeURIComponent(q)}`)) ?? [];
  if (items.length === 0)
    return (
      <p className="panel p-6 text-center text-sm text-muted">
        Không có điểm ngữ pháp nào khớp &ldquo;{q}&rdquo;.{" "}
        <Link href="/ngu-phap" className="font-semibold text-primary">
          Xem 235 điểm ngữ pháp theo cấp →
        </Link>
      </p>
    );
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-muted">
        {items.length} điểm ngữ pháp có &ldquo;{q}&rdquo;
      </h2>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {items.map((g) => (
          <li key={g.slug}>
            <Link href={`/ngu-phap/${g.slug}`} className="hover-card block h-full rounded-2xl border border-border bg-surface p-4">
              <span className="flex items-center gap-2">
                <span lang="zh" className="hanzi text-lg text-primary">
                  {g.titleZh}
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{hskLabel(g.hskLevel)}</span>
              </span>
              <span className="mt-1 block text-sm font-semibold">{g.titleVi}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{g.summaryVi}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
