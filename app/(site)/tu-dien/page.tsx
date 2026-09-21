/**
 * Trang chủ từ điển công khai — điểm vào để Google crawl tới các trang từ.
 * Server Component (không "use client") vì cùng mục đích SEO như `[slug]`.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Từ điển Hán Việt — Tra từ vựng tiếng Trung HSK | Hanni",
  description:
    "Tra 10.900+ từ vựng tiếng Trung theo chuẩn HSK 3.0: Hán tự, phiên âm pinyin, âm Hán Việt, nghĩa tiếng Việt và audio phát âm chuẩn. Miễn phí.",
  alternates: { canonical: "/tu-dien" },
};

interface SlugRow {
  simplified: string;
}

/** Lấy các từ phổ biến nhất làm danh sách gợi ý — `publicSlugs()` đã sắp theo
 * `frequencyRank` nên phần đầu chính là từ hay gặp nhất. */
async function popularSlugs(): Promise<string[]> {
  // try/catch vì fetch THROW (không trả response) khi API không phản hồi được,
  // vd lúc build production mà server chưa chạy — trang vẫn phải dựng được.
  try {
    const res = await fetch(`${API_BASE}/dictionary/slugs`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as SlugRow[];
    return rows.slice(0, 120).map((r) => r.simplified);
  } catch {
    return [];
  }
}

export default async function TuDienIndexPage() {
  const slugs = await popularSlugs();

  return (
    <div className="page-wrap max-w-4xl! space-y-8 py-12!">
      <section className="text-center">
        <span className="eyebrow">TỪ ĐIỂN HÁN VIỆT</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Tra từ vựng tiếng Trung
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          Hơn 10.900 từ theo chuẩn HSK 3.0 — mỗi từ có Hán tự, phiên âm pinyin,
          <strong className="text-foreground"> âm Hán Việt</strong>, nghĩa tiếng
          Việt và audio phát âm chuẩn. Tra cứu miễn phí, không cần đăng nhập.
        </p>
        <LinkButton href="/onboarding" className="mt-6">
          Học có lộ trình cùng Hanni
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>

      {slugs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">Từ vựng thông dụng nhất</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {slugs.map((s) => (
              <li key={s}>
                <Link
                  href={`/tu-dien/${encodeURIComponent(s)}`}
                  lang="zh"
                  className="hanzi panel hover-card inline-block px-3.5 py-2 text-lg"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
