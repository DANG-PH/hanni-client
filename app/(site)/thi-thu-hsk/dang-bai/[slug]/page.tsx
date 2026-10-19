/**
 * Luyện từng dạng bài HSK — 1 phần đề (vd "HSK 3 · Viết · Phần 1 · Sắp xếp từ
 * thành câu") gom từ mọi đề cùng cấp, làm câu nào chấm câu đó (như "Luyện từng
 * dạng bài" của Migii HSK). Trang công khai cho SEO: đề render sẵn từ server.
 * Nằm trong `(site)` (người đã đăng nhập vẫn có sidebar), khác `/thi-thu-hsk/
 * [slug]` là phòng thi khung tập trung.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { PracticeRunner } from "@/components/mock-exam/practice-runner";
import { API_BASE } from "@/lib/api";
import { SECTION_SHORT, SECTION_VI, partInfo } from "@/lib/mock-exam";
import { fetchPublic } from "@/lib/public-fetch";
import type { MockPracticeSet, MockPracticeSetMeta } from "@/lib/types";

export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

const PART_ZH = ["第一部分", "第二部分", "第三部分", "第四部分"];

function setOf(slug: string) {
  return fetchPublic<MockPracticeSet>(`/mock-exams/practice/${encodeURIComponent(slug)}`, revalidate);
}

/** Các dạng khác cùng cấp — để chuyển dạng; lỗi thì bỏ qua (chỉ là liên kết phụ). */
async function siblingsOf(level: number): Promise<MockPracticeSetMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/mock-exams/practice`, { next: { revalidate } });
    if (!res.ok) return [];
    return ((await res.json()) as MockPracticeSetMeta[]).filter((s) => s.level === level);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const set = await setOf(slug);
  if (!set) return { title: "Luyện dạng bài HSK | Hanni" };
  const info = partInfo(set.section, set.type);
  return {
    title: `Luyện dạng bài HSK ${set.level}: ${info.label} — ${set.count} câu có chữa | Hanni`,
    description: `${set.count} câu "${info.label}" (${SECTION_VI[set.section].vi} phần ${set.part}) lấy từ đề thi thử HSK ${set.level} đúng cấu trúc đề thật. Làm câu nào chấm câu đó, chữa bài tiếng Việt: lời thoại, bản dịch, từ vựng kèm âm Hán Việt. Miễn phí, không cần đăng ký.`,
    alternates: { canonical: `/thi-thu-hsk/dang-bai/${slug}` },
  };
}

export default async function PracticeSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const set = await setOf(slug);
  if (!set) notFound();
  const siblings = await siblingsOf(set.level);
  const info = partInfo(set.section, set.type);
  const exams = new Set(set.groups.map((g) => g.examSlug)).size;

  return (
    <div className="page-wrap max-w-4xl! space-y-6 py-8!">
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/thi-thu-hsk" className="hover:text-primary">
          Luyện thi HSK
        </Link>
        <Icon name="chevron" size={14} className="-rotate-90" />
        <span>Luyện dạng bài HSK {set.level}</span>
      </nav>

      <header className="panel tint-primary p-6 sm:p-7">
        <p className="text-xs font-bold tracking-wider text-primary">
          LUYỆN TỪNG DẠNG BÀI · HSK {set.level} · {SECTION_VI[set.section].vi.toUpperCase()}{" "}
          <span lang="zh" className="hanzi">
            {PART_ZH[set.part - 1]}
          </span>
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">{info.label}</h1>
        <p className="mt-2 text-sm text-muted">
          {set.count} câu từ {exams} đề thi thử HSK {set.level} — làm câu nào chấm và chữa câu đó, không tính giờ.
        </p>
        {info.tip && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface/70 px-4 py-3 text-sm leading-6">
            <Icon name="spark" size={16} className="mt-1 shrink-0 text-primary" />
            <span>
              <strong>Mẹo:</strong> {info.tip}
            </span>
          </p>
        )}
      </header>

      {siblings.length > 1 && (
        <nav aria-label="Dạng bài khác" className="flex gap-2 overflow-x-auto pb-1">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              href={`/thi-thu-hsk/dang-bai/${s.slug}`}
              aria-current={s.slug === set.slug ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                s.slug === set.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-primary/40"
              }`}
            >
              {SECTION_SHORT[s.section]} {s.part} · {partInfo(s.section, s.type).label}
            </Link>
          ))}
        </nav>
      )}

      <PracticeRunner set={set} />
    </div>
  );
}
