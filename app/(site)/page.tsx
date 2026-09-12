"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { HskCoverflow } from "@/components/hsk-coverflow";
import { LearningJourney } from "@/components/learning-journey";
import { LinkButton } from "@/components/ui";
import { StudyArtwork } from "@/components/study-artwork";
import { useAuth } from "@/lib/auth";
import { useLevels } from "@/lib/hooks";

// Nội dung giới thiệu tính năng; số liệu học liệu luôn lấy từ API.
const SKILLS: {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  character: string;
  tag: string;
}[] = [
  {
    href: "/vocabulary",
    icon: "book",
    title: "Từ vựng theo cấp độ",
    description: "Hán tự, pinyin và nghĩa dễ hiểu",
    character: "词",
    tag: "Từ vựng",
  },
  {
    href: "/grammar",
    icon: "cards",
    title: "Hiểu câu, nhớ cách dùng",
    description: "Khám phá từ qua câu ví dụ",
    character: "句",
    tag: "Ngữ pháp",
  },
  {
    href: "/listening",
    icon: "sound",
    title: "Lắng nghe tiếng Trung",
    description: "Nghe kỹ hơn, nhận diện tốt hơn",
    character: "听",
    tag: "Luyện nghe",
  },
  {
    href: "/pronunciation",
    icon: "mic",
    title: "Tự tin với phát âm",
    description: "Nghe mẫu, ghi âm và luyện lại",
    character: "说",
    tag: "Luyện nói",
  },
];
const FAQ = [
  [
    "Mới bắt đầu học tiếng Trung, mình nên học từ đâu?",
    "Bạn có thể bắt đầu với lộ trình HSK 1. Làm quen với Hán tự và pinyin trong từng bài, nghe phát âm rồi dùng flashcard để ôn lại những từ đã học.",
  ],
  [
    "Hanni giúp mình ghi nhớ từ vựng như thế nào?",
    "Sau mỗi thẻ, bạn đánh giá mức độ ghi nhớ. Lịch ôn được điều chỉnh để bạn gặp lại từ vựng đúng lúc. Bạn có thể chọn cách ôn và số từ mới mỗi ngày trong cài đặt.",
  ],
  [
    "Mình có thể chọn cấp HSK phù hợp không?",
    "Có. Lộ trình và thư viện từ vựng có bộ lọc cấp HSK. Chọn cấp phù hợp với kiến thức hiện tại, sau đó theo dõi những từ đang học và đã thuộc trong trang tiến độ.",
  ],
  [
    "Có cần biết tiếng Anh để sử dụng Hanni không?",
    "Giao diện được viết bằng tiếng Việt. Từ vựng hiển thị nghĩa tiếng Việt khi đã có bản dịch; những mục chưa có sẽ ghi rõ nghĩa tiếng Anh hoặc trạng thái đang cập nhật.",
  ],
  [
    "Mình có thể luyện tập trên điện thoại không?",
    "Có. Bạn có thể mở Hanni bằng trình duyệt trên điện thoại, dùng flashcard, nghe âm thanh và tiếp tục học với cùng tài khoản. Tính năng ghi âm cần quyền truy cập micro của trình duyệt.",
  ],
  [
    "Tiến độ học có được lưu lại không?",
    "Các lượt ôn đã gửi thành công được lưu vào tài khoản. Trang tổng quan, tiến độ và huy hiệu sẽ giúp bạn theo dõi hành trình học. Phần ghi âm luyện nói dùng để nghe lại trên thiết bị trong buổi luyện hiện tại.",
  ],
];

