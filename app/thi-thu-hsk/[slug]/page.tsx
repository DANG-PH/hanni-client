import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockExamRunner } from "@/components/mock-exam/exam-runner";
import { fetchPublic } from "@/lib/public-fetch";
import type { MockExamMeta } from "@/lib/types";

/** Trang làm 1 đề — khung tập trung như phòng thi (không sidebar, không menu).
 * Nằm NGOÀI nhóm `(site)` vì lý do đó; trang danh sách `/thi-thu-hsk` thì ở
 * trong `(site)` để người đã đăng nhập vẫn có sidebar. */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

async function metaOf(slug: string) {
  const list = await fetchPublic<MockExamMeta[]>("/mock-exams", revalidate);
  return list?.find((e) => e.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await metaOf(slug);
  if (!meta) return { title: "Đề thi thử HSK | Hanni" };
  const parts = meta.sections
    .map((s) => `${s.count} câu ${s.kind === "listening" ? "nghe" : s.kind === "reading" ? "đọc" : "viết"}`)
    .join(", ");
  return {
    title: `Đề thi thử ${meta.title} online — chấm điểm, chữa bài ngay | Hanni`,
    description: `Làm đề thi thử ${meta.title} đúng cấu trúc đề thật: ${parts}, ${meta.durationMin} phút, ${meta.maxScore} điểm (đạt ${meta.passScore}). Có giọng đọc phần nghe, chữa bài và bản dịch tiếng Việt từng câu. Miễn phí, không cần đăng ký.`,
    alternates: { canonical: `/thi-thu-hsk/${slug}` },
  };
}

export default async function MockExamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await metaOf(slug))) notFound();
  return <MockExamRunner slug={slug} />;
}
