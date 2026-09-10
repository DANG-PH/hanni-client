"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LinkButton } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  {
    title: "Chuẩn HSK 3.0 — 9 cấp",
    body: "Từ vựng phân theo đại cương thi chính thức 2025 (Sơ – Trung – Cao cấp), không phải hệ 6 cấp cũ.",
  },
  {
    title: "Flashcard lặp lại ngắt quãng",
    body: "Thuật toán SM-2 (kiểu Anki), có sẵn FSRS. Mỗi từ tự tính lịch ôn lại theo độ chính xác của bạn.",
  },
  {
    title: "Nghĩa tiếng Việt",
    body: "Hán tự, pinyin, nghĩa tiếng Việt, câu ví dụ — thiết kế cho người Việt học từ mất gốc đến nâng cao.",
  },
  {
    title: "Streak & mục tiêu ngày",
    body: "Chuỗi ngày học liên tục (xử lý đúng múi giờ), mục tiêu tự chỉnh, huy hiệu theo mốc, quiz chấm điểm.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Học tiếng Trung theo <span className="text-primary">HSK 3.0</span>,
          nhớ lâu nhờ lặp lại ngắt quãng.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Hanni giúp người Việt học từ vựng tiếng Trung có hệ thống: flashcard SM-2,
          theo dõi tiến độ từng cấp, streak mỗi ngày.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/register">Bắt đầu miễn phí</LinkButton>
          <LinkButton href="/login" variant="secondary">
            Mình đã có tài khoản
          </LinkButton>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
