"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LinkButton } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { SampleCard } from "@/components/sample-card";
import { useAuth } from "@/lib/auth";

const FEATURES: {
  icon: IconName;
  title: string;
  body: string;
  tone: string;
}[] = [
  {
    icon: "book",
    title: "Hiểu từng từ, nhớ từng nét",
    body: "Hán tự, pinyin và nghĩa tiếng Việt giúp bạn học dễ hiểu ngay từ bước đầu.",
    tone: "bg-primary/8 text-primary",
  },
  {
    icon: "cards",
    title: "Ôn đúng lúc, nhớ lâu hơn",
    body: "Flashcard và lịch ôn cá nhân giúp bạn dành thời gian cho những từ cần luyện thêm.",
    tone: "bg-accent/8 text-accent",
  },
  {
    icon: "chart",
    title: "Nhìn thấy mình tiến bộ",
    body: "Theo dõi từng cấp HSK, giữ nhịp học mỗi ngày và ghi lại những cột mốc của riêng bạn.",
    tone: "bg-lavender/8 text-lavender",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div
          aria-hidden="true"
          className="absolute -right-32 top-0 h-[650px] w-[650px] rounded-full bg-primary/4 blur-3xl"
        />
        <div className="page-wrap relative grid items-center gap-14 py-16! lg:grid-cols-[1.2fr_1fr] lg:gap-24 lg:py-24!">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              TIẾNG TRUNG CHO NGƯỜI VIỆT
            </span>
            <h1 className="mt-7 text-[40px] leading-[1.2] font-semibold tracking-tight sm:text-5xl lg:text-[58px]">
              Tiếng Trung,
              <br />
              mỗi ngày <span className="text-primary">gần hơn.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted">
              Bắt đầu từ một từ mới. Xây dựng vốn tiếng Trung vững vàng cùng lộ
              trình HSK 3.0 và cách ôn tập phù hợp với bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register" className="px-6!">
                Bắt đầu hành trình <Icon name="arrow" size={18} />
              </LinkButton>
              <LinkButton href="#cach-hoc" variant="secondary">
                Khám phá cách học
              </LinkButton>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={15} className="text-good" />
                Học theo nhịp của bạn
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={15} className="text-good" />
                Từ cơ bản đến nâng cao
              </span>
            </div>
          </div>
          <div className="relative px-3 pb-5">
            <SampleCard />
            <span className="absolute -bottom-1 left-0 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-medium shadow-sm sm:-left-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-good/10 text-good">
                <Icon name="check" size={16} />
              </span>
              Mỗi từ mới là một bước tiến
            </span>
          </div>
        </div>
      </section>
      <section id="cach-hoc" className="page-wrap scroll-mt-24 py-16!">
        <div className="mb-8">
          <p className="eyebrow">NHẸ NHÀNG MÀ HIỆU QUẢ</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Một góc học tập dành riêng cho bạn
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-7">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.tone}`}
              >
                <Icon name={f.icon} size={23} />
              </span>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="lo-trinh" className="page-wrap scroll-mt-24 pb-16! pt-0!">
        <div className="panel overflow-hidden lg:flex">
          <div className="bg-primary/5 p-8 lg:w-[38%] lg:p-10">
            <p className="eyebrow">LỘ TRÌNH HSK 3.0</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold">
              Đi từng bước.
              <br />
              Vững từng cấp.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Chọn điểm bắt đầu phù hợp và dần mở rộng khả năng sử dụng tiếng
              Trung.
            </p>
            <LinkButton href="/register" variant="secondary" className="mt-6">
              Tạo tài khoản <Icon name="arrow" size={16} />
            </LinkButton>
          </div>
          <div className="grid flex-1 gap-6 p-8 sm:grid-cols-3 lg:p-10">
            {[
              {
                label: "Sơ cấp",
                level: "1–3",
                word: "启",
                body: "Làm quen và xây nền tảng",
                color: "text-primary bg-primary/8",
              },
              {
                label: "Trung cấp",
                level: "4–6",
                word: "进",
                body: "Mở rộng vốn từ, tự tin hơn",
                color: "text-accent bg-accent/8",
              },
              {
                label: "Cao cấp",
                level: "7–9",
                word: "达",
                body: "Diễn đạt sâu và linh hoạt",
                color: "text-lavender bg-lavender/8",
              },
            ].map((b) => (
              <div key={b.label}>
                <div
                  aria-hidden="true"
                  className={`hanzi mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-4xl ${b.color}`}
                >
                  {b.word}
                </div>
                <p className="text-xs font-semibold text-muted">
                  HSK {b.level}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{b.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
