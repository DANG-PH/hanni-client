"use client";

import Link from "next/link";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { Icon, type IconName } from "@/components/icon";
import { HskCoverflow } from "@/components/hsk-coverflow";
import { LearningJourney } from "@/components/learning-journey";
import { ToneCheck } from "@/components/tone/tone-check";
import { LinkButton } from "@/components/ui";
import { StudyArtwork } from "@/components/study-artwork";
import { useAuth } from "@/lib/auth";
import { useLevels, useWordStats } from "@/lib/hooks";

// Vài ví dụ âm Hán Việt trùng khớp gần như nguyên vẹn với nghĩa tiếng Việt
// hiện đại — minh hoạ cụ thể cho lợi thế chỉ người Việt mới có (xem
// hanni-server/CLAUDE.md mục "Âm Hán Việt").
const HANVIET_EXAMPLES: {
  zh: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
}[] = [
  { zh: "学生", pinyin: "xué shēng", hanViet: "học sinh", meaning: "học sinh" },
  {
    zh: "时间",
    pinyin: "shí jiān",
    hanViet: "thời gian",
    meaning: "thời gian",
  },
  { zh: "国家", pinyin: "guó jiā", hanViet: "quốc gia", meaning: "quốc gia" },
];

/** Từ khoá gợi ý dưới ô tra (như "Từ khóa hot" của Hanzii) — trộn Hán tự, tiếng Việt,
 * pinyin để khách thấy ô tra nhận được cả 3 kiểu. */
const QUICK_SEARCHES = ["你好", "học sinh", "电脑", "xièxie", "cảm ơn", "我想喝咖啡"];

/** 6 lối vào khách dùng được NGAY (audit G4, 2026-10-19) — thay 2 khối trùng ý cũ
 * ("Một góc học…" + "Hôm nay bạn muốn luyện gì?") vốn dẫn vào trang bắt đăng nhập. */
const ENTRIES: {
  href: string;
  icon: IconName;
  tag: string;
  character: string;
  title: string;
  description: string;
}[] = [
  {
    href: "/bat-dau",
    icon: "route",
    tag: "Học",
    character: "学",
    title: "Học bài đầu tiên",
    description: "5–10 phút: giới thiệu từ, luyện ngay, chấm thanh điệu.",
  },
  {
    href: "/thi-thu-hsk",
    icon: "target",
    tag: "Luyện thi",
    character: "考",
    title: "Thi thử HSK 1–3",
    description: "Đề đúng cấu trúc đề thật, chữa bài kèm âm Hán Việt.",
  },
  {
    href: "/tu-dien",
    icon: "book",
    tag: "Từ điển",
    character: "典",
    title: "Từ điển Hán Việt",
    description: "Pinyin, âm Hán Việt, thứ tự nét, phân tích từng chữ.",
  },
  {
    href: "/tu-dien/quet",
    icon: "camera",
    tag: "AI",
    character: "拍",
    title: "Quét ảnh học từ",
    description: "Chụp thực đơn, biển hiệu, món ăn — ra từ vựng kèm Hán Việt.",
  },
  {
    href: "/phien-am",
    icon: "sound",
    tag: "Phát âm",
    character: "音",
    title: "Bảng phiên âm",
    description: "4 thanh, bảng ghép âm bấm nghe, mẹo đoán thanh từ Hán Việt.",
  },
  {
    href: "/kiem-tra-trinh-do",
    icon: "chart",
    tag: "Trình độ",
    character: "测",
    title: "Kiểm tra trình độ",
    description: "Đã biết một chút? Đo cấp HSK của bạn trong vài phút.",
  },
];

/** Tiện ích AI — trỏ thẳng tới chỗ mỗi tính năng nằm trong luồng học. */
const AI_TOOLS: { href: string; icon: IconName; title: string; description: string; example: string }[] = [
  {
    href: "/tu-dien/%E7%94%B5%E8%84%91",
    icon: "spark",
    title: "Mẹo nhớ theo âm Hán Việt",
    description: "Mỗi từ có mẹo nhớ dựa trên âm Hán Việt và nghĩa từng chữ.",
    example: "电脑 = điện + não → “bộ não chạy bằng điện” = máy tính",
  },
  {
    href: "/tu-dien/%E5%AD%A6%E4%B9%A0",
    icon: "pencil",
    title: "Chấm câu bạn tự đặt",
    description: "Viết hoặc nói 1 câu với từ mới, AI sửa lỗi và giải thích bằng tiếng Việt.",
    example: "我电脑用学习 → 我用电脑学习 · “用 + công cụ + động từ”",
  },
  {
    href: `/tu-dien?q=${encodeURIComponent("Tôi muốn uống cà phê")}`,
    icon: "search",
    title: "Dịch & phân tích cả câu",
    description: "Dán câu tiếng Trung hoặc gõ câu tiếng Việt ngay ở ô tra từ điển.",
    example: "“Tôi muốn uống cà phê” → 我想喝咖啡 + cấu trúc 想 + động từ",
  },
  {
    href: "/roleplay",
    icon: "mic",
    title: "Luyện nói bằng giọng",
    description: "Đóng vai gọi món, hỏi đường, mua sắm — nói vào micro, AI đáp lại bằng giọng.",
    example: "6 tình huống đời thường HSK 1–4, có gợi ý câu và nhận xét cuối buổi",
  },
];

