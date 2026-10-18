/**
 * Từ điển / thư viện từ vựng CÔNG KHAI — thay thế hẳn `/vocabulary` cũ.
 *
 * Trước đây có 2 trang hiển thị CÙNG dữ liệu: `/vocabulary` (cần đăng nhập,
 * client component nên Google không đọc được) và `/tu-dien` (công khai).
 * Trùng lặp và rời rạc — giờ gộp làm một: ai cũng tra được, đăng nhập thì
 * có thêm lối vào flashcard. `/vocabulary` chuyển hướng sang đây.
 *
 * Server Component có chủ đích: lọc cấp + phân trang đi qua `searchParams`
 * (URL `?level=2&page=3`) nên MỖI trang lọc cũng là 1 URL Google index được,
 * thay vì state trong trình duyệt mà bot không thấy.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { SentenceAnalysis } from "@/components/ai/sentence-analysis";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";
import { fetchPublic } from "@/lib/public-fetch";
import type { Paginated, Word } from "@/lib/types";

export const revalidate = 86400;

const LEVELS: readonly number[] = HSK_LEVELS;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string }>;
}): Promise<Metadata> {
  const { level, q } = await searchParams;
  const lv = Number(level);
  if (q) {
    return {
      title: `Tra "${q}" — Từ điển tiếng Trung | Hanni`,
      robots: { index: false }, // trang kết quả tìm kiếm: không nên index
    };
  }
  if (LEVELS.includes(lv)) {
    return {
      title: `Từ vựng ${hskLabel(lv)} — Danh sách đầy đủ kèm âm Hán Việt | Hanni`,
      description: `Tra toàn bộ từ vựng ${hskLabel(lv)} theo chuẩn HSK 3.0: Hán tự, pinyin, âm Hán Việt, nghĩa tiếng Việt và audio phát âm chuẩn. Miễn phí, không cần đăng nhập.`,
      alternates: { canonical: `/tu-dien?level=${lv}` },
    };
  }
  return {
    title: "Từ điển Hán Việt — Tra từ vựng tiếng Trung HSK | Hanni",
    description:
      "Tra 10.900+ từ vựng tiếng Trung theo chuẩn HSK 3.0: Hán tự, phiên âm pinyin, âm Hán Việt, nghĩa tiếng Việt và audio phát âm chuẩn. Miễn phí.",
    alternates: { canonical: "/tu-dien" },
  };
}

async function fetchWords(
  level: number | undefined,
  q: string | undefined,
  page: number,
): Promise<Paginated<Word> | null> {
  const params = new URLSearchParams({ page: String(page), pageSize: "24" });
  if (level) params.set("level", String(level));
  if (q) params.set("q", q);
  // Lỗi tạm thời ném ra thay vì hoá thành trang rỗng bị cache 24h — xem
  // lib/public-fetch.ts.
  return fetchPublic<Paginated<Word>>(`/words?${params}`, revalidate);
}

/** Gõ cả CÂU (hoặc cụm không có mục từ nào) thì mời phân tích/dịch bằng AI — như Hanzii
 * dịch câu ngay trong ô tra. Câu: ≥ 5 chữ Hán, ≥ 3 chữ Hán có dấu câu/khoảng trắng, hoặc
 * ≥ 3 từ tiếng Việt; cụm 2 chữ/2 từ chỉ mời khi không trùng mục từ nào. */
function offerAnalysis(q: string, items: Word[]): boolean {
  const han = (q.match(/\p{Script=Han}/gu) ?? []).length;
  const words = q.split(/\s+/).filter(Boolean).length;
  if (han >= 5 || (han >= 3 && /[，。！？、,.!?\s]/.test(q)) || (han === 0 && words >= 3)) return true;
  const lower = q.toLowerCase();
  const exact = items.some(
    (w) =>
      w.simplified === q ||
      w.hanViet?.toLowerCase() === lower ||
      w.meaningVi?.split(";")[0].trim().toLowerCase() === lower,
  );
  return !exact && (han >= 2 || (han === 0 && words >= 2));
}

