import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { PartnerLeadForm } from "@/components/partners/partner-lead-form";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = {
  title: "Hợp tác cho giáo viên, trung tâm tiếng Trung — Hanni",
  description:
    "Tạo lớp học tiếng Trung miễn phí trên Hanni: giao bài từ lộ trình HSK 1–9 và đề thi thử HSK, xem tiến độ từng học viên. Học viên học bằng âm Hán Việt, chấm thanh điệu, AI chấm câu.",
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
  const [words, exams, sets] = await Promise.all([
    get<{ total: number; withHanViet: number }>("/words/stats"),
    get<unknown[]>("/mock-exams"),
    get<unknown[]>("/mock-exams/practice"),
  ]);
  const fmt = (n: number | undefined, fallback: string) => (n ? n.toLocaleString("vi-VN") : fallback);
  return {
    words: fmt(words?.total, "10.900+"),
    hanViet: fmt(words?.withHanViet, "9.800+"),
    exams: exams?.length ?? 9,
    sets: Array.isArray(sets) ? sets.length : 25,
  };
}

const TEACHER_GETS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "users",
    title: "Lớp học + mã mời",
    body: "Tạo lớp trong 1 phút, gửi mã 6 ký tự hoặc đường dẫn qua Zalo, Messenger, Google Classroom. Học viên tạo tài khoản miễn phí là vào lớp.",
  },
  {
    icon: "flag",
    title: "Giao bài có sẵn, có hạn nộp",
    body: "Chọn bài từ lộ trình 744 bài HSK 1–9 theo chủ đề, hoặc đề thi thử HSK đúng cấu trúc. Học viên được báo ngay và thấy bài ở trang chủ.",
  },
  {
    icon: "chart",
    title: "Tiến độ từng học viên",
    body: "Chuỗi ngày học, phút học 7 ngày qua, lần học cuối, bài đã xong, số từ, điểm thi thử cao nhất — và ai chưa làm bài nào.",
  },
  {
    icon: "target",
    title: "Đề thi thử để rà năng lực",
    body: "Đề HSK 1–3 có nghe, đọc, viết, chấm ngay, chữa từng câu bằng tiếng Việt kèm âm Hán Việt; luyện riêng từng dạng bài còn yếu.",
  },
];

const WHY: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "book",
    title: "Âm Hán Việt cho từng từ",
    body: "学生 = học sinh, 时间 = thời gian. Hanni có âm Hán Việt cho phần lớn từ HSK và tách nghĩa từng chữ — học viên nhớ nhanh hơn hẳn học thuộc lòng.",
  },
  {
    icon: "mic",
    title: "Chấm thanh điệu bằng đồ thị cao độ",
    body: "Học viên đọc to, Hanni vẽ đường giọng chồng lên giọng chuẩn và chỉ âm tiết nào lệch thanh — phân tích ngay trên máy, không cần giáo viên ngồi nghe từng em.",
  },
  {
    icon: "spark",
    title: "AI hiểu người Việt",
    body: "AI viết bài đọc chỉ dùng từ đã học, chấm câu học viên tự đặt, gợi mẹo nhớ theo âm Hán Việt, luyện nói nhập vai bằng giọng.",
  },
  {
    icon: "cards",
    title: "Ôn đúng lúc sắp quên",
    body: "Từ đã học tự quay lại theo lịch lặp lại ngắt quãng (FSRS) — giữ vốn từ giữa các buổi lên lớp mà giáo viên không phải nhắc.",
  },
];

const GROUPS: { icon: IconName; title: string; body: string; points: string[] }[] = [
  {
    icon: "home",
    title: "Trung tâm ngoại ngữ",
    body: "Làm phần tự học ở nhà giữa hai buổi lên lớp cho cả trung tâm.",
    points: ["Mỗi lớp một mã, giáo viên của trung tâm tự quản lý lớp mình", "Đề thi thử đầu khoá / cuối khoá cho cả lớp", "Cần nhiều hơn 20 lớp / 200 học viên mỗi lớp: liên hệ"],
  },
  {
    icon: "user",
    title: "Giáo viên, giảng viên",
    body: "Giao bài về nhà từ kho có sẵn thay vì soạn từng phiếu bài tập.",
    points: ["Bài học theo chủ đề, có audio cho mọi từ", "Biết ngay em nào chưa làm bài", "Học viên tự luyện nghe, nói, viết trên điện thoại"],
  },
  {
    icon: "heart",
    title: "Gia sư",
    body: "Theo dõi sát từng học viên kèm 1-1 hoặc nhóm nhỏ.",
    points: ["Thấy học viên học đều hay không qua chuỗi ngày, phút học", "Giao bài sát trình độ từng em", "Miễn phí, không giới hạn thời gian dùng"],
  },
];