const FAQ = [
  [
    "Mới bắt đầu học tiếng Trung, mình nên học từ đâu?",
    "Làm bảng phiên âm (10 phút) để quen 4 thanh, rồi học bài 1 của HSK 1 — mỗi bài 5–10 phút, có giới thiệu từ, luyện ngay và chấm thanh điệu. Đã biết một chút thì làm kiểm tra trình độ để bắt đầu đúng cấp.",
  ],
  [
    "Có cần tạo tài khoản không?",
    "Không cần để bắt đầu: khách học được bài học, luyện nghe, phát âm, viết chữ, làm đề thi thử và tra từ điển. Tạo tài khoản (miễn phí) để lưu tiến độ, ôn tập theo lịch và dùng các tiện ích AI.",
  ],
  [
    "Hanni giúp mình ghi nhớ từ vựng như thế nào?",
    "Mỗi từ có âm Hán Việt và phân tích từng chữ để liên tưởng với tiếng Việt. Từ đã học được đưa vào lịch ôn ngắt quãng: bạn gặp lại từ đúng lúc sắp quên, từ hay quên được ôn riêng.",
  ],
  [
    "Hanni có luyện thi HSK không?",
    "Có. HSK 1–3 mỗi cấp 3 đề đúng cấu trúc đề thật (nghe, đọc, viết, tính giờ). Làm xong có điểm từng phần, chữa từng câu kèm pinyin, bản dịch và từ vựng có âm Hán Việt, luyện lại câu sai và luyện riêng dạng bài còn yếu.",
  ],
  [
    "Có cần biết tiếng Anh để sử dụng Hanni không?",
    "Không. Giao diện, nghĩa từ, giải thích ngữ pháp và chữa bài đều bằng tiếng Việt.",
  ],
  [
    "Mình có thể luyện tập trên điện thoại không?",
    "Có. Mở Hanni bằng trình duyệt trên điện thoại hoặc cài như một ứng dụng. Ghi âm luyện phát âm cần cho phép micro; giọng bạn được phân tích ngay trên máy, không gửi đi đâu.",
  ],
];

