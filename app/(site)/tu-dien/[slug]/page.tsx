/**
 * Trang từ điển CÔNG KHAI cho 1 từ — `/tu-dien/[Hán tự]`.
 *
 * Đây là Server Component có chủ đích (KHÔNG "use client"): nội dung phải nằm
 * sẵn trong HTML trả về thì Google mới index được. Toàn bộ 10.9k từ trước đây
 * nằm sau đăng nhập ở `/vocabulary` nên vô hình với công cụ tìm kiếm — đây là
 * lý do lớn nhất khiến chưa ai tìm thấy Hanni (đo thật: sitemap chỉ có 6 URL).
 *
 * Nhắm đúng truy vấn người Việt hay tìm: "学生 nghĩa là gì", "âm Hán Việt của
 * 时间". Âm Hán Việt là thứ khiến trang này khác các từ điển Trung-Việt khác.
 */
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AudioButton } from "@/components/audio-button";
import { SentencePractice } from "@/components/ai/sentence-practice";
import { WordMnemonic } from "@/components/ai/word-mnemonic";
import { DictionarySearch, RememberWord } from "@/components/dictionary/dictionary-search";
import { StrokeOrder } from "@/components/dictionary/stroke-order";
import { Icon } from "@/components/icon";
import { SaveWordButton } from "@/components/save-word-button";
import { ToneCheck } from "@/components/tone/tone-check";
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

interface RelatedWord {
  simplified: string;
  pinyin: string;
  meaningVi: string | null;
}

/** Một chữ trong từ ghép, kèm âm Hán Việt và nghĩa riêng của chữ đó. */
interface CharBreakdown {
  char: string;
  hanViet: string | null;
  pinyin: string | null;
  meaningVi: string | null;
}

interface CompoundWord extends RelatedWord {
  hanViet: string | null;
}

/** Video có lời thoại chứa từ này — chỉ tên + số lần, KHÔNG trích câu thoại
 * (phụ đề dịch máy, xem ghi chú ở WordsService.videosUsingWord). */
interface VideoUsage {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  hskLevel: number | null;
  lineCount: number;
}

/**
 * MỌI mảng đều TUỲ CHỌN — không phải vì API có lúc không trả, mà vì phản hồi
 * được cache 24h (`revalidate`): sau khi API thêm field mới, các trang đã nằm
 * trong cache vẫn trả về hình dạng CŨ cho tới khi cache hết hạn. Đo thật
 * 2026-09-22: 3 trang (学生, 电脑, 苹果) trả 500 suốt vì payload cache còn
 * thiếu `videos` (2917 ký tự so với 3577 hiện tại — khớp chính xác phần
 * `videos` bị thiếu), `data.videos.length` ném TypeError. `generateMetadata`
 * chỉ đọc `words[0]` nên vẫn chạy, khiến trang có tiêu đề đúng mà thân trang
 * rỗng — rất khó nhận ra.
 *
 * Nguyên tắc rút ra: code client phải đọc được CẢ hình dạng cũ lẫn mới trong
 * khoảng thời gian bằng `revalidate`, không chỉ hình dạng mới nhất.
 */
interface LookupResult {
  words?: Word[];
  related?: RelatedWord[];
  characters?: CharBreakdown[];
  compounds?: CompoundWord[];
  videos?: VideoUsage[];
}

/** Trang tĩnh hoá lại mỗi 24h — nội dung từ điển gần như không đổi, không cần
 * gọi API mỗi lượt truy cập (quan trọng khi bot quét hàng nghìn trang). */
export const revalidate = 86400;

/** Danh sách rỗng + `dynamicParams` mặc định = KHÔNG prerender trang nào lúc
 * build (10.9k trang thì build cả tiếng), nhưng trang đã dựng được giữ lại và
 * phục vụ lại trong 24h. Không có dòng này thì route là "dynamic": mỗi lượt
 * bot bò là một lần render + một lần gọi API tới VPS. */
export function generateStaticParams() {
  return [];
}

