import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = {
  title: "Giới thiệu Hanni — học tiếng Trung bằng âm Hán Việt",
  description:
    "Hanni là ứng dụng học tiếng Trung cho người Việt: lộ trình HSK 3.0, âm Hán Việt cho từng từ, chấm thanh điệu bằng đồ thị cao độ, đề thi thử HSK đúng cấu trúc và trợ giảng AI.",
};

export const revalidate = 86400;

async function wordStats() {
  try {
    const r = await fetch(`${API_BASE}/words/stats`, { next: { revalidate } });
    return r.ok ? ((await r.json()) as { total: number; withHanViet: number }) : null;
  } catch {
    return null;
  }
}

const PROBLEMS: { problem: string; answer: string; icon: IconName }[] = [
  {
    icon: "book",
    problem: "App quốc tế dạy qua tiếng Anh, bỏ qua thứ người Việt đã có sẵn: âm Hán Việt.",
    answer: "Mỗi từ có âm Hán Việt và nghĩa từng chữ (电脑 = điện + não → máy tính). Từ trùng nghĩa tiếng Việt được đánh dấu — bạn đã biết sẵn hàng nghìn từ.",
  },
  {
    icon: "mic",
    problem: "Thanh điệu là chỗ khó nhất, tự học thì không ai sửa.",
    answer: "Đọc to, Hanni vẽ đường cao độ giọng bạn chồng lên giọng chuẩn và chỉ âm tiết lệch thanh, kèm mẹo đoán thanh từ dấu tiếng Việt.",
  },
  {
    icon: "route",
    problem: "Nhiều công cụ rời rạc, không biết hôm nay nên học gì.",
    answer: "Một lộ trình, một nút Học tiếp: 744 bài HSK 3.0 chia theo chủ đề; từ đã học tự quay lại đúng lúc sắp quên.",
  },
  {
    icon: "target",
    problem: "Luyện thi tốn tiền, đề trên mạng không đúng cấu trúc.",
    answer: "Đề thi thử HSK 1–3 đúng cấu trúc đề thật, chấm ngay, chữa từng câu bằng tiếng Việt — làm được cả khi chưa có tài khoản.",
  },
];

const TECH: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "spark",
    title: "AI (Google Gemini)",
    body: "Bài đọc viết riêng cho từng bài học (chỉ dùng chữ thuộc cấp đó — máy chủ soát lại từng chữ), chấm câu tự đặt, mẹo nhớ theo âm Hán Việt, luyện nói nhập vai, quét ảnh thực đơn/biển hiệu, nhận xét học tập hằng tuần.",
  },
  {
    icon: "sound",
    title: "Xử lý giọng nói ngay trên máy",
    body: "Dò cao độ (thuật toán YIN) chạy trong trình duyệt để chấm thanh điệu — giọng không gửi đi đâu, không tốn lượt AI.",
  },
  {
    icon: "cards",
    title: "Lặp lại ngắt quãng",
    body: "Lịch ôn theo SM-2 và FSRS (thuật toán của Anki hiện đại) — ôn ít mà nhớ lâu.",
  },
  {
    icon: "chart",
    title: "Dữ liệu chuẩn, có ghi công",
    body: "Đại cương HSK 3.0 bản 11/2025 (9 cấp), từ điển mở CVDICT, Unihan cho âm Hán Việt — gần 900 nghĩa và hàng trăm âm Hán Việt đã được rà, sửa tay.",
  },
];

const TIMELINE: [string, string, string][] = [
  ["09/2026", "Khởi động", "Lõi học tập: tài khoản, 10.900+ từ HSK 3.0 có audio, ôn lặp lại ngắt quãng, chuỗi ngày và huy hiệu."],
  ["09/2026", "Âm Hán Việt + từ điển công khai", "Âm Hán Việt cho từng từ, phân tích từng chữ; từ điển và 235 điểm ngữ pháp mở cho mọi người tra."],
  ["10/2026", "Một lộ trình, một nút Học tiếp", "744 bài theo chủ đề cho 9 cấp, kiểm tra trình độ, bảng phiên âm, đề thi thử HSK 1–3 đúng cấu trúc."],
  ["10/2026", "Chấm thanh điệu + trợ giảng AI", "Đồ thị cao độ giọng nói, luyện nói nhập vai bằng giọng, quét ảnh học từ, bài đọc AI theo từng bài học."],
  ["10/2026", "Lớp học cho giáo viên", "Giáo viên tạo lớp, giao bài, xem tiến độ từng học viên — miễn phí."],
];

