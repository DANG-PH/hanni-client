/**
 * Trang ngữ pháp CÔNG KHAI — `/ngu-phap/[slug]`.
 *
 * 235 điểm ngữ pháp có giải thích soạn tay là tài sản hiếm nhất của Hanni
 * (không phải dữ liệu mở cào về như từ vựng), và cạnh tranh SEO cho truy vấn
 * ngữ pháp thấp hơn từ vựng nhiều — "cách dùng 把", "phân biệt 了 và 过" ít
 * trang tiếng Việt chất lượng. Giấu sau đăng nhập thì Google không thấy.
 *
 * Server Component, cùng khuôn với `/tu-dien/[slug]`.
 */
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { fetchPublic } from "@/lib/public-fetch";

interface GrammarExample {
  zh: string;
  pinyin?: string | null;
  vi?: string | null;
}

interface GrammarPoint {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
  explanationVi: string;
  patterns: string[];
  examples: GrammarExample[];
}

export const revalidate = 86400;

const fetchPoint = cache(async (slug: string) => {
  // Lỗi tạm thời ném ra thay vì hoá thành 404 — xem lib/public-fetch.ts.
  return fetchPublic<GrammarPoint>(
    `/grammar/${encodeURIComponent(slug)}`,
    revalidate,
  );
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await fetchPoint(slug);
  if (!p) return { title: "Không tìm thấy điểm ngữ pháp — Hanni" };
  return {
    title: `${p.titleVi} — Ngữ pháp HSK ${p.hskLevel} | Hanni`,
    description: `${p.summaryVi} Giải thích chi tiết kèm mẫu câu và ví dụ có pinyin, dành cho người Việt học tiếng Trung.`,
    alternates: { canonical: `/ngu-phap/${encodeURIComponent(p.slug)}` },
  };
}

export default async function NguPhapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await fetchPoint(slug);
  if (!p || !p.explanationVi) notFound();

  return (
    <div className="page-wrap max-w-3xl! space-y-6 py-10!">
      <nav className="text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          Hanni
        </Link>{" "}
        ›{" "}
        <Link href="/ngu-phap" className="hover:text-primary">
          Ngữ pháp
        </Link>{" "}
        › <span className="text-foreground">{p.titleZh}</span>
      </nav>

      <article className="panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{p.titleVi}</h1>
            <p lang="zh" className="hanzi mt-2 text-3xl text-primary">
              {p.titleZh}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            HSK {p.hskLevel}
          </span>
        </div>

        <p className="mt-5 text-sm leading-7 text-muted">{p.summaryVi}</p>

        {p.patterns.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold">Mẫu câu</h2>
            <ul className="mt-3 space-y-2">
              {p.patterns.map((pt) => (
                <li
                  key={pt}
                  className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm"
                >
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-semibold">Giải thích</h2>
          {/* explanationVi xuống dòng bằng \n (xem schema) — tách thành đoạn
           * thay vì đổ nguyên khối chữ liền. */}
          <div className="mt-3 space-y-2 text-sm leading-7">
            {p.explanationVi
              .split("\n")
              .filter((line) => line.trim())
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        </div>

        {p.examples.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <h2 className="text-sm font-semibold">Ví dụ</h2>
            <ul className="mt-3 space-y-4">
              {p.examples.map((ex, i) => (
                <li key={i}>
                  <p lang="zh" className="hanzi text-base">
                    {ex.zh}
                  </p>
                  {ex.pinyin && (
                    <p className="mt-0.5 text-xs text-muted">{ex.pinyin}</p>
                  )}
                  {ex.vi && <p className="mt-0.5 text-sm">{ex.vi}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Hiểu ngữ pháp rồi, giờ dùng được chưa?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Hanni xếp ngữ pháp HSK {p.hskLevel} cùng với từ vựng cùng cấp thành
          bài học theo chủ đề, và nhắc bạn ôn đúng lúc sắp quên — miễn phí toàn
          bộ nội dung học.
        </p>
        <LinkButton href="/hoc-thu" className="mt-4">
          Học thử — không cần đăng ký
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>
    </div>
  );
}
