/**
 * BẢN ĐỒ TRANG — Trang 1 TỪ (/tu-dien/[slug]) — nghĩa, Hán Việt, phân tích từng chữ, nét viết, lượng từ, ví dụ, luyện
 *   tập
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   POST /ai/mnemonic/:wordId          ← generateMnemonic() ở lib/ai-tools.ts (← components/ai/word-mnemonic.tsx)
 *                                        → server: modules/ai-tools/ai-tools.controller.ts →
 *                                          AiToolsService.mnemonic()
 *   POST /ai/sentence-check            ← checkSentence() ở lib/ai-tools.ts (← components/ai/sentence-practice.tsx)
 *                                        → server: modules/ai-tools/ai-tools.controller.ts →
 *                                          AiToolsService.checkSentence()
 *   GET /dictionary/:slug              ← chính trang này
 *                                        → server: modules/vocabulary/vocabulary.controller.ts →
 *                                          WordsService.lookup()
 *   POST /study/add-word               ← addWordToSrs() ở lib/hooks.ts (← components/save-word-button.tsx)
 *                                        → server: modules/srs/srs.controller.ts → ReviewService.addWord()
 *   POST /study/words/:wordId/suspend  ← suspendWord() ở lib/hooks.ts (← components/save-word-button.tsx)
 *                                        → server: modules/srs/srs.controller.ts → ReviewService.setSuspended()
 *   GET /words                         ← components/dictionary/dictionary-search.tsx
 *                                        → server: modules/vocabulary/vocabulary.controller.ts → WordsService.list()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

/**
 * Trang từ điển CÔNG KHAI cho 1 từ — `/tu-dien/[Hán tự]`.
 *
 * Server Component có chủ đích (KHÔNG "use client"): nội dung nằm sẵn trong HTML để Google index
 * ("学生 nghĩa là gì", "âm Hán Việt của 时间"). Làm lại 2026-10-19 theo trang từ của Hanzii (user: "phần
 * từ điển đang thấy hơi đần"): 3 cột — mục lục | thẻ nội dung (nghĩa + ví dụ, nhớ bằng Hán Việt, lượng
 * từ, từ ghép, cùng chủ đề, luyện tập, video) | khung Hán tự (hoạt hình nét, bộ thủ, số nét). Bỏ ảnh
 * minh hoạ to (Hanzii không có, ảnh Wikimedia hay lạc nghĩa) và khối "Từ vựng HSK khác" (的, 我, 你…
 * chẳng liên quan tới từ đang tra) — thay bằng từ CÙNG CHỦ ĐỀ.
 */
import type { Metadata } from "next";
import { cache, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AudioButton } from "@/components/audio-button";
import { WordMnemonic } from "@/components/ai/word-mnemonic";
import { DictionarySearch, RememberWord } from "@/components/dictionary/dictionary-search";
import { GlyphPanel, type Glyph } from "@/components/dictionary/glyph-panel";
import { SpeakButton } from "@/components/dictionary/speak-button";
import { WordPractice } from "@/components/dictionary/word-practice";
import { Icon, type IconName } from "@/components/icon";
import { SaveWordButton } from "@/components/save-word-button";
import { LinkButton } from "@/components/ui";
import { hskLabel, POS_VI } from "@/lib/pos";
import { fetchPublic } from "@/lib/public-fetch";
import type { Word } from "@/lib/types";

/** Tách nghĩa thành từng nét theo dấu ";" ngoài ngoặc ("đánh; gọi (điện); chơi (bóng)"). */
function senses(meaning: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of meaning) {
    if (ch === "(" || ch === "（") depth += 1;
    if (ch === ")" || ch === "）") depth = Math.max(0, depth - 1);
    if (ch === ";" && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out.filter(Boolean);
}

/** Âm Hán Việt trùng luôn một nét nghĩa tiếng Việt (时间 = thời gian) — người Việt đã biết sẵn. */
function familiar(w: Word) {
  if (!w.hanViet || !w.meaningVi) return false;
  const hv = w.hanViet.toLowerCase().trim();
  return senses(w.meaningVi).some((m) => m.replace(/\([^)]*\)/g, "").toLowerCase().trim() === hv);
}

