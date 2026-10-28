"use client";

/**
 * BẢN ĐỒ TRANG — PHIÊN HỌC 1 BÀI (/bai-hoc/[id]) — giới thiệu từ → trắc nghiệm → ghép cặp → điền câu → hoàn thành
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   POST /learn/lessons/:id/complete  ← components/lesson-session/session-runner.tsx
 *                                       → server: modules/learn/learn.controller.ts → LessonSessionService.complete()
 *   GET /learn/lessons/:id/session    ← chính trang này
 *                                       → server: modules/learn/learn.controller.ts → LessonSessionService.session()
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { SessionRunner } from "@/components/lesson-session/session-runner";
import { StudyLoader } from "@/components/study-loader";
import { apiFetch } from "@/lib/api";
import type { LessonSession } from "@/lib/types";

/**
 * Phiên học 1 bài — lõi trải nghiệm học từ mới (thay cho lật flashcard SRS
 * với từ chưa từng thấy). Khung tập trung, không sidebar, dùng chung cho
 * khách lẫn người đã đăng nhập: khách học được ngay bài 1 rồi mới được mời
 * tạo tài khoản để lưu (xem `lib/pending-lessons.ts`).
 */
export default function LessonSessionPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  // Server trộn câu hỏi ngẫu nhiên mỗi lần gọi — tải lại giữa chừng (đổi tab
  // rồi quay lại) là đổi đề ngay trong lúc đang làm.
  // API → GET /learn/lessons/:id/session · server: modules/learn/learn.controller.ts → LessonSessionService.session()
  const { data, error } = useSWR<LessonSession>(
    `/learn/lessons/${lessonId}/session`,
    (path: string) => apiFetch<LessonSession>(path),
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false },
  );

  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted">Chưa tải được bài học. Bạn thử lại sau nhé.</p>
        <Link href="/learn" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary hover:underline">
          Về lộ trình
        </Link>
      </div>
    );
  if (!data) return <StudyLoader variant="startup" label="Đang chuẩn bị bài học…" />;
  return <SessionRunner key={lessonId} session={data} />;
}
