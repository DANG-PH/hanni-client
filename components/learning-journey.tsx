import Link from "next/link";

type Stage = {
  n: number;
  hanzi: string;
  index: string;
  pinyin: string;
  title: string;
  desc: string;
  href: string;
  accent: "red" | "amber";
};

const STAGES: Stage[] = [
  {
    n: 1,
    hanzi: "拼",
    index: "一",
    pinyin: "pīn",
    title: "Pinyin – phiên âm La-tinh",
    desc: "Làm quen thanh mẫu, vận mẫu và cách ghép âm. Đây là chìa khoá để đọc được mọi chữ Hán.",
    href: "/vocabulary",
    accent: "red",
  },
  {
    n: 2,
    hanzi: "声",
    index: "二",
    pinyin: "shēng",
    title: "Thanh điệu – 4 thanh + thanh nhẹ",
    desc: "Cùng một âm, khác thanh là khác nghĩa (mā / má / mǎ / mà). Luyện kỹ ngay từ đầu để nói chuẩn.",
    href: "/pronunciation",
    accent: "amber",
  },
  {
    n: 3,
    hanzi: "字",
    index: "三",
    pinyin: "zì",
    title: "Chữ Hán cơ bản",
    desc: "Bắt đầu từ chữ tần suất cao và bộ thủ, tập viết đúng quy tắc nét. Nhớ mặt chữ nhanh hơn.",
    href: "/vocabulary",
    accent: "amber",
  },
  {
    n: 4,
    hanzi: "词",
    index: "四",
    pinyin: "cí",
    title: "Từ vựng HSK 1",
    desc: "Khoảng 150 từ đầu tiên: chào hỏi, số đếm, đại từ, động từ thông dụng — có audio và flashcard SRS.",
    href: "/study",
    accent: "red",
  },
  {
    n: 5,
    hanzi: "语",
    index: "五",
    pinyin: "yǔ",
    title: "Ngữ pháp cơ bản",
    desc: "Không chia động từ, không số nhiều. Nắm trật tự câu và trợ từ 了 / 的 / 吗 là giao tiếp được.",
    href: "/grammar",
    accent: "red",
  },
  {
    n: 6,
    hanzi: "听",
    index: "六",
    pinyin: "tīng",
    title: "Luyện nghe & nói",
    desc: "Nghe nhiều cho quen âm, nhại lại từng câu ngắn. Tự tin mở miệng nói tiếng Trung mỗi ngày.",
    href: "/listening",
    accent: "amber",
  },
];

export function LearningJourney() {
  return (
    <section
      aria-label="Lộ trình học tiếng Trung"
      className="reveal relative overflow-hidden rounded-3xl border border-primary/12 bg-[linear-gradient(180deg,#fff5f3,#ffffff)] p-5 sm:p-7"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">CÁCH HỌC TIẾNG TRUNG TỪ CON SỐ 0</p>
          <h2 className="mt-1 text-lg font-bold sm:text-xl">
            Sáu chặng, đi từ mặt chữ đến mở miệng nói
          </h2>
        </div>
        <span className="hidden text-xs text-muted sm:block">
          Bấm vào từng chặng để bắt đầu
        </span>
      </div>

      {/* Đường cong nối các chặng — chỉ hiện ở màn rộng. */}
      <div className="pointer-events-none absolute inset-x-7 top-[132px] hidden lg:block">
        <svg
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          className="h-14 w-full"
          aria-hidden="true"
        >
          <path
            d="M0,30 C90,-6 150,66 250,30 C350,-6 420,66 500,30 C580,-6 650,66 750,30 C850,-6 910,66 1000,30"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M985,20 l16,10 l-16,10"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <ol className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible">
        {STAGES.map((s) => (
          <li
            key={s.n}
            className="w-[220px] shrink-0 snap-start lg:w-auto"
          >
            <Link
              href={s.href}
              className="hover-card group flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-4 text-center"
            >
              <span
                className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                  s.accent === "red" ? "bg-primary" : "bg-[#e0952b]"
                }`}
              >
                {s.n}
              </span>
              <span className="relative mb-2">
                <span className="hanzi flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-3xl shadow-inner ring-1 ring-border transition-transform group-hover:scale-105">
                  {s.hanzi}
                </span>
                <span className="hanzi absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-fg">
                  {s.index}
                </span>
              </span>
              <span className="text-xs font-medium text-primary">
                {s.pinyin}
              </span>
              <span className="mt-1 block text-sm font-bold leading-snug">
                {s.title}
              </span>
              <span className="mt-2 block text-xs leading-5 text-muted">
                {s.desc}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
