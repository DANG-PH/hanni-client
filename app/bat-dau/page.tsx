"use client";

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
        void api.patch("/users/me/settings", { courseLevel: level }).finally(go);
      else go();
      return;
    }
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
