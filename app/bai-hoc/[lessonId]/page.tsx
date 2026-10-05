"use client";

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
  const { data, error } = useSWR<LessonSession>(
    `/learn/lessons/${lessonId}/session`,
    (path: string) => apiFetch<LessonSession>(path),
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false },
  );

  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted">Chưa tải được bài học. Bạn thử lại sau nhé.</p>
        <Link href="/learn" className="text-sm font-semibold text-primary hover:underline">
          Về lộ trình
        </Link>
      </div>
    );
  if (!data) return <StudyLoader variant="startup" label="Đang chuẩn bị bài học…" />;
  return <SessionRunner key={lessonId} session={data} />;
}