export default function Home() {
  const { user } = useAuth();
  const levels = useLevels();
  const totalWords = levels.data?.reduce(
    (sum, level) => sum + level.wordsInDb,
    0,
  );
  return (
    <div>
      <section className="home-hero overflow-hidden border-b border-border">
        <div className="page-wrap relative grid items-center gap-4 py-10! md:grid-cols-[1.05fr_1fr] md:py-12!">
          <div className="reveal-group relative z-10 max-w-xl">
            <span className="section-label">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> MỖI NGÀY
              MỘT CHÚT TIẾNG TRUNG
            </span>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[56px]">
              Học thêm mỗi ngày.
              <br />
              <span className="text-primary">Tự tin thêm một chút.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted sm:text-base">
              Từ những lời chào đầu tiên đến hành trình chinh phục HSK. Hanni
              cùng bạn học, luyện tập và nhìn thấy mình tiến bộ.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton
                href={user ? "/learn" : "/register"}
                className="px-6!"
              >
                {user ? "Tiếp tục hành trình" : "Bắt đầu học ngay"}
                <Icon name="arrow" size={17} />
              </LinkButton>
              <LinkButton href="#lo-trinh" variant="secondary">
                Khám phá lộ trình
              </LinkButton>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted">
              <Icon name="check" size={15} className="text-good" /> Học theo
              nhịp của bạn · Lưu từng bước tiến
            </p>
            <ul className="reveal mt-6 flex flex-wrap gap-2.5">
              {[
                {
                  n: totalWords ? `${totalWords.toLocaleString("vi-VN")}+` : "10.900+",
                  t: "từ vựng có audio",
                },
                { n: "9 cấp", t: "HSK 3.0 · 731 bài" },
                { n: "42 video", t: "phụ đề chạy đồng bộ" },
              ].map((f) => (
                <li
                  key={f.t}
                  className="rounded-xl border border-primary/15 bg-surface/70 px-3 py-2 backdrop-blur"
                >
                  <span className="block text-sm font-bold text-primary">
                    {f.n}
                  </span>
                  <span className="block text-[11px] text-muted">{f.t}</span>
                </li>
              ))}
            </ul>
          </div>
          <StudyArtwork />
        </div>
      </section>
      <div className="page-wrap space-y-10 py-8! sm:space-y-12 sm:py-10!">
        <section
          id="cach-hoc"
          className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.55fr_1fr]"
        >
          <div>
            <SectionHeading
              icon="spark"
              title="Một góc học, nhiều cách khám phá"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/learn",
                  icon: "route" as const,
                  title: "Học theo lộ trình",
                  text: "Từng bài nhỏ, nền tảng vững vàng.",
                  className: "discovery-red",
                  label: "BẮT ĐẦU TỪ ĐÂY",
                  word: "学",
                },
                {
                  href: "/study",
                  icon: "cards" as const,
                  title: "Ôn tập flashcard",
                  text: "Gặp lại từ cũ, ghi nhớ lâu hơn.",
                  className: "discovery-gold",
                  label: "DUY TRÌ MỖI NGÀY",
                  word: "记",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`reveal hover-card discovery-card ${item.className}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-widest">
                      {item.label}
                    </span>
                    <Icon name={item.icon} size={19} />
                  </div>
                  <div
                    aria-hidden="true"
                    className="hanzi my-5 text-center text-7xl"
                  >
                    {item.word}
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1.5 text-xs opacity-80">{item.text}</p>
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-foreground">
                      <Icon name="arrow" size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading icon="book" title="Kho học liệu của bạn" />
            <div className="reveal panel mt-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-border">
                {[
                  {
                    icon: "book" as const,
                    value:
                      totalWords === undefined
                        ? "—"
                        : totalWords.toLocaleString("vi-VN"),
                    label: "Từ vựng trong thư viện",
                  },
                  {
                    icon: "route" as const,
                    value: levels.data ? String(levels.data.length) : "—",
                    label: "Cấp độ đang có",
                  },
                  {
                    icon: "cards" as const,
                    value: "Flashcard",
                    label: "Ôn theo mức độ ghi nhớ",
                  },
                  {
                    icon: "chart" as const,
                    value: "Tiến độ",
                    label: "Theo dõi từng cấp HSK",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 bg-surface px-4 py-5"
                  >
                    <span className="mt-1 text-primary">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {levels.error && (
                <p className="px-4 pt-3 text-xs text-muted">
                  Chưa tải được số liệu.{" "}
                  <button
                    className="text-primary underline underline-offset-2"
                    onClick={() => void levels.mutate()}
                  >
                    Tải lại
                  </button>
                </p>
              )}
              <Link
                href="/vocabulary"
                className="flex items-center justify-between px-4 py-3.5 text-xs font-medium text-muted transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Khám phá thư viện từ vựng
                <Icon name="arrow" size={15} />
              </Link>
            </div>
          </div>
        </section>
        <section>
          <SectionHeading
            icon="target"
            title="Hôm nay, bạn muốn luyện gì?"
            href="/dashboard"
            label="Góc học tập"
          />
          <div className="reveal-group mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((skill) => (
              <Link
                key={skill.href}
                href={skill.href}
                className="hover-card skill-card panel group overflow-hidden"
              >
                <div className="relative flex h-28 items-center justify-center overflow-hidden bg-primary/4">
                  <span className="absolute left-3 top-3 rounded-md border border-primary/10 bg-surface px-2 py-1 text-[10px] font-medium text-primary">
                    {skill.tag}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hanzi skill-character text-6xl text-primary/65"
                  >
                    {skill.character}
                  </span>
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-fg">
                    <Icon name={skill.icon} size={15} />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold group-hover:text-primary">
                    {skill.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    {skill.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section id="lo-trinh" className="scroll-mt-24">
          <div className="reveal">
            <span className="section-label">LỘ TRÌNH HSK</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Từ bước đầu đến những điều xa hơn
            </h2>
            <p className="mt-2 text-sm text-muted">
              Chọn điểm xuất phát. Học từng bài. Tiến bộ theo cách của bạn.
            </p>
          </div>

          <div className="mt-6">
            <LearningJourney />
          </div>

          <p className="reveal mt-9 text-sm font-semibold text-muted">
            Chín cấp HSK 3.0 — chọn nơi bạn muốn bắt đầu:
          </p>
          <div className="reveal mt-2">
            <HskCoverflow />
          </div>
        </section>
      </div>
      <section className="border-y border-border bg-surface">
        <div className="page-wrap grid items-center gap-8 py-10! md:grid-cols-[1fr_auto]">
          <div className="reveal">
            <span className="section-label">
              <Icon name="flame" size={14} /> THÓI QUEN NHỎ, HÀNH TRÌNH DÀI
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Dành một chút thời gian cho chính mình.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Một bài học trên máy tính, vài từ mới trên điện thoại. Đăng nhập
              cùng tài khoản để tiếp tục hành trình ở nơi bạn thấy thoải mái
              nhất.
            </p>
            <LinkButton
              href={user ? "/settings" : "/register"}
              className="mt-5"
            >
              {user ? "Đặt mục tiêu mỗi ngày" : "Tạo góc học của bạn"}
              <Icon name="arrow" size={16} />
            </LinkButton>
          </div>
          <div
            aria-hidden="true"
            className="reveal habit-illustration hidden md:flex"
          >
            <div className="habit-orbit" />
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/8 text-primary">
              <Icon name="flame" size={48} />
            </div>
            <span className="absolute bottom-5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium shadow-sm">
              Hôm nay, cùng tiến thêm một bước.
            </span>
          </div>
        </div>
      </section>
      <section
        id="cau-hoi"
        className="page-wrap max-w-3xl! scroll-mt-24 py-12! sm:py-16!"
      >
        <div className="reveal text-center">
          <span className="section-label">HỎI & ĐÁP</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Bạn hỏi, <span className="text-primary">Hanni trả lời.</span>
          </h2>
          <p className="mt-3 text-sm text-muted">
            Một vài điều trước khi bắt đầu hành trình tiếng Trung.
          </p>
        </div>
        <div className="mt-7 space-y-3">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="reveal faq-item panel group">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium">
                {question}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                  <Icon
                    name="plus"
                    size={13}
                    className="transition-transform group-open:rotate-45"
                  />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-7 text-muted">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
function SectionHeading({
  icon,
  title,
  href,
  label,
}: {
  icon: IconName;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon name={icon} size={15} />
        </span>
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          {label}
          <Icon name="arrow" size={14} />
        </Link>
      )}
    </div>
  );
}