const FAQ: [string, string][] = [
  [
    "Hợp tác có mất phí không?",
    "Không. Lớp học, toàn bộ lộ trình 9 cấp HSK và đề thi thử đều miễn phí cho giáo viên lẫn học viên. Premium chỉ là tiện ích AI thêm cho từng người (Hanni Coach, quét ảnh nhiều hơn…), không bắt buộc và không khoá bài học nào.",
  ],
  [
    "Giáo viên thấy được những gì của học viên?",
    "Trong lớp của mình: chuỗi ngày học, phút học 7 ngày, lần học cuối, số bài đã xong, số từ đang học, điểm thi thử cao nhất và bài giao nào đã làm. Giáo viên không thấy email hay mật khẩu. Học viên rời lớp là giáo viên không xem được nữa.",
  ],
  [
    "Học viên có phải cài ứng dụng không?",
    "Không bắt buộc. Hanni chạy trên trình duyệt máy tính và điện thoại; trên điện thoại có thể thêm vào màn hình chính như một ứng dụng và bật thông báo nhắc học, báo bài mới.",
  ],
  [
    "Có đề thi thử HSK 4–6 chưa?",
    "Hiện có đề HSK 1–3 (đủ nghe, đọc, viết) và các dạng bài luyện riêng. Đề HSK 4–6 đang được soạn — phần viết sẽ chấm bằng AI.",
  ],
  [
    "Trung tâm muốn mua Premium cho cả lớp?",
    "Gói theo số lượng đang được chuẩn bị cùng lúc mở thanh toán. Để lại thông tin ở form bên dưới, Hanni báo bạn khi mở và gửi mức giá theo quy mô.",
  ],
];

export default async function PartnersPage() {
  const s = await stats();
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-surface">
        <div className="page-wrap grid gap-8 py-12! lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:py-16!">
          <div>
            <p className="eyebrow">HỢP TÁC · GIÁO VIÊN · TRUNG TÂM · GIA SƯ</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bạn dạy tiếng Trung,
              <br />
              <span className="text-primary">Hanni lo phần luyện tập mỗi ngày.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Tạo lớp miễn phí, giao bài từ lộ trình HSK và đề thi thử đúng cấu trúc, xem tiến độ từng học viên. Học viên học bằng âm
              Hán Việt — cầu nối chỉ người Việt có.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/lop-hoc">
                <Icon name="users" size={17} /> Tạo lớp miễn phí
              </LinkButton>
              <LinkButton href="#lien-he" variant="secondary">
                Liên hệ hợp tác
              </LinkButton>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            {[
              [s.words, "từ vựng HSK có audio"],
              [s.hanViet, "từ có âm Hán Việt"],
              ["744", "bài học theo chủ đề, 9 cấp"],
              [`${s.exams} đề · ${s.sets} dạng`, "thi thử + luyện dạng bài HSK 1–3"],
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
        <section aria-labelledby="gv-nhan">
          <h2 id="gv-nhan" className="text-xl font-extrabold tracking-tight">
            Giáo viên nhận được gì
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEACHER_GETS.map((x) => (
              <div key={x.title} className="panel p-5">
                <span className="icon-tile flex h-11 w-11 items-center justify-center">
                  <Icon name={x.icon} size={20} />
                </span>
                <h3 className="mt-3 font-bold">{x.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{x.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="vi-sao">
          <h2 id="vi-sao" className="text-xl font-extrabold tracking-tight">
            Vì sao học viên của bạn tiến nhanh hơn
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            App quốc tế dạy qua tiếng Anh và bỏ qua âm Hán Việt. Hanni làm cho người Việt ngay từ đầu.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {WHY.map((x) => (
              <div key={x.title} className="panel flex gap-4 p-5">
                <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
                  <Icon name={x.icon} size={20} />
                </span>
                <div>
                  <h3 className="font-bold">{x.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="nhom">
          <h2 id="nhom" className="text-xl font-extrabold tracking-tight">
            Ba nhóm đối tác
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {GROUPS.map((g) => (
              <div key={g.title} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="icon-tile flex h-10 w-10 items-center justify-center">
                    <Icon name={g.icon} size={18} />
                  </span>
                  <h3 className="font-bold">{g.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{g.body}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {g.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Icon name="check" size={16} className="mt-0.5 shrink-0 text-good" />
                      <span className="leading-6">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ba-buoc" className="panel tint-primary p-6 sm:p-8">
          <h2 id="ba-buoc" className="text-xl font-extrabold tracking-tight">
            Ba bước là bắt đầu
          </h2>
          <ol className="mt-5 grid gap-5 md:grid-cols-3">
            {[
              ["Tạo tài khoản và lớp", "Miễn phí, khoảng 1 phút. Đặt tên lớp và cấp HSK."],
              ["Gửi mã cho học viên", "Qua Zalo, Messenger hay Google Classroom. Học viên vào lớp bằng mã hoặc đường dẫn."],
              ["Giao bài, xem tiến độ", "Giao bài học hoặc đề thi thử có hạn nộp, xem ai đã làm, ai học đều."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg">{i + 1}</span>
                <div>
                  <h3 className="font-bold">{t}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <LinkButton href="/lop-hoc" className="mt-6">
            Tạo lớp đầu tiên <Icon name="arrow" size={16} />
          </LinkButton>
        </section>

        <section aria-labelledby="hoi-dap">
          <h2 id="hoi-dap" className="text-xl font-extrabold tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {q}
                  <Icon name="chevron" size={16} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="lien-he" aria-labelledby="lien-he-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h2 id="lien-he-title" className="text-xl font-extrabold tracking-tight">
              Liên hệ hợp tác
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Trung tâm cần nhiều lớp, muốn gói Premium cho học viên, hoặc muốn cùng làm nội dung (đề thi, video, bài đọc)? Để lại vài
              dòng — Hanni liên hệ lại qua đúng kênh bạn chọn.
            </p>
            <p className="mt-4 text-sm text-muted">
              Muốn hiểu thêm về Hanni?{" "}
              <Link href="/gioi-thieu" className="font-semibold text-primary hover:underline">
                Đọc giới thiệu
              </Link>
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
