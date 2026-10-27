/**
 * BẢN ĐỒ TRANG — PHÒNG THI (/thi-thu-hsk/[slug]) — làm 1 đề có đồng hồ, nộp bài, chữa bài
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /assistant/ask/stream                    ← streamAssistant() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.askStream()
 *   GET /assistant/sessions                      ← useAssistantSessions() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.listSessions()
 *   POST /assistant/sessions                     ← createAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.createSession()
 *   DELETE /assistant/sessions/:sessionId        ← deleteAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.deleteSession()
 *   GET /assistant/sessions/:sessionId/messages  ← useAssistantMessages() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.getMessages()
 *   GET /mock-exams/:slug                        ← chính trang này · components/mock-exam/exam-runner.tsx
 *                                                  → server: modules/mock-exams/mock-exams.controller.ts →
 *                                                    MockExamsService.paper()
 *   POST /mock-exams/:slug/submit                ← components/mock-exam/exam-runner.tsx
 *                                                  → server: modules/mock-exams/mock-exams.controller.ts →
 *                                                    MockExamsService.submit()
 *   POST /study/add-word                         ← addWordToSrs() ở lib/hooks.ts (←
 *                                                  components/mock-exam/exam-runner.tsx)
 *                                                  → server: modules/srs/srs.controller.ts → ReviewService.addWord()
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockExamRunner } from "@/components/mock-exam/exam-runner";
import { fetchPublic } from "@/lib/public-fetch";
import type { MockPaper } from "@/lib/types";

/** Trang làm 1 đề — khung tập trung như phòng thi (không sidebar, không menu).
 * Nằm NGOÀI nhóm `(site)` vì lý do đó; trang danh sách `/thi-thu-hsk` thì ở
 * trong `(site)` để người đã đăng nhập vẫn có sidebar. */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

/** Hỏi thẳng đề theo slug — KHÔNG tra trong danh sách đề: danh sách cache 1 giờ
 * nên đề vừa ra mắt bị 404 tới 1 giờ (gặp thật lúc ra HSK 2). `fetchPublic` chỉ
 * trả null khi API báo 404 cho đúng đề này. */
async function paperOf(slug: string) {
  // API → GET /mock-exams/:slug · server: modules/mock-exams/mock-exams.controller.ts → MockExamsService.paper()
  return fetchPublic<MockPaper>(`/mock-exams/${encodeURIComponent(slug)}`, revalidate);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await paperOf(slug);
  if (!meta) return { title: "Đề thi thử HSK | Hanni" };
  const parts = meta.sections
    .map(
      (s) =>
        `${s.parts.reduce((n, p) => n + p.items.length, 0)} câu ${s.kind === "listening" ? "nghe" : s.kind === "reading" ? "đọc" : "viết"}`,
    )
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
  if (!(await paperOf(slug))) notFound();
  return <MockExamRunner slug={slug} />;
}
