/**
 * Danh sách ngữ pháp CÔNG KHAI — điểm vào để Google crawl tới từng điểm.
 * Lọc theo cấp qua `searchParams` nên mỗi cấp cũng là 1 URL index được.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

interface GrammarListItem {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
  /** false = chỉ là mục đại cương rút gọn, chưa có giải thích thật */
  flat?: boolean;
}

export const revalidate = 86400;

const LEVELS = [1, 2, 3, 4, 5, 6, 7];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}): Promise<Metadata> {
  const { level } = await searchParams;
  const lv = Number(level);
  if (LEVELS.includes(lv)) {
    return {
      title: `Ngữ pháp HSK ${lv} — Giải thích tiếng Việt kèm ví dụ | Hanni`,
      description: `Tổng hợp điểm ngữ pháp HSK ${lv}: mẫu câu, giải thích bằng tiếng Việt và ví dụ có pinyin. Miễn phí, không cần đăng nhập.`,
      alternates: { canonical: `/ngu-phap?level=${lv}` },
    };
  }
  return {
    title: "Ngữ pháp tiếng Trung HSK — Giải thích tiếng Việt | Hanni",
    description:
      "Điểm ngữ pháp tiếng Trung theo chuẩn HSK 3.0, giải thích bằng tiếng Việt kèm mẫu câu và ví dụ có pinyin. Tra cứu miễn phí.",
    alternates: { canonical: "/ngu-phap" },
  };
}

async function fetchList(level?: number): Promise<GrammarListItem[]> {
  try {
    const qs = level ? `?level=${level}` : "";
    const res = await fetch(`${API_BASE}/grammar${qs}`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    return (await res.json()) as GrammarListItem[];
  } catch {
    return [];
  }
}

export default async function NguPhapIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const sp = await searchParams;
  const lvNum = Number(sp.level);
  const level = LEVELS.includes(lvNum) ? lvNum : 1;
  const all = await fetchList(level);
  // Chỉ liệt kê mục CÓ giải thích thật — mục đại cương rút gọn mở ra là ngõ
  // cụt, không nên mời Google lẫn người đọc vào.
  const items = all.filter((g) => g.flat !== true);

  return (
    <div className="page-wrap max-w-4xl! space-y-7 py-10!">
      <section className="text-center">
        <span className="eyebrow">NGỮ PHÁP TIẾNG TRUNG</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Ngữ pháp HSK {level}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
          Giải thích bằng tiếng Việt, kèm mẫu câu và ví dụ có pinyin — không
          phải bản dịch máy. Tra cứu miễn phí, không cần đăng nhập.
        </p>
      </section>

      <nav aria-label="Lọc theo cấp HSK" className="flex flex-wrap gap-2">
        {LEVELS.map((lv) => (
          <Link
            key={lv}
            href={`/ngu-phap?level=${lv}`}
            aria-current={level === lv ? "page" : undefined}
            className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
              level === lv
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:border-primary/40 hover:text-primary"
            }`}
          >
            HSK {lv === 7 ? "7–9" : lv}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Cấp này chưa có điểm ngữ pháp nào được giải thích chi tiết.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/ngu-phap/${encodeURIComponent(g.slug)}`}
                className="panel hover-card flex h-full flex-col gap-2 p-4"
              >
                <span lang="zh" className="hanzi text-2xl text-primary">
                  {g.titleZh}
                </span>
                <span className="text-sm font-semibold">{g.titleVi}</span>
                <span className="line-clamp-2 text-xs leading-5 text-muted">
                  {g.summaryVi}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Học ngữ pháp cùng từ vựng, không tách rời
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Hanni gắn điểm ngữ pháp vào đúng bài học chứa từ vựng liên quan, nên
          bạn gặp lại cấu trúc ngay khi đang dùng nó.
        </p>
        <LinkButton href="/hoc-thu" className="mt-4">
          Học thử — không cần đăng ký
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>
    </div>
  );
}
