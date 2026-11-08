"use client";

/**
 * BẢN ĐỒ TRANG — Trang chủ cho KHÁCH (/) — thông điệp Hán Việt, ô tra từ, "Học bài đầu tiên", chấm thanh điệu thử
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /levels       ← useLevels() ở lib/hooks.ts (← chính trang này)
 *                       → server: modules/vocabulary/vocabulary.controller.ts → HskLevelsService.list()
 *   GET /words        ← components/dictionary/dictionary-search.tsx
 *                       → server: modules/vocabulary/vocabulary.controller.ts → WordsService.list()
 *   GET /words/stats  ← useWordStats() ở lib/hooks.ts (← chính trang này)
 *                       → server: modules/vocabulary/vocabulary.controller.ts → WordsService.stats()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import Image from "next/image";
import Link from "next/link";
import { DictionarySearch } from "@/components/dictionary/dictionary-search";
import { VideoShelf } from "@/components/video-shelf";
import { Icon, type IconName } from "@/components/icon";
import { ToneCheck } from "@/components/tone/tone-check";
import { LinkButton } from "@/components/ui";
import { StudyArtwork } from "@/components/study-artwork";
import { SceneCover } from "@/components/learning-scenes";
import { useAuth } from "@/lib/auth";
import { useLevels, useWordStats } from "@/lib/hooks";

// Vài ví dụ âm Hán Việt trùng khớp gần như nguyên vẹn với nghĩa tiếng Việt
// hiện đại — minh hoạ cụ thể cho lợi thế chỉ người Việt mới có (xem
// hanni-server/CLAUDE.md mục "Âm Hán Việt").
const HANVIET_EXAMPLES: {
  zh: string;
  pinyin: string;
  meaning: string;
}[] = [
  { zh: "学生", pinyin: "xué shēng", meaning: "học sinh" },
  {
    zh: "时间",
    pinyin: "shí jiān",
    meaning: "thời gian",
  },
  { zh: "国家", pinyin: "guó jiā", meaning: "quốc gia" },
];

/** Từ khoá gợi ý dưới ô tra (như "Từ khóa hot" của Hanzii) — trộn Hán tự, tiếng Việt,
 * pinyin để khách thấy ô tra nhận được cả 3 kiểu. */
const QUICK_SEARCHES = ["你好", "học sinh", "电脑", "xièxie", "cảm ơn", "我想喝咖啡"];

/** "Hanni có gì?" — 4 trụ cột, mỗi trụ: làm được gì, hay ở đâu, bấm vào đâu (2026-10-20 — user: bạn học tiếng Trung
 * hỏi "web có gì để tôi học, hay gì, vào thế nào"). Thay lưới 6 ô + 3 khối thi thử/AI/lộ trình nói trùng ý nhau. */
const PILLARS: {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  cta: string;
  href: string;
  guestHref?: string;
  preview: "lesson" | "exam" | "dictionary" | "speaking";
}[] = [
  {
    id: "lo-trinh",
    icon: "route",
    title: "Học theo lộ trình HSK 1–9",
    description: "744 bài theo chủ đề, mỗi bài 5–10 phút: làm quen từ, luyện nghe, ghép cặp, điền câu. Từ nào cũng có âm Hán Việt và mẹo đoán thanh điệu.",
    cta: "Học bài 1 ngay",
    href: "/learn",
    guestHref: "/bat-dau",
    preview: "lesson",
  },
  {
    id: "thi-thu",
    icon: "target",
    title: "Thi thử HSK có chữa bài",
    description: "10 đề HSK 1–4 đúng cấu trúc đề thật: nghe, đọc, viết, tính giờ. Chấm điểm ngay, giải thích từng câu bằng tiếng Việt — không cần tài khoản.",
    cta: "Làm đề HSK 1",
    href: "/thi-thu-hsk",
    preview: "exam",
  },
  {
    id: "tu-dien",
    icon: "book",
    title: "Từ điển có âm Hán Việt",
    description: "10.958 từ: nghĩa tiếng Việt, cách viết từng nét, câu ví dụ, mẹo nhớ. Chụp ảnh thực đơn, biển hiệu để tra ngay.",
    cta: "Tra thử 电脑",
    href: "/tu-dien/%E7%94%B5%E8%84%91",
    preview: "dictionary",
  },
  {
    id: "phat-am",
    icon: "mic",
    title: "Nói chuẩn thanh, luyện phản xạ",
    description: "Chấm thanh điệu bằng đồ thị cao độ ngay trên máy; luyện nói với AI theo tình huống gọi món, hỏi đường, mua sắm.",
    cta: "Thử chấm 你好",
    href: "#cham-thanh",
    preview: "speaking",
  },
];