const lookup = cache(async (slug: string) => {
  // Lỗi TẠM THỜI của API phải ném ra, không được biến thành 404 — xem
  // lib/public-fetch.ts (trang hỏng từng bị cache nguyên 24h kèm HTTP 200).
  return fetchPublic<LookupResult>(
    `/dictionary/${encodeURIComponent(slug)}`,
    revalidate,
  );
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  const w = data?.words?.[0];
  if (!w) return { title: "Không tìm thấy từ — Hanni" };

  const hanViet = w.hanViet ? ` (Hán Việt: ${w.hanViet})` : "";
  const nghia = w.meaningVi ?? w.meaningEn ?? "";
  const title = `${w.simplified} là gì? ${w.pinyin} — ${nghia} | Hanni`;
  const description = `${w.simplified} (${w.pinyin})${hanViet} nghĩa là "${nghia}". Từ vựng HSK ${w.hskLevel} — nghe phát âm chuẩn, xem câu ví dụ và học cùng Hanni.`;
  return {
    title,
    description,
    alternates: { canonical: `/tu-dien/${encodeURIComponent(w.simplified)}` },
    // Ảnh minh hoạ vào cả thẻ Open Graph để link chia sẻ ra ngoài có ảnh
    // thay vì chỉ một khối chữ.
    // Khai `openGraph` ở trang là thay HẲN của layout — không có ảnh minh hoạ
    // thì phải tự gắn lại ảnh chung, không link chia sẻ sẽ trơn không ảnh.
    openGraph: {
      title,
      description,
      images: [w.imageUrl ? { url: w.imageUrl } : { url: "/themes.png", width: 1672, height: 941 }],
    },
  };
}

export default async function TuDienPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  const words = data?.words ?? [];
  if (words.length === 0) notFound();

  const main = words[0];
  const characters = data?.characters ?? [];
  const compounds = data?.compounds ?? [];
  const videos = data?.videos ?? [];
  const related = data?.related ?? [];

  return (
    <div className="page-wrap max-w-6xl! space-y-6 py-8!">
      {/* Tra tiếp ngay trên trang từ như Hanzii — trước đó phải quay về /tu-dien mới gõ được. */}
      <DictionarySearch />
      <RememberWord s={main.simplified} p={main.pinyin} m={main.meaningVi} />
      <nav className="text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          Hanni
        </Link>{" "}
        ›{" "}
        <Link href="/tu-dien" className="hover:text-primary">
          Từ điển
        </Link>{" "}
        › <span className="text-foreground">{main.simplified}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {words.map((w, wi) => {
            const Title = wi === 0 ? "h1" : "h2";
            const list = senses(w.meaningVi ?? w.meaningEn ?? "");
            return (
              <article key={w.id} className="panel p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Title lang="zh" className="hanzi text-6xl text-primary">
                      {w.simplified}
                    </Title>
                    {w.traditional && w.traditional !== w.simplified && (
                      <p className="mt-2 text-xs text-muted">
                        Phồn thể:{" "}
                        <span lang="zh" className="hanzi text-sm">
                          {w.traditional}
                        </span>
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                    {hskLabel(w.hskLevel)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-xl font-semibold">{w.pinyin}</span>
                  {w.audioUrl && (
                    <AudioButton
                      src={w.audioUrl}
                      size={19}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
                    />
                  )}
                  {w.hanViet && (
                    <span className="rounded-full bg-primary/8 px-3 py-1 text-sm">
                      <span className="text-muted">Hán Việt </span>
                      <strong className="text-primary">{w.hanViet}</strong>
                    </span>
                  )}
                </div>

                <section className="mt-6" aria-label="Nghĩa">
                  {w.pos.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {w.pos.map((p) => (
                        <span key={p} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
                          {POS_VI[p] ?? p}
                        </span>
                      ))}
                    </div>
                  )}
                  {list.length > 1 ? (
                    <ol className="list-decimal space-y-1 pl-5 text-base font-medium marker:text-sm marker:text-muted">
                      {list.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-base font-medium">{list[0] ?? "Đang cập nhật"}</p>
                  )}
                </section>

                <div className="mt-4">
                  <WordMnemonic wordId={w.id} initial={w.mnemonicVi ?? null} />
                </div>

                {/* Ảnh minh hoạ (Wikimedia Commons — giấy phép tự do, xem
                 * hanni-server/CLAUDE.md). Dùng <img> thường chứ không next/image:
                 * ảnh đến từ domain ngoài và chỉ là minh hoạ phụ. */}
                {w.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.imageUrl}
                    alt={`Ảnh minh hoạ cho từ ${w.simplified} (${w.meaningVi ?? ""})`}
                    loading="lazy"
                    className="mt-5 max-h-56 w-full rounded-xl object-cover"
                  />
                )}

                <div className="mt-5">
                  <SaveWordButton wordId={w.id} simplified={w.simplified} />
                </div>
                <div className="mt-4 max-w-md">
                  <ToneCheck hanzi={w.simplified} pinyin={w.pinyin} pinyinNumeric={w.pinyinNumeric} audioUrl={w.audioUrl} align="start" />
                </div>
                <div className="mt-4">
                  <SentencePractice word={{ id: w.id, simplified: w.simplified, meaningVi: w.meaningVi }} />
                </div>

                {w.examples && w.examples.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <h2 className="text-sm font-semibold">Câu ví dụ</h2>
                    <ul className="mt-3 space-y-3">
                      {w.examples.map((ex) => (
                        <li key={ex.id} className="text-sm">
                          <p lang="zh" className="hanzi text-base">
                            {ex.zh}
                          </p>
                          {ex.pinyin && <p className="mt-0.5 text-xs text-muted">{ex.pinyin}</p>}
                          {(ex.vi || ex.en) && <p className="mt-0.5 text-muted">{ex.vi ?? ex.en}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}

          {/* Phân tích từng chữ — chỗ khai thác sâu nhất lợi thế Hán Việt: đọc
           * "điện + não" là người Việt đoán ra 电脑 = máy tính, không cần học
           * thuộc. Cũng làm trang dày hơn hẳn cho SEO. */}
          {characters.length > 0 && (
            <section className="panel p-6">
              <h2 className="text-sm font-semibold">
                Phân tích từng chữ
                {main.hanViet && (
                  <span className="ml-2 font-normal text-muted">
                    — {main.simplified} đọc là &quot;{main.hanViet}&quot;
                  </span>
                )}
              </h2>
              <ul className="mt-4 space-y-3">
                {characters.map((c, i) => (
                  <li
                    key={`${c.char}-${i}`}
                    className="flex items-start gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/tu-dien/${encodeURIComponent(c.char)}`}
                      lang="zh"
                      className="hanzi shrink-0 text-3xl text-primary hover:underline"
                    >
                      {c.char}
                    </Link>
                    <div className="min-w-0 text-sm">
                      {c.hanViet && (
                        <p className="font-semibold text-primary">{c.hanViet}</p>
                      )}
                      {c.pinyin && <p className="text-xs text-muted">{c.pinyin}</p>}
                      <p className="mt-0.5">
                        {c.meaningVi ?? (
                          <span className="text-muted">
                            (chữ này không đứng riêng thành từ)
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {compounds.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold">
                Từ khác chứa chữ{" "}
                <span lang="zh" className="hanzi text-primary">
                  {Array.from(main.simplified)[0]}
                </span>
              </h2>
              <p className="mt-1 text-xs text-muted">
                Gặp lại cùng một chữ trong nhiều từ là cách nhớ chắc nhất — và đoán
                được nghĩa của từ mới.
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {compounds.map((c) => (
                  <li key={c.simplified}>
                    <Link
                      href={`/tu-dien/${encodeURIComponent(c.simplified)}`}
                      className="panel hover-card flex items-center gap-3 px-4 py-3 text-sm"
                    >
                      <span lang="zh" className="hanzi text-xl text-primary">
                        {c.simplified}
                      </span>
                      <span className="min-w-0">
                        {c.hanViet && (
                          <span className="block text-xs font-semibold text-primary">
                            {c.hanViet}
                          </span>
                        )}
                        <span className="block truncate">{c.meaningVi}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Nghe từ trong ngữ cảnh thật. Cố tình KHÔNG trích câu thoại ra làm
           * ví dụ — phụ đề là dịch máy từ phim tu tiên, trích ra sẽ dạy sai. */}
          {videos.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold">
                Nghe {main.simplified} trong video
              </h2>
              <p className="mt-1 text-xs text-muted">
                Gặp từ trong câu thoại thật, có giọng bản ngữ và phụ đề chạy theo.
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {videos.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/watch/${v.id}`}
                      className="panel hover-card block overflow-hidden"
                    >
                      {v.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="h-24 w-full object-cover"
                        />
                      )}
                      <span className="block p-3">
                        <span className="line-clamp-2 text-xs font-medium">
                          {v.title}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">
                          {v.lineCount} câu có từ này
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* Cột phải như trang từ của Hanzii: cách viết (hoạt hình thứ tự nét) + lời mời học. */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold">Cách viết</h2>
            <StrokeOrder text={main.simplified} />
          </section>
          <section className="panel tint-primary p-5 text-center">
            <h2 className="text-base font-bold tracking-tight">
              Học {main.simplified} cùng {main.hanViet ? "âm Hán Việt" : "Hanni"}
            </h2>
            <p className="mx-auto mt-2 text-sm leading-6 text-muted">
              10.900+ từ vựng HSK 3.0 kèm âm Hán Việt, ôn lặp lại ngắt quãng để nhớ lâu — miễn phí toàn bộ nội dung học.
            </p>
            {/* Mời HỌC THỬ trước, không mời đăng ký ngay: người từ Google vào đây
             * chưa biết học ở Hanni ra sao mà đã bị đòi tạo tài khoản thì phần lớn
             * rời đi. Cho nếm thử rồi mới mời, lúc đó lời mời mới có sức nặng. */}
            <LinkButton href="/bat-dau" className="mt-4 w-full">
              Học bài đầu tiên
              <Icon name="arrow" size={16} />
            </LinkButton>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">
            Từ vựng {hskLabel(main.hskLevel)} khác
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.simplified}>
                <Link
                  href={`/tu-dien/${encodeURIComponent(r.simplified)}`}
                  className="panel hover-card flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <span lang="zh" className="hanzi text-xl text-primary">
                    {r.simplified}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{r.pinyin}</span>
                    <span className="block truncate">{r.meaningVi}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
