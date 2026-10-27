"use client";

/**
 * BẢN ĐỒ TRANG — /bat-dau — nút "Học bài đầu tiên": khách → bài 1 của cấp; đã đăng nhập → lưu cấp rồi về /learn
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /learn/start          ← chính trang này
 *                               → server: modules/learn/learn.controller.ts → LearnService.firstLesson()
 *   PATCH /users/me/settings  ← chính trang này
 *                               → server: modules/users/users.controller.ts → UserSettingsService.update()
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { StudyLoader } from "@/components/study-loader";
import { api, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/**
 * "Học bài đầu tiên" — lối vào duy nhất từ trang chủ, khảo sát và thẻ cấp
 * HSK. Khách: vào thẳng bài 1 của cấp (học trước, đăng ký sau — kiểu
 * Duolingo). Đã đăng nhập: lưu cấp đã chọn rồi về lộ trình, không bắt học lại
 * bài 1.
 */
function Start() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const level = Math.min(Math.max(Number(params.get("level")) || 1, 1), 7);

  useEffect(() => {
    if (loading) return;
    if (user) {
      const go = () => router.replace("/learn");
      if (params.get("level"))
        // API → PATCH /users/me/settings · server: modules/users/users.controller.ts → UserSettingsService.update()
        void api.patch("/users/me/settings", { courseLevel: level }).finally(go);
      else go();
      return;
    }
    // API → GET /learn/start · server: modules/learn/learn.controller.ts → LearnService.firstLesson()
    apiFetch<{ id: string }>(`/learn/start?level=${level}`)
      .then((l) => router.replace(`/bai-hoc/${l.id}`))
      .catch(() => router.replace("/hoc-thu"));
  }, [loading, user, level, params, router]);

  return <StudyLoader variant="startup" label="Đang mở bài học đầu tiên…" />;
}

export default function StartPage() {
  return (
    <Suspense fallback={<StudyLoader variant="startup" label="Đang mở bài học…" />}>
      <Start />
    </Suspense>
  );
}