interface RelatedWord {
  simplified: string;
  pinyin: string;
  meaningVi: string | null;
  hanViet?: string | null;
}
interface CharBreakdown {
  char: string;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
}
interface VideoUsage {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hskLevel: number | null;
  lineCount: number;
}
interface Measure {
  char: string;
  pinyin: string;
  hanViet: string | null;
  inDictionary: boolean;
}
interface Topic {
  id: string;
  title: string;
  hskLevel: number;
  orderIndex: number;
}

/**
 * MỌI trường TUỲ CHỌN: phản hồi cache 24h (`revalidate`), API thêm trường mới thì trang trong cache vẫn
 * mang hình dạng CŨ tới khi hết hạn — đọc thiếu trường là sập trang (lỗi thật 2026-09-22, xem CLAUDE.md).
 */
interface LookupResult {
  words?: Word[];
  related?: RelatedWord[];
  characters?: CharBreakdown[];
  compounds?: RelatedWord[];
  videos?: VideoUsage[];
  glyphs?: Glyph[];
  measures?: Measure[];
  topic?: Topic | null;
}

export const revalidate = 86400;

/** Không prerender lúc build (10.9k trang), dựng khi có người mở rồi giữ 24h (ISR). */
export function generateStaticParams() {
  return [];
}

const lookup = cache(async (slug: string) =>
  // Lỗi tạm thời của API phải ném ra, không biến thành 404 — xem lib/public-fetch.ts.
  // API → GET /dictionary/:slug · server: modules/vocabulary/vocabulary.controller.ts → WordsService.lookup()
  fetchPublic<LookupResult>(`/dictionary/${encodeURIComponent(slug)}`, revalidate),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  const w = data?.words?.[0];
  if (!w) return { title: "Không tìm thấy từ — Hanni" };
  const hanViet = w.hanViet ? ` (Hán Việt: ${w.hanViet})` : "";
  const nghia = w.meaningVi ?? w.meaningEn ?? "";
  const title = `${w.simplified} là gì? ${w.pinyin} — ${nghia} | Hanni`;
  const description = `${w.simplified} (${w.pinyin})${hanViet} nghĩa là "${nghia}". Từ vựng HSK ${w.hskLevel}: nghe phát âm, câu ví dụ, lượng từ, bộ thủ, cách viết — học cùng Hanni.`;
  return {
    title,
    description,
    alternates: { canonical: `/tu-dien/${encodeURIComponent(w.simplified)}` },
    // Khai `openGraph` ở trang là thay HẲN của layout → phải tự gắn lại ảnh chung.
    openGraph: { title, description, images: [{ url: "/themes.png", width: 1672, height: 941 }] },
  };
}

/** Câu ví dụ có từ đang tra tô đậm. */
function Highlight({ text, word }: { text: string; word: string }) {
  const form = word.replace(/[（(][^）)]*[）)]/g, "");
  if (!form || !text.includes(form)) return <>{text}</>;
  const parts = text.split(form);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <b className="font-semibold text-primary">{form}</b>}
        </span>
      ))}
    </>
  );
}

