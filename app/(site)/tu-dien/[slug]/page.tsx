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
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { SaveWordButton } from "@/components/save-word-button";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import { fetchPublic } from "@/lib/public-fetch";
import type { Word } from "@/lib/types";

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

interface LookupResult {
  words: Word[];
  related: RelatedWord[];
  characters: CharBreakdown[];
  compounds: CompoundWord[];
  videos: VideoUsage[];
}

/** Trang tĩnh hoá lại mỗi 24h — nội dung từ điển gần như không đổi, không cần
 * gọi API mỗi lượt truy cập (quan trọng khi bot quét hàng nghìn trang). */
export const revalidate = 86400;

function lookup(slug: string) {
  // Lỗi TẠM THỜI của API phải ném ra, không được biến thành 404 — xem
  // lib/public-fetch.ts (trang hỏng từng bị cache nguyên 24h kèm HTTP 200).
  return fetchPublic<LookupResult>(
    `/dictionary/${encodeURIComponent(slug)}`,
    revalidate,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  const w = data?.words[0];
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
    openGraph: w.imageUrl
      ? { title, description, images: [{ url: w.imageUrl }] }
      : { title, description },
  };
}

export default async function TuDienPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await lookup(decodeURIComponent(slug));
  if (!data || data.words.length === 0) notFound();

  const main = data.words[0];

  return (
    <div className="page-wrap max-w-3xl! space-y-6 py-10!">
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

      {data.words.map((w) => (
        <article key={w.id} className="panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 lang="zh" className="hanzi text-6xl text-primary">
                {w.simplified}
              </h1>
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
              HSK {w.hskLevel}
            </span>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Phiên âm</dt>
              <dd className="font-semibold">{w.pinyin}</dd>
            </div>
            {w.hanViet && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted">Âm Hán Việt</dt>
                <dd className="font-bold text-primary">{w.hanViet}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Nghĩa</dt>
              <dd className="font-semibold">
                {w.meaningVi ?? w.meaningEn ?? "Đang cập nhật"}
              </dd>
            </div>
            {w.pos.length > 0 && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-muted">Từ loại</dt>
                <dd>{w.pos.join(" · ")}</dd>
              </div>
            )}
          </dl>

          {/* Ảnh minh hoạ (Wikimedia Commons — giấy phép tự do, xem
           * hanni-server/CLAUDE.md). Dùng <img> thường chứ không next/image:
           * ảnh đến từ domain ngoài và chỉ là minh hoạ phụ, thêm domain vào
           * cấu hình next/image cho 2 host Wikimedia là phức tạp thừa. */}
          {w.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.imageUrl}
              alt={`Ảnh minh hoạ cho từ ${w.simplified} (${w.meaningVi ?? ""})`}
              loading="lazy"
              className="mt-5 max-h-56 w-full rounded-xl object-cover"
            />
          )}

          {w.audioUrl && (
            <audio
              controls
              preload="none"
              src={`${API_BASE.replace(/\/api\/?$/, "")}${w.audioUrl}`}
              className="mt-5 h-9 w-full max-w-xs"
            >
              Trình duyệt của bạn không hỗ trợ phát audio.
            </audio>
          )}

          <div className="mt-5">
            <SaveWordButton wordId={w.id} simplified={w.simplified} />
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
                    {ex.pinyin && (
                      <p className="mt-0.5 text-xs text-muted">{ex.pinyin}</p>
                    )}
                    {(ex.vi || ex.en) && (
                      <p className="mt-0.5 text-muted">{ex.vi ?? ex.en}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}

      {/* Phân tích từng chữ — chỗ khai thác sâu nhất lợi thế Hán Việt: đọc
       * "điện + não" là người Việt đoán ra 电脑 = máy tính, không cần học
       * thuộc. Cũng làm trang dày hơn hẳn cho SEO. */}
      {data.characters.length > 0 && (
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
            {data.characters.map((c, i) => (
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

      {data.compounds.length > 0 && (
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
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.compounds.map((c) => (
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
      {data.videos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">
            Nghe {main.simplified} trong video
          </h2>
          <p className="mt-1 text-xs text-muted">
            Gặp từ trong câu thoại thật, có giọng bản ngữ và phụ đề chạy theo.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {data.videos.map((v) => (
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

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Học {main.simplified} cùng {main.hanViet ? "âm Hán Việt" : "Hanni"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Hanni có 10.900+ từ vựng HSK 3.0 kèm âm Hán Việt — lợi thế riêng của
          người Việt khi học tiếng Trung. Flashcard lặp lại ngắt quãng giúp bạn
          nhớ lâu, miễn phí toàn bộ nội dung học.
        </p>
        {/* Mời HỌC THỬ trước, không mời đăng ký ngay: người từ Google vào đây
         * chưa biết học ở Hanni ra sao mà đã bị đòi tạo tài khoản thì phần lớn
         * rời đi. Cho nếm thử rồi mới mời, lúc đó lời mời mới có sức nặng. */}
        <LinkButton href="/hoc-thu" className="mt-4">
          Học thử 8 từ — không cần đăng ký
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>

      {data.related.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">
            Từ vựng HSK {main.hskLevel} khác
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.related.map((r) => (
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