/** Thứ giữ người học quay lại mỗi ngày — đều có thật trong app. */
const DAILY_HABITS: { icon: IconName; title: string; description: string }[] = [
  { icon: "flame", title: "Chuỗi ngày học", description: "Lỡ 1 ngày vẫn giữ chuỗi nhờ lá chắn — kiếm bằng nhiệm vụ mỗi ngày." },
  { icon: "refresh", title: "Ôn đúng lúc sắp quên", description: "Từ đã học tự quay lại theo lịch ôn ngắt quãng, từ hay quên được ôn riêng." },
  { icon: "trophy", title: "Giải đấu tuần", description: "Xếp hạng cùng người học khác, đứng đầu bảng là lên hạng." },
  { icon: "bell", title: "Nhắc học, báo cáo tuần", description: "Nhắc đúng giờ bạn chọn; cuối tuần xem mình đã học được gì." },
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
    "Có. HSK 1–3 mỗi cấp 3 đề, HSK 4 có 1 đề, đều đúng cấu trúc đề thật (nghe, đọc, viết, tính giờ). Làm xong có điểm từng phần, chữa từng câu kèm pinyin, bản dịch và từ vựng có âm Hán Việt, luyện lại câu sai và luyện riêng dạng bài còn yếu.",
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
    <div className="hanni-home">
      <section className="home-hero overflow-hidden border-b border-border">
        <div className="page-wrap home-hero-layout">
          <div className="home-hero-copy min-w-0 max-w-xl">
            <span className="section-label">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> HỌC
              TIẾNG TRUNG CHO NGƯỜI VIỆT
            </span>
            {/* Điểm khác biệt nói NGAY ở tiêu đề — trước đây là câu chung
             * chung "Học thêm mỗi ngày", còn lợi thế Hán Việt nằm ở dòng phụ
             * mà phần lớn khách không đọc tới. */}
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[56px]">
              Bạn đã biết <span className="whitespace-nowrap">tiếng Trung</span>{" "}
              <br />
              <span className="text-primary">nhiều hơn bạn nghĩ.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted sm:mt-5 sm:text-base sm:leading-7">
              <span lang="zh" className="hanzi">电话</span> là điện thoại,{" "}
              <span lang="zh" className="hanzi">世界</span> là thế giới.
              Học tiếng Trung qua âm Hán Việt theo lộ trình HSK 3.0, mỗi bài 5–10 phút.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
              {/* Khách: vào thẳng bài 1 (học trước, đăng ký sau — kiểu
               * Duolingo). Người đã biết một chút làm bài kiểm tra trình độ
               * thay vì tự khai cấp ở khảo sát. */}
              <LinkButton href={user ? "/learn" : "/bat-dau"} className="cta-shine px-6!">
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
          </div>
          <div className="home-hero-visual">
            <Image
              src="/illustrations/hanni/front-door.webp"
              alt="Cáo Hanni giơ thẻ từ bên bàn học, trước cửa sổ hoa văn Trung Hoa"
              fill
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 45vw, 570px"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          </div>
          <div className="home-dictionary min-w-0 max-w-xl rounded-2xl border border-border p-4">
            <p className="mb-2 px-1 text-xs font-semibold text-muted">
              Tra từ: Hán tự, pinyin, tiếng Việt hoặc cả câu
            </p>
            <DictionarySearch showTabs={false} />
            <div className="mt-2.5 flex flex-wrap gap-1.5 px-1">
              {QUICK_SEARCHES.map((q) => (
                <Link
                  key={q}
                  href={`/tu-dien?q=${encodeURIComponent(q)}`}
                  className="inline-flex min-h-8 items-center rounded-lg bg-surface-2 px-2.5 text-xs text-muted hover:text-primary"
                >
                  {q}
                </Link>
              ))}
            </div>
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
            { n: "10 đề", t: "thi thử HSK 1–4" },
          ].map((s) => (
            <div key={s.t} className="px-2 py-5 text-center">
              <dt className="sr-only">{s.t}</dt>
              <dd className="text-xl font-bold text-primary sm:text-2xl">{s.n}</dd>
              <dd className="mt-0.5 text-xs text-muted">{s.t}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="hanni-co-gi" className="page-wrap py-10! sm:py-14!">
        <div className="reveal max-w-2xl">
          <span className="section-label">HANNI CÓ GÌ?</span>
          <h2 id="hanni-co-gi" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Bốn cách học — vào thử ngay, chưa cần tài khoản
          </h2>
        </div>
        <ul className="reveal-group mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((p) => (
            <li key={p.id} className="reveal panel flex flex-col overflow-hidden">
              <SceneCover kind={p.preview === "lesson" ? "learn" : p.preview === "speaking" ? "pronunciation" : p.preview === "exam" ? "exam" : "dictionary"} />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Icon name={p.icon} size={18} className="shrink-0 text-primary" />
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">{p.description}</p>
                <Link
                  href={!user && p.guestHref ? p.guestHref : p.href}
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-primary hover:underline"
                >
                  {p.cta}
                  <Icon name="arrow" size={15} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="thu-the-tu" className="border-y border-border bg-surface">
        <div className="page-wrap grid items-center gap-7 py-10! sm:py-12! md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
          <div className="min-w-0">
            <span className="section-label">
              <Icon name="spark" size={14} /> HỌC QUA ÂM HÁN VIỆT
            </span>
            <h2 id="thu-the-tu" className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Thử đoán nghĩa một từ tiếng Trung
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted">
              Hanni đặt âm Hán Việt cạnh mỗi từ để bạn nối cách đọc mới với một nghĩa quen thuộc.
              Lật thẻ để xem bạn đã biết từ này chưa.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {HANVIET_EXAMPLES.map((ex) => (
                <li key={ex.zh} className="flex items-center gap-2.5 rounded-xl border border-border bg-[#fffaf7] px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1">
                  <span lang="zh" className="hanzi text-2xl text-primary">{ex.zh}</span>
                  <span className="text-xs text-muted">{ex.pinyin}</span>
                  <span className="ml-auto text-xs font-semibold sm:ml-0">{ex.meaning}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/tu-da-biet"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Xem thêm từ quen thuộc <Icon name="arrow" size={15} />
            </Link>
          </div>
          <StudyArtwork />
        </div>
      </section>

      <div className="page-wrap py-9! empty:hidden sm:py-12!">
        <VideoShelf />
      </div>

      {/* Thử phương pháp ngay trên trang chủ (như SuperChinese cho xem thử bài học) — chấm
       * thanh điệu chạy hẳn trên máy nên khách dùng được, không tốn lượt AI. */}
      <section aria-labelledby="cham-thanh" className="page-wrap grid items-center gap-8 py-12! md:grid-cols-[1fr_minmax(0,440px)]">
        <div className="reveal">
          <span className="section-label">
            <Icon name="mic" size={14} /> CHẤM THANH ĐIỆU
          </span>
          <h2 id="cham-thanh" className="mt-4 scroll-mt-24 text-2xl font-bold tracking-tight sm:text-3xl">
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

      <section aria-labelledby="hoc-deu" className="border-y border-border bg-surface">
        <div className="page-wrap py-10! sm:py-12!">
          <h2 id="hoc-deu" className="reveal text-xl font-bold tracking-tight sm:text-2xl">
            Học đều mỗi ngày, không bỏ giữa chừng
          </h2>
          <ul className="reveal-group mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DAILY_HABITS.map((h) => (
              <li key={h.title} className="reveal flex gap-3 rounded-2xl border border-border p-4">
                <span className="icon-tile shrink-0">
                  <Icon name={h.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{h.description}</span>
                </span>
              </li>
            ))}
          </ul>
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
/** Minh hoạ thu nhỏ cho từng trụ cột — dựng bằng HTML/SVG (không ảnh chụp màn hình), cao bằng nhau để 4 thẻ thẳng hàng. */