export default async function TuDienPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  // Dữ liệu gộp HSK 7–9 thành cấp 7 — link cũ ?level=8/9 từng là trang rỗng.
  if (sp.level === "8" || sp.level === "9") permanentRedirect("/tu-dien?level=7");
  const q = sp.q?.trim() || undefined;
  const lvNum = Number(sp.level);
  const level = LEVELS.includes(lvNum) ? lvNum : q ? undefined : 1;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await fetchWords(level, q, page);

  const qs = (next: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (next.level ?? level) p.set("level", String(next.level ?? level));
    if (next.q ?? q) p.set("q", String(next.q ?? q));
    if (next.page && Number(next.page) > 1) p.set("page", String(next.page));
    return p.toString() ? `/tu-dien?${p}` : "/tu-dien";
  };

  return (
    <div className="page-wrap max-w-5xl! space-y-7 py-10!">
      <section className="text-center">
        <span className="eyebrow">TỪ ĐIỂN HÁN VIỆT</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {q
            ? `Kết quả cho "${q}"`
            : level
              ? `Từ vựng ${hskLabel(level)}`
              : "Tra từ vựng tiếng Trung"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
          Hơn 10.900 từ theo chuẩn HSK 3.0 — mỗi từ có Hán tự, pinyin,
          <strong className="text-foreground"> âm Hán Việt</strong>, nghĩa tiếng
          Việt và audio. Tra miễn phí, không cần đăng nhập.
        </p>
      </section>

      {/* Gợi ý khi gõ, lịch sử tra, giọng nói — vẫn là form GET nên không JS vẫn tra được. */}
      <DictionarySearch defaultValue={q ?? ""} showScan />
      {q && offerAnalysis(q, data?.items ?? []) && <SentenceAnalysis key={q} text={q} />}

      {/* Điện thoại: 1 hàng cuộn ngang thay vì 2 hàng chip. */}
      <nav
        aria-label="Lọc theo cấp HSK"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {LEVELS.map((lv) => (
          <Link
            key={lv}
            href={`/tu-dien?level=${lv}`}
            aria-current={level === lv ? "page" : undefined}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
              level === lv
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:border-primary/40 hover:text-primary"
            }`}
          >
            {hskLabel(lv)}
          </Link>
        ))}
      </nav>

      {!data ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Chưa tải được dữ liệu từ vựng. Vui lòng thử lại sau.
        </p>
      ) : data.items.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Không tìm thấy từ nào khớp. Thử một Hán tự, pinyin hoặc nghĩa khác.
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                  className="panel hover-card flex h-full flex-col gap-2 p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span lang="zh" className="hanzi text-3xl text-primary">
                      {w.simplified}
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                      {hskLabel(w.hskLevel)}
                    </span>
                  </div>
                  {/* Ảnh minh hoạ nếu có (danh từ cụ thể HSK1-5) — vừa dễ
                   * lướt hơn một lưới toàn chữ, vừa làm trang dày hơn cho
                   * SEO. Trang này render phía server nên ảnh nằm sẵn trong
                   * HTML, không cần JS. */}
                  {w.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  )}
                  <span className="text-xs text-muted">{w.pinyin}</span>
                  {w.hanViet && (
                    <span className="text-xs font-semibold text-primary">
                      Hán Việt: {w.hanViet}
                    </span>
                  )}
                  <span className="line-clamp-2 text-sm">
                    {w.meaningVi ?? w.meaningEn ?? "Đang cập nhật"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <nav
              aria-label="Phân trang"
              className="flex items-center justify-center gap-3 text-sm"
            >
              {page > 1 && (
                <Link
                  href={qs({ page: page - 1 })}
                  className="text-primary hover:underline"
                >
                  ← Trước
                </Link>
              )}
              <span className="text-muted">
                Trang {data.page}/{data.totalPages}
              </span>
              {page < data.totalPages && (
                <Link
                  href={qs({ page: page + 1 })}
                  className="text-primary hover:underline"
                >
                  Sau →
                </Link>
              )}
            </nav>
          )}
        </>
      )}

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Học có lộ trình, nhớ lâu hơn
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Tra từ là bước đầu. Hanni xếp{" "}
          {level ? hskLabel(level) : "toàn bộ 9 cấp"} thành bài học theo chủ đề
          và nhắc bạn ôn đúng lúc sắp quên — miễn phí toàn bộ nội dung học.
        </p>
        <LinkButton href="/bat-dau" className="mt-4">
          Học bài đầu tiên — miễn phí
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>
    </div>
  );
}
