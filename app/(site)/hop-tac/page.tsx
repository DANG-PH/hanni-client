import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { PartnerLeadForm } from "@/components/partners/partner-lead-form";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = {
  title: "Lớp học tiếng Trung miễn phí cho giáo viên, trung tâm — Hanni",
  description:
    "Giáo viên tạo lớp miễn phí trên Hanni, gửi mã cho học viên, giao bài từ lộ trình HSK 1–9 hoặc đề thi thử HSK, xem ai đã làm bài và ai học đều mỗi ngày.",
};

export const revalidate = 86400;

/** Số liệu thật lấy từ API — trang dựng sẵn lúc build nên phải tự nuốt lỗi (API chưa chạy không được làm sập build). */
async function stats() {
  const get = async <T,>(path: string): Promise<T | null> => {
    try {
      const r = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const [words, exams] = await Promise.all([
    get<{ total: number; withHanViet: number }>("/words/stats"),
    get<unknown[]>("/mock-exams"),
  ]);
  return {
    words: words?.total ? words.total.toLocaleString("vi-VN") : "10.900+",
    exams: Array.isArray(exams) ? exams.length : 10,
  };
}

/** Cả luồng trong 4 bước — mỗi bước ghi rõ AI làm (user 2026-10-20: "ai được tạo lớp? chưa hiểu luồng"). */
const FLOW: { icon: IconName; who: string; title: string; body: string }[] = [
  { icon: "plus", who: "Giáo viên", title: "Tạo lớp", body: "Đặt tên lớp và cấp HSK, nhận ngay mã lớp 6 ký tự. Mất khoảng 1 phút." },
  { icon: "share", who: "Giáo viên", title: "Gửi mã cho học viên", body: "Gửi đường dẫn qua Zalo, Messenger, Google Classroom — hoặc đọc mã trên lớp." },
  { icon: "user", who: "Học viên", title: "Vào lớp, làm bài", body: "Tạo tài khoản miễn phí, vào lớp. Bài được giao hiện ngay ở Trang chủ, kèm hạn nộp." },
  { icon: "chart", who: "Giáo viên", title: "Xem tiến độ", body: "Ai đã làm bài, ai học đều, phút học tuần này, điểm thi thử cao nhất của từng em." },
];

const FAQ: [string, string][] = [
  [
    "Ai được tạo lớp?",
    "Bất kỳ ai có tài khoản Hanni — người tạo lớp là giáo viên của lớp đó. Không cần duyệt, không cần gói giáo viên, giống Google Classroom với tài khoản cá nhân. Giáo viên chỉ thấy tiến độ của người TỰ vào lớp bằng mã, nên không có gì phải kiểm duyệt.",
  ],
  [
    "Có mất phí không?",
    "Không. Lớp học, toàn bộ lộ trình 9 cấp HSK và đề thi thử đều miễn phí cho cả giáo viên lẫn học viên. Premium chỉ là tiện ích AI thêm cho từng người, không khoá bài học nào.",
  ],
  [
    "Giáo viên thấy được những gì của học viên?",
    "Trong lớp của mình: chuỗi ngày học, phút học 7 ngày, lần học cuối, số bài đã xong, số từ đang học, điểm thi thử cao nhất và bài giao nào đã làm. Không thấy email hay mật khẩu. Học viên rời lớp là giáo viên không xem được nữa.",
  ],
  [
    "Học viên có phải cài ứng dụng không?",
    "Không bắt buộc. Hanni chạy trên trình duyệt máy tính và điện thoại; trên điện thoại có thể thêm vào màn hình chính như một ứng dụng và bật thông báo báo bài mới.",
  ],
  [
    "Trung tâm cần nhiều lớp hoặc muốn mua Premium cho cả lớp?",
    "Mỗi tài khoản tạo được 20 lớp, mỗi lớp 200 học viên. Cần nhiều hơn, hoặc muốn gói Premium theo số lượng (đang chuẩn bị cùng lúc mở thanh toán), để lại thông tin ở form cuối trang.",
  ],
];

/** Màn giáo viên thu nhỏ — dữ liệu MINH HOẠ (ghi rõ trên khung), để người xem thấy ngay mình sẽ dùng cái gì. */
function TeacherPreview() {
  const rows: [string, string, number, number, boolean][] = [
    ["Học viên A", "Hôm nay", 12, 95, true],
    ["Học viên B", "Hôm qua", 5, 40, true],
    ["Học viên C", "6 ngày trước", 0, 0, false],
  ];
  return (
    <figure className="panel relative overflow-hidden p-4 sm:p-5" aria-label="Minh hoạ màn hình lớp học của giáo viên">
      <span className="absolute top-3 right-3 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">Minh hoạ</span>
      <p className="text-xs font-semibold text-muted">Lớp của bạn</p>
      <p className="mt-0.5 font-bold">HSK 1 — tối thứ 3, 5</p>
      <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2/70 p-3">
        <span className="text-xs text-muted">Mã lớp</span>
        <span className="font-mono text-lg font-extrabold tracking-[0.2em] text-primary">HN4K7P</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-fg">
          <Icon name="share" size={13} /> Gửi
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-border p-3">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <Icon name="flag" size={14} className="text-primary" /> Bài 2 · Gia đình — còn 2 ngày
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full w-2/3 rounded-full bg-good" />
          </span>
          <span className="text-xs text-muted">2/3 đã làm</span>
        </div>
      </div>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="text-muted">
          <tr>
            <th className="py-1.5 font-medium">Học viên</th>
            <th className="py-1.5 font-medium">Học lần cuối</th>
            <th className="py-1.5 text-right font-medium">Chuỗi</th>
            <th className="py-1.5 text-right font-medium">Phút/7 ngày</th>
            <th className="py-1.5 text-right font-medium">Bài 2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([name, last, streak, minutes, done]) => (
            <tr key={name}>
              <td className="py-2 font-semibold">{name}</td>
              <td className={`py-2 ${done ? "" : "text-danger"}`}>{last}</td>
              <td className="py-2 text-right tabular-nums">{streak}</td>
              <td className="py-2 text-right tabular-nums">{minutes}</td>
              <td className="py-2 text-right">
                {done ? <Icon name="check" size={14} className="ml-auto text-good" /> : <span className="text-muted">chưa</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default async function TeachersPage() {
  const s = await stats();
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-surface">
        <div className="page-wrap grid grid-cols-1 gap-8 py-10! lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:py-14!">
          <div className="min-w-0">
            <p className="eyebrow">DÀNH CHO GIÁO VIÊN · TRUNG TÂM · GIA SƯ</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Lớp học tiếng Trung miễn phí cho giáo viên</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Tạo lớp, gửi mã cho học viên, giao bài từ lộ trình HSK hoặc đề thi thử — rồi xem ai đã làm, ai học đều mỗi ngày.
            </p>
            <p className="mt-3 flex max-w-xl items-start gap-2 text-sm leading-6">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-good" />
              <span>
                <b>Ai có tài khoản Hanni cũng tạo được lớp</b> — không cần duyệt, không cần gói giáo viên.
              </span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/lop-hoc#tao-lop">
                <Icon name="users" size={17} /> Tạo lớp miễn phí
              </LinkButton>
              <LinkButton href="#cach-hoat-dong" variant="secondary">
                Xem cách hoạt động
              </LinkButton>
            </div>
          </div>
          <div className="min-w-0">
            <TeacherPreview />
          </div>
        </div>
      </section>

      <div className="page-wrap space-y-14 py-12!">
        <section id="cach-hoat-dong" aria-labelledby="cach-hoat-dong-title" className="scroll-mt-24">
          <h2 id="cach-hoat-dong-title" className="text-xl font-extrabold tracking-tight">
            Cách hoạt động
          </h2>
          <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((step, i) => (
              <li key={step.title} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    {i + 1}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">{step.who}</span>
                </div>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="giao-gi" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <h2 id="giao-gi" className="sr-only">
            Giao được những gì
          </h2>
          {[
            ["cards", "Bài học theo lộ trình", "Hơn 700 bài HSK 1–9 chia theo chủ đề: giới thiệu từ có âm Hán Việt, luyện nghe, ghép cặp, điền câu."],
            ["target", `${s.exams} đề thi thử HSK 1–4`, "Đúng cấu trúc đề thật, chấm ngay, chữa từng câu bằng tiếng Việt — giao làm đề đầu khoá, cuối khoá."],
            ["book", `${s.words} từ có audio`, "Học viên tự ôn từ đã học theo lịch lặp lại ngắt quãng — giữ vốn từ giữa các buổi lên lớp."],
          ].map(([icon, title, body]) => (
            <div key={title} className="panel flex gap-4 p-5">
              <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
                <Icon name={icon as IconName} size={20} />
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="hoi-dap">
          <h2 id="hoi-dap" className="text-xl font-extrabold tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {FAQ.map(([q, a], i) => (
              <details key={q} className="group p-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {q}
                  <Icon name="chevron" size={16} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="lien-he" aria-labelledby="lien-he-title" className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h2 id="lien-he-title" className="text-xl font-extrabold tracking-tight">
              Trung tâm muốn hợp tác?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Cần nhiều lớp hơn, muốn gói Premium cho học viên, hoặc muốn cùng làm nội dung (đề thi, video, bài đọc)? Để lại vài dòng —
              Hanni liên hệ lại qua đúng kênh bạn chọn. Giáo viên dạy lẻ thì không cần đợi:{" "}
              <Link href="/lop-hoc#tao-lop" className="font-semibold text-primary hover:underline">
                tạo lớp ngay
              </Link>
              .
            </p>
          </div>
          <div className="panel p-5 sm:p-6">
            <PartnerLeadForm />
          </div>
        </section>
      </div>
    </div>
  );
}
