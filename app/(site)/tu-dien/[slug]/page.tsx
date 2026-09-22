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
import type { Word } from "@/lib/types";

interface RelatedWord {
  simplified: string;
  pinyin: string;
  meaningVi: string | null;
}

interface LookupResult {
  words: Word[];
  related: RelatedWord[];
}

/** Trang tĩnh hoá lại mỗi 24h — nội dung từ điển gần như không đổi, không cần
 * gọi API mỗi lượt truy cập (quan trọng khi bot quét hàng nghìn trang). */
export const revalidate = 86400;

async function lookup(slug: string): Promise<LookupResult | null> {
  // try/catch chứ không chỉ kiểm tra res.ok: khi API không phản hồi được
  // (build/ISR lúc server chưa chạy) thì fetch THROW chứ không trả response.
  try {
    const res = await fetch(
      `${API_BASE}/dictionary/${encodeURIComponent(slug)}`,
      { next: { revalidate } },
    );
    if (!res.ok) return null;
    return (await res.json()) as LookupResult;
  } catch {
    return null;
  }
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
  return {
    title: `${w.simplified} là gì? ${w.pinyin} — ${nghia} | Hanni`,
    description: `${w.simplified} (${w.pinyin})${hanViet} nghĩa là "${nghia}". Từ vựng HSK ${w.hskLevel} — nghe phát âm chuẩn, xem câu ví dụ và học cùng Hanni.`,
    alternates: { canonical: `/tu-dien/${encodeURIComponent(w.simplified)}` },
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