export default async function AboutPage() {
  const ws = await wordStats();
  const fmt = (n: number | undefined, fallback: string) => (n ? n.toLocaleString("vi-VN") : fallback);
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-surface">
        <div className="page-wrap py-12! lg:py-16!">
          <p className="eyebrow">GIỚI THIỆU</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Học tiếng Trung bằng chính <span className="text-primary">tiếng Việt</span> của bạn.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Hơn một nửa từ vựng tiếng Việt có gốc Hán. Đọc từ tiếng Trung theo âm Hán Việt, rất nhiều từ trùng luôn nghĩa tiếng Việt:
            学生 là học sinh, 时间 là thời gian, 国家 là quốc gia — và dấu tiếng Việt còn gợi được thanh điệu tiếng Trung. Hanni biến
            vốn từ bạn đã có thành lối tắt để nhớ tiếng Trung, điều các ứng dụng quốc tế không làm vì không được làm cho người Việt.
          </p>
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [fmt(ws?.total, "10.900+"), "từ vựng HSK 3.0"],
              [fmt(ws?.withHanViet, "9.800+"), "từ có âm Hán Việt"],
              ["744", "bài học, 9 cấp"],
              ["235", "điểm ngữ pháp giải thích tiếng Việt"],
            ].map(([n, t]) => (
              <div key={t} className="panel flex flex-col-reverse p-4">
                <dt className="mt-1 text-xs leading-5 text-muted">{t}</dt>
                <dd className="text-2xl font-extrabold text-primary">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="page-wrap space-y-14 py-12!">
        <section aria-labelledby="van-de">
          <h2 id="van-de" className="text-xl font-extrabold tracking-tight">
            Người Việt học tiếng Trung hay vướng ở đâu — và Hanni làm gì
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.problem} className="panel p-5">
                <div className="flex items-start gap-3">
                  <span className="icon-tile flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon name={p.icon} size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-muted line-through decoration-danger/40">{p.problem}</p>
                    <p className="mt-2 text-sm leading-6">{p.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="cong-nghe">
          <h2 id="cong-nghe" className="text-xl font-extrabold tracking-tight">
            Công nghệ bên dưới
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TECH.map((t) => (
              <div key={t.title} className="panel p-5">
                <span className="icon-tile flex h-10 w-10 items-center justify-center">
                  <Icon name={t.icon} size={18} />
                </span>
                <h3 className="mt-3 font-bold">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="nguyen-tac" className="panel tint-primary p-6 sm:p-8">
          <h2 id="nguyen-tac" className="text-xl font-extrabold tracking-tight">
            Ba điều Hanni giữ
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {[
              ["Không khoá nội dung học", "9 cấp HSK, từ điển, ngữ pháp, đề thi thử đều miễn phí. Premium chỉ thêm tiện ích AI."],
              ["Thà thiếu còn hơn sai", "Âm Hán Việt chưa chắc thì để trống; câu ví dụ soạn tay, mỗi câu chỉ dùng chữ thuộc đúng cấp đó."],
              ["Mọi thứ nối vào việc học", "Tra từ là lưu để ôn được, làm đề sai là luyện lại được, giáo viên giao bài là hiện ngay ở trang chủ."],
            ].map(([t, d]) => (
              <div key={t}>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="chang-duong">
          <h2 id="chang-duong" className="text-xl font-extrabold tracking-tight">
            Chặng đường
          </h2>
          <ol className="mt-5 space-y-4 border-l-2 border-primary/25 pl-5">
            {TIMELINE.map(([when, title, body]) => (
              <li key={title} className="relative">
                <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" aria-hidden />
                <p className="text-xs font-bold tracking-wide text-primary">{when}</p>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{body}</p>
              </li>
            ))}
            <li className="relative">
              <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full border-2 border-primary bg-surface" aria-hidden />
              <p className="text-xs font-bold tracking-wide text-muted">SẮP TỚI</p>
              <h3 className="font-bold">Đề HSK 4–6, câu ví dụ cho mọi cấp, gói cho trung tâm</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Phần viết HSK 4+ chấm bằng AI; câu ví dụ soạn tay cho HSK 4–9.</p>
            </li>
          </ol>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-extrabold">Bắt đầu từ bài 1 — chưa cần tài khoản</h2>
            <p className="mt-1 text-sm text-muted">
              Là giáo viên hay trung tâm?{" "}
              <Link href="/hop-tac" className="font-semibold text-primary hover:underline">
                Xem cách hợp tác
              </Link>
            </p>
          </div>
          <LinkButton href="/bat-dau" className="shrink-0">
            Học bài đầu tiên <Icon name="arrow" size={16} />
          </LinkButton>
        </section>
      </div>
    </div>
  );
}