export default function Home() {
  const { user } = useAuth();
  const levels = useLevels();
  const wordStats = useWordStats();
  const totalWords = levels.data?.reduce(
    (sum, level) => sum + level.wordsInDb,
    0,
  );
  const fmt = (n: number | undefined, fallback: string) =>
    n ? n.toLocaleString("vi-VN") : fallback;
  return (
    <div>
      <section className="home-hero overflow-hidden border-b border-border">
        <div className="page-wrap relative grid items-center gap-4 py-8! md:grid-cols-[1.05fr_1fr] md:py-12!">
          <div className="reveal-group relative z-10 max-w-xl">
            <span className="section-label">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> HỌC
              TIẾNG TRUNG CHO NGƯỜI VIỆT
            </span>
            {/* Điểm khác biệt nói NGAY ở tiêu đề — trước đây là câu chung
             * chung "Học thêm mỗi ngày", còn lợi thế Hán Việt nằm ở dòng phụ
             * mà phần lớn khách không đọc tới. */}
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[56px]">
              Bạn đã biết <span className="whitespace-nowrap">tiếng Trung</span>
              <br />
              <span className="text-primary">nhiều hơn bạn nghĩ.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted sm:text-base">
              <span lang="zh" className="hanzi">电话</span> là điện thoại,{" "}
              <span lang="zh" className="hanzi">世界</span> là thế giới — hàng
              trăm từ tiếng Trung đọc gần giống tiếng Việt nhờ âm Hán Việt.
              Hanni dạy theo lộ trình HSK 3.0, mỗi bài chỉ 5–10 phút.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {/* Khách: vào thẳng bài 1 (học trước, đăng ký sau — kiểu
               * Duolingo). Người đã biết một chút làm bài kiểm tra trình độ
               * thay vì tự khai cấp ở khảo sát. */}
              <LinkButton href={user ? "/learn" : "/bat-dau"} className="px-6!">
                {user ? "Tiếp tục học" : "Học bài đầu tiên — miễn phí"}
                <Icon name="arrow" size={17} />
              </LinkButton>
              {!user && (
                <LinkButton href="/kiem-tra-trinh-do" variant="secondary">
                  Tôi đã biết một chút
                </LinkButton>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <Icon name="check" size={15} className="text-good" /> Không cần
              đăng ký để bắt đầu · Toàn bộ bài học miễn phí
            </p>
            {/* Tra từ ngay trên trang chủ (audit S13) — Hanzii đặt ô tra cứu đầu trang
             * chủ; từ điển 10.900+ từ là thế mạnh của Hanni mà trước đó trang chủ không có. */}
            <div className="mt-6 rounded-2xl border border-border bg-surface/80 p-3 shadow-sm backdrop-blur">
              <p className="mb-2 px-1 text-xs font-semibold text-muted">
                Tra từ: Hán tự, pinyin, tiếng Việt hoặc cả câu
              </p>
              <DictionarySearch showScan />
              <div className="mt-2.5 flex flex-wrap gap-1.5 px-1">
                {QUICK_SEARCHES.map((q) => (
                  <Link
                    key={q}
                    href={`/tu-dien?q=${encodeURIComponent(q)}`}
                    className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-primary"
                  >
                    {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Điện thoại: bỏ hình minh hoạ (cao 370px) để màn đầu thấy ngay nút học + ô tra. */}
          <div className="max-md:hidden">
            <StudyArtwork />
          </div>
        </div>
      </section>

      {/* Kho học liệu bằng con số (như Hanbeego) — số từ lấy thẳng từ API. */}
      <section aria-label="Kho học liệu" className="border-b border-border bg-surface">
        <dl className="page-wrap grid grid-cols-2 gap-px py-0! sm:grid-cols-4">
          {[
            { n: fmt(totalWords, "10.900+"), t: "từ vựng có audio" },
            { n: fmt(wordStats.data?.withHanViet, "9.800+"), t: "từ có âm Hán Việt" },
            { n: "744", t: "bài học theo chủ đề" },
            { n: "9 đề", t: "thi thử HSK 1–3" },
          ].map((s) => (
            <div key={s.t} className="px-2 py-5 text-center">
              <dt className="sr-only">{s.t}</dt>
              <dd className="text-xl font-bold text-primary sm:text-2xl">{s.n}</dd>
              <dd className="mt-0.5 text-xs text-muted">{s.t}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="page-wrap space-y-12 py-10! sm:space-y-14 sm:py-12!">
        <section aria-labelledby="bat-dau-ngay">
          <SectionHeading icon="spark" id="bat-dau-ngay" title="Bắt đầu ngay — chưa cần tài khoản" />
          <div className="reveal-group mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTRIES.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="hover-card skill-card panel group flex overflow-hidden"
              >
                <div className="relative flex w-28 shrink-0 items-center justify-center bg-primary/4 sm:w-32">
                  <span className="absolute left-2.5 top-2.5 rounded-md border border-primary/10 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {e.tag}
                  </span>
                  <span aria-hidden="true" className="hanzi skill-character text-5xl text-primary/65">
                    {e.character}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold group-hover:text-primary">
                    <Icon name={e.icon} size={15} className="shrink-0 text-primary" />
                    {e.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted">{e.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="border-y border-border bg-surface">
        <div className="page-wrap py-10! sm:py-12!">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="section-label">
              <Icon name="spark" size={14} /> LỢI THẾ CHỈ NGƯỜI VIỆT MỚI CÓ
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Bạn đã biết trước hàng nghìn từ tiếng Trung
              <br className="hidden sm:block" /> — chỉ là chưa nhận ra
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
              Hơn 60% từ vựng tiếng Việt vay mượn từ tiếng Hán và giữ nguyên âm
              đọc — &quot;âm Hán Việt&quot;. Hanni hiện âm Hán Việt cạnh mỗi từ
              để bạn liên tưởng ngay, thay vì học thuộc lòng từ đầu.
            </p>
          </div>
          <div className="reveal-group mt-7 grid gap-3 sm:grid-cols-3">
            {HANVIET_EXAMPLES.map((ex) => (
              <div key={ex.zh} className="reveal panel p-5 text-center">
                <p lang="zh" className="hanzi text-4xl text-primary">
                  {ex.zh}
                </p>
                <p className="mt-1.5 text-xs text-muted">{ex.pinyin}</p>
                <p className="mt-3 text-sm">
                  Hán Việt:{" "}
                  <span className="font-bold text-primary">{ex.hanViet}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Trùng khớp nghĩa tiếng Việt: &quot;{ex.meaning}&quot;
                </p>
              </div>
            ))}
          </div>
          <p className="reveal mt-6 text-center text-sm">
            <Link
              href="/tu-da-biet"
              className="font-medium text-primary hover:underline"
            >
              Xem những từ tiếng Trung bạn đã biết sẵn
              <Icon name="arrow" size={14} className="ml-1 inline" />
            </Link>
          </p>
        </div>
      </section>

      {/* Thử phương pháp ngay trên trang chủ (như SuperChinese cho xem thử bài học) — chấm
       * thanh điệu chạy hẳn trên máy nên khách dùng được, không tốn lượt AI. */}
      <section aria-labelledby="cham-thanh" className="page-wrap grid items-center gap-8 py-12! md:grid-cols-[1fr_minmax(0,440px)]">
        <div className="reveal">
          <span className="section-label">
            <Icon name="mic" size={14} /> CHẤM THANH ĐIỆU
          </span>
          <h2 id="cham-thanh" className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Đọc đúng thanh ngay từ ngày đầu
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Đọc thử <span lang="zh" className="hanzi">你好</span> — Hanni vẽ đường
            cao độ giọng bạn chồng lên giọng chuẩn, chỉ ra âm tiết nào lệch thanh và
            cách sửa theo dấu tiếng Việt. Có sẵn trong mọi bài học và trang từ điển.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {["4 thanh + biến điệu 3-3, 一, 不", "So với ghi âm người bản xứ", "Phân tích trên máy, không gửi giọng đi"].map((t) => (
              <li key={t} className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs">
                <Icon name="check" size={13} className="text-good" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal panel p-5 text-center sm:p-6">
          <p lang="zh" className="hanzi text-5xl text-primary">你好</p>
          <p className="mt-1.5 text-sm text-muted">nǐ hǎo · xin chào</p>
          <ToneCheck
            hanzi="你好"
            pinyin="nǐ hǎo"
            pinyinNumeric="ni3 hao3"
            audioUrl="/media/audio/cmn-你好.mp3"
            className="mt-4"
          />
        </div>
      </section>

      {/* Luyện thi HSK — hướng doanh thu đã chọn; Hanzii, Hanbeego bắt đăng nhập mới
       * cho làm đề, Hanni cho khách làm trọn đề. */}
      <section className="border-y border-border bg-surface">
        <div className="page-wrap grid items-center gap-8 py-10! sm:py-12! md:grid-cols-[1fr_auto]">
          <div className="reveal">
            <span className="section-label">
              <Icon name="target" size={14} /> LUYỆN THI HSK
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Đề thi thử đúng cấu trúc đề thật
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Nghe, đọc, viết, tính giờ như phòng thi. Chấm điểm ngay, chữa từng câu
              kèm pinyin, bản dịch và từ vựng có âm Hán Việt; luyện lại câu sai, luyện
              riêng dạng bài còn yếu. Làm trọn đề không cần tài khoản.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton href="/thi-thu-hsk">
                Làm thử đề HSK 1
                <Icon name="arrow" size={16} />
              </LinkButton>
              <LinkButton href="/kiem-tra-trinh-do" variant="secondary">
                Chưa biết thi cấp nào?
              </LinkButton>
            </div>
          </div>
          <ul className="reveal grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:grid-cols-1">
            {[
              ["HSK 1", "40 câu · 35 phút", "Nghe + Đọc"],
              ["HSK 2", "60 câu · 50 phút", "Nghe + Đọc"],
              ["HSK 3", "80 câu · 85 phút", "Nghe + Đọc + Viết"],
            ].map(([lv, q, parts]) => (
              <li key={lv} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{lv}</span>
                <span className="text-sm">
                  <span className="font-semibold">{q}</span>
                  <span className="block text-xs text-muted">{parts} · 3 đề</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="page-wrap space-y-12 py-10! sm:space-y-14 sm:py-12!">
        <section aria-labelledby="tro-giang-ai">
          <SectionHeading icon="spark" id="tro-giang-ai" title="Trợ giảng AI hiểu người Việt" />
          <div className="reveal-group mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AI_TOOLS.map((a) => (
              <Link key={a.title} href={a.href} className="reveal hover-card panel group flex gap-3.5 p-5">
                <span className="icon-tile shrink-0 bg-accent/10 text-accent">
                  <Icon name={a.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold group-hover:text-primary">{a.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{a.description}</span>
                  <span lang="zh" className="mt-2.5 block rounded-lg bg-surface-2 px-3 py-2 text-xs leading-5">
                    {a.example}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Dùng AI cần tài khoản miễn phí — 10 lượt mỗi ngày, Premium nhiều hơn. Mọi bài học vẫn miễn phí.
          </p>
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
  id,
}: {
  icon: IconName;
  title: string;
  id?: string;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-sm font-semibold sm:text-base">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Icon name={icon} size={15} />
      </span>
      {title}
    </h2>
  );
}