function Section({ id, icon, title, children, aside }: { id: string; icon: IconName; title: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="panel scroll-mt-32 p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`${id}-t`} className="flex items-center gap-2 text-base font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name={icon} size={15} />
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default async function TuDienPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  const words = data?.words ?? [];
  if (words.length === 0) notFound();

  const main = words[0];
  const characters = data?.characters ?? [];
  const compounds = data?.compounds ?? [];
  const videos = data?.videos ?? [];
  const related = data?.related ?? [];
  const glyphs = data?.glyphs ?? [];
  const measures = data?.measures ?? [];
  const topic = data?.topic ?? null;
  const multiChar = Array.from(main.simplified).filter((c) => /\p{Script=Han}/u.test(c)).length > 1;

  const toc = [
    { id: "nghia", label: "Nghĩa" },
    { id: "nho", label: "Nhớ bằng Hán Việt" },
    ...(measures.length ? [{ id: "luong-tu", label: "Lượng từ" }] : []),
    ...(compounds.length ? [{ id: "tu-ghep", label: "Từ ghép" }] : []),
    ...(related.length ? [{ id: "chu-de", label: "Cùng chủ đề" }] : []),
    { id: "luyen", label: "Luyện tập" },
    ...(videos.length ? [{ id: "video", label: "Video" }] : []),
  ];

  return (
    <div className="page-wrap max-w-7xl! space-y-5 py-6! sm:py-8!">
      <DictionarySearch />
      <RememberWord s={main.simplified} p={main.pinyin} m={main.meaningVi} />

      {/* Điện thoại / máy tính bảng: mục lục thành 1 hàng chip dính dưới thanh trên. */}
      <nav aria-label="Mục lục" className="sticky top-16 z-20 -mx-4 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur xl:hidden">
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted hover:text-primary">
            {t.label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[170px_minmax(0,1fr)_320px] lg:items-start">
        <nav aria-label="Mục lục" className="sticky top-24 hidden xl:block">
          <p className="mb-2 px-3 text-xs font-bold tracking-wider text-muted uppercase">Mục lục</p>
          <ul className="space-y-0.5 border-l-2 border-border">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-0.5 block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted hover:border-primary hover:text-primary">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-3 text-xs leading-5 text-muted">
            <Link href="/tu-dien" className="hover:text-primary">
              Từ điển
            </Link>{" "}
            ›{" "}
            <span lang="zh" className="hanzi">
              {main.simplified}
            </span>
          </p>
        </nav>

        <div className="min-w-0 space-y-4">
          {/* Đầu mục từ: chữ + phồn thể, pinyin + ÂM HÁN VIỆT, nghe, lưu — như khối đầu trang từ Hanzii. */}
          <article className="panel overflow-hidden">
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 lang="zh" className="hanzi flex flex-wrap items-baseline gap-x-2 text-5xl leading-tight text-primary sm:text-6xl">
                    {main.simplified}
                    {main.traditional && main.traditional !== main.simplified && (
                      <span className="text-2xl text-muted sm:text-3xl">【{main.traditional}】</span>
                    )}
                  </h1>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg">
                    <span className="text-foreground/90">[{main.pinyin}]</span>
                    {main.hanViet && <span className="font-bold tracking-wide text-hanviet uppercase">[{main.hanViet}]</span>}
                  </p>
                </div>
                {main.audioUrl && (
                  <AudioButton
                    src={main.audioUrl}
                    size={22}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_62%,#000)] hover:brightness-105"
                  />
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{hskLabel(main.hskLevel)}</span>
                {main.pos.map((p) => (
                  <span key={p} className="rounded-full bg-surface-2 px-3 py-1 text-muted">
                    {POS_VI[p] ?? p}
                  </span>
                ))}
                {topic && (
                  <Link href={`/learn/${topic.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-muted hover:text-primary">
                    <Icon name="route" size={13} /> {topic.title.replace(/\s*\(\d+\/\d+\)$/, "")}
                  </Link>
                )}
                {familiar(main) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-good/12 px-3 py-1 text-good">
                    <Icon name="heart" size={13} /> Trùng nghĩa tiếng Việt — bạn đã biết sẵn
                  </span>
                )}
              </div>
              <div className="mt-4">
                <SaveWordButton wordId={main.id} simplified={main.simplified} />
              </div>
            </div>
          </article>

          <Section id="nghia" icon="book" title="Nghĩa">
            <div className="space-y-5">
              {words.map((w, wi) => {
                const list = senses(w.meaningVi ?? w.meaningEn ?? "");
                return (
                  <div key={w.id} className={wi > 0 ? "border-t border-border pt-4" : ""}>
                    {wi > 0 && (
                      <p className="mb-2 flex items-center gap-2 text-sm">
                        <span className="font-semibold">Cách đọc khác:</span> {w.pinyin}
                        {w.hanViet && <b className="text-hanviet uppercase">{w.hanViet}</b>}
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{hskLabel(w.hskLevel)}</span>
                        {w.audioUrl && <AudioButton src={w.audioUrl} size={15} />}
                      </p>
                    )}
                    {w.pos.length > 0 && (
                      <p className="mb-1.5 text-xs font-bold tracking-wide text-primary uppercase">
                        {w.pos.map((p) => POS_VI[p] ?? p).join(" · ")}
                      </p>
                    )}
                    <ol className="space-y-1">
                      {list.map((m, i) => (
                        <li key={m} className="flex gap-2 text-[15px]">
                          {list.length > 1 && <span className="w-5 shrink-0 text-right font-semibold text-muted">{i + 1}.</span>}
                          <span className="font-medium">{m}</span>
                        </li>
                      ))}
                      {list.length === 0 && <li className="text-muted">Đang cập nhật</li>}
                    </ol>
                    {(w.examples ?? []).map((ex) => (
                      <div key={ex.id} className="mt-3 flex items-start gap-3 rounded-xl bg-surface-2/60 p-3.5">
                        <SpeakButton text={ex.zh} />
                        <div className="min-w-0">
                          <p lang="zh" className="hanzi text-lg leading-8">
                            <Highlight text={ex.zh} word={w.simplified} />
                          </p>
                          {ex.pinyin && <p className="text-xs text-muted">{ex.pinyin}</p>}
                          {(ex.vi || ex.en) && <p className="mt-0.5 text-sm">{ex.vi ?? ex.en}</p>}
                        </div>
                      </div>
                    ))}
                    {w.meaningEn && <p className="mt-3 text-xs text-muted">Tiếng Anh: {w.meaningEn}</p>}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Thế mạnh riêng của Hanni: ghép âm Hán Việt từng chữ ra nghĩa (电脑 = điện + não). */}
          <Section id="nho" icon="spark" title="Nhớ bằng Hán Việt">
            {multiChar && characters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {characters.map((c, i) => (
                  <span key={`${c.char}-${i}`} className="contents">
                    {i > 0 && <Icon name="plus" size={14} className="text-muted" />}
                    <Link
                      href={`/tu-dien/${encodeURIComponent(c.char)}`}
                      className="hover-card flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2"
                    >
                      <span lang="zh" className="hanzi text-2xl text-primary">
                        {c.char}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-hanviet uppercase">{c.hanViet ?? "—"}</span>
                        <span className="block max-w-36 truncate text-xs text-muted">{c.meaningVi?.split(";")[0] ?? "không đứng riêng"}</span>
                      </span>
                    </Link>
                  </span>
                ))}
                {main.hanViet && (
                  <>
                    <Icon name="arrow" size={16} className="text-muted" />
                    <span className="rounded-xl bg-hanviet/10 px-3 py-2 text-sm font-bold text-hanviet uppercase">{main.hanViet}</span>
                  </>
                )}
              </div>
            ) : main.hanViet && compounds.some((c) => c.hanViet) ? (
              // Từ 1 chữ: âm Hán Việt của chữ này đã có sẵn trong những từ ghép người Việt hay gặp.
              <p className="text-sm leading-7">
                Âm Hán Việt <b className="text-hanviet uppercase">{main.hanViet}</b> — cũng là chữ{" "}
                <b className="text-hanviet uppercase">{main.hanViet}</b> trong{" "}
                {compounds
                  .filter((c) => c.hanViet)
                  .slice(0, 4)
                  .map((c, i) => (
                    <span key={c.simplified}>
                      {i > 0 && " · "}
                      <Link href={`/tu-dien/${encodeURIComponent(c.simplified)}`} className="hover:text-primary">
                        <span lang="zh" className="hanzi text-base">
                          {c.simplified}
                        </span>{" "}
                        <span className="font-semibold text-hanviet">{c.hanViet}</span>
                      </Link>
                    </span>
                  ))}
              </p>
            ) : null}
            <div className="mt-3">
              <WordMnemonic wordId={main.id} initial={main.mnemonicVi ?? null} />
            </div>
          </Section>

          {measures.length > 0 && (
            <Section id="luong-tu" icon="cards" title="Lượng từ">
              <div className="flex flex-wrap gap-2">
                {measures.map((m) => (
                  <Link
                    key={m.char}
                    href={`/tu-dien/${encodeURIComponent(m.char)}`}
                    className="hover-card flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
                  >
                    <span lang="zh" className="hanzi text-xl text-primary">
                      {m.char}
                    </span>
                    <span className="text-sm">
                      {m.pinyin}
                      {m.hanViet && <span className="ml-1.5 text-xs font-bold text-hanviet uppercase">{m.hanViet}</span>}
                    </span>
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">
                Dùng như:{" "}
                {measures.slice(0, 3).map((m, i) => (
                  <span key={m.char}>
                    {i > 0 && " · "}
                    <span lang="zh" className="hanzi text-base text-foreground">
                      一{m.char}
                      {main.simplified.replace(/[（(][^）)]*[）)]/g, "")}
                    </span>
                  </span>
                ))}
              </p>
            </Section>
          )}

          {compounds.length > 0 && (
            <Section id="tu-ghep" icon="grid" title={<>Từ ghép có chữ <span lang="zh" className="hanzi text-primary">{Array.from(main.simplified)[0]}</span></>}>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {compounds.map((c) => (
                  <li key={c.simplified}>
                    <Link href={`/tu-dien/${encodeURIComponent(c.simplified)}`} className="hover-card flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5">
                      <span lang="zh" className="hanzi shrink-0 text-xl">
                        <Highlight text={c.simplified} word={Array.from(main.simplified)[0]} />
                      </span>
                      <span className="min-w-0">
                        {c.hanViet && <span className="block text-xs font-bold text-hanviet uppercase">{c.hanViet}</span>}
                        <span className="block truncate text-sm">{c.meaningVi?.split(";")[0]}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {related.length > 0 && (
            <Section
              id="chu-de"
              icon="route"
              title={topic ? `Cùng chủ đề: ${topic.title.replace(/\s*\(\d+\/\d+\)$/, "")}` : `Từ vựng ${hskLabel(main.hskLevel)} khác`}
              aside={
                topic ? (
                  <Link href={`/bai-hoc/${topic.id}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                    Học cả bài →
                  </Link>
                ) : undefined
              }
            >
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((r) => (
                  <li key={r.simplified}>
                    <Link href={`/tu-dien/${encodeURIComponent(r.simplified)}`} className="hover-card block rounded-xl border border-border bg-surface px-3 py-2.5">
                      <span lang="zh" className="hanzi block text-lg text-primary">
                        {r.simplified}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {r.pinyin}
                        {r.hanViet && <span className="ml-1 font-bold text-hanviet uppercase">{r.hanViet}</span>}
                      </span>
                      <span className="block truncate text-xs">{r.meaningVi?.split(";")[0]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section id="luyen" icon="target" title="Luyện với từ này">
            <WordPractice
              word={{
                id: main.id,
                simplified: main.simplified,
                pinyin: main.pinyin,
                pinyinNumeric: main.pinyinNumeric,
                audioUrl: main.audioUrl,
                meaningVi: main.meaningVi,
              }}
            />
          </Section>

          {/* Nghe từ trong câu thoại thật — KHÔNG trích câu thoại làm ví dụ (phụ đề dịch máy, xem server). */}
          {videos.length > 0 && (
            <Section id="video" icon="play" title={<>Nghe <span lang="zh" className="hanzi">{main.simplified}</span> trong video</>}>
              <ul className="space-y-2">
                {videos.map((v) => (
                  <li key={v.id}>
                    <Link href={`/watch/${v.id}`} className="hover-card flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
                      {v.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- ảnh YouTube ngoài miền
                        <img src={v.thumbnailUrl} alt="" loading="lazy" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium">{v.title}</span>
                        <span className="text-xs text-muted">{v.lineCount} câu có từ này</span>
                      </span>
                      <Icon name="play" size={16} className="mr-2 shrink-0 text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {glyphs.length > 0 && <GlyphPanel glyphs={glyphs} />}
          <section className="panel tint-primary p-5">
            <h2 className="text-sm font-bold">Học từ này trong lộ trình</h2>
            {topic ? (
              <>
                <p className="mt-1.5 text-sm text-muted">
                  {hskLabel(topic.hskLevel)} · Bài {topic.orderIndex}: {topic.title}
                </p>
                <LinkButton href={`/bai-hoc/${topic.id}`} className="mt-3 w-full">
                  Học bài này — 5 phút <Icon name="arrow" size={16} />
                </LinkButton>
              </>
            ) : (
              <LinkButton href="/bat-dau" className="mt-3 w-full">
                Học bài đầu tiên <Icon name="arrow" size={16} />
              </LinkButton>
            )}
            <p className="mt-3 text-xs leading-5 text-muted">Giới thiệu từ, luyện nghe – nhìn – ghép cặp, điền câu; miễn phí, khách cũng học được.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
