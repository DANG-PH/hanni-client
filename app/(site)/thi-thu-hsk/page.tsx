/**
 * Luyện thi HSK — danh sách đề thi thử đúng cấu trúc đề thật (Hanbeego,
 * HiHSK, XieHanzi đều có; trước đây `/exams` của Hanni chỉ là trắc nghiệm từ
 * vựng). Trang công khai cho SEO ("đề thi thử HSK 1", "cấu trúc đề HSK 1" là
 * truy vấn người Việt hay tìm) — khách làm được, đăng nhập để lưu điểm.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { MockExamInsights, MockExamList, MockExamProgress } from "@/components/mock-exam/exam-list";
import { ExamStructure } from "@/components/mock-exam/exam-structure";
import { API_BASE } from "@/lib/api";
import type { MockExamMeta } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Đề thi thử HSK 1, HSK 2, HSK 3 online miễn phí — đúng cấu trúc đề thật, chấm điểm ngay | Hanni",
  description:
    "Làm đề thi thử HSK 1, HSK 2, HSK 3 online miễn phí, đúng cấu trúc đề thi hiện hành: phần nghe có giọng đọc, phần đọc, phần viết HSK 3 (sắp xếp câu, viết chữ theo pinyin), tự chấm điểm và chữa bài từng câu bằng tiếng Việt (lời thoại, bản dịch, từ vựng kèm âm Hán Việt). Không cần đăng ký.",
  alternates: { canonical: "/thi-thu-hsk" },
};

// Trang prerender lúc build: API chưa chạy thì vẫn dựng được (danh sách tự tải
// lại phía client).
async function fetchExams(): Promise<MockExamMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/mock-exams`, { next: { revalidate } });
    if (!res.ok) return [];
    return (await res.json()) as MockExamMeta[];
  } catch {
    return [];
  }
}

const TIPS = [
  "Bấm giờ như thi thật để quen áp lực thời gian.",
  "Phần nghe: đọc trước các tranh/đáp án để biết cần nghe gì.",
  "Phần ghép A–F: làm câu chắc chắn trước, loại dần phương án đã dùng.",
  "Sai ở đâu, ôn lại đúng từ vựng đó trong lộ trình rồi làm đề khác.",
];

const FAQ: [string, string][] = [
  [
    "Đề thi thử trên Hanni có giống đề HSK thật không?",
    "Giống về CẤU TRÚC: HSK 1 gồm 40 câu (20 nghe, 20 đọc), HSK 2 gồm 60 câu (35 nghe, 25 đọc), HSK 3 gồm 80 câu (40 nghe, 30 đọc, 10 viết), đủ các dạng câu y như đề thật. Nội dung do Hanni tự soạn, chỉ dùng từ vựng đúng cấp (HSK 3.0), tranh minh hoạ bằng biểu tượng, phần nghe dùng giọng đọc tiếng Trung của trình duyệt chứ không phải băng ghi âm đề thật.",
  ],
  [
    "Thi HSK bao nhiêu điểm thì đạt?",
    "HSK 1 và HSK 2 đều tổng 200 điểm (nghe 100, đọc 100), đạt từ 120 điểm. HSK 3 trở lên có thêm phần viết, tổng 300 điểm, đạt từ 180.",
  ],
  [
    "Đề HSK 1, HSK 2, HSK 3 thi trong bao lâu?",
    "HSK 1 khoảng 40 phút, HSK 2 khoảng 55 phút, HSK 3 khoảng 90 phút — đã gồm 5 phút điền thông tin cá nhân. Đề thử trên Hanni tính giờ đúng thời gian làm bài: 35 phút với HSK 1, 50 phút với HSK 2, 85 phút với HSK 3.",
  ],
  [
    "Đề thi HSK 2 gồm những phần nào?",
    "Nghe 35 câu: nghe câu đối chiếu tranh (10), nghe hội thoại ghép tranh (10), hội thoại ngắn chọn đáp án (10), hội thoại dài chọn đáp án (5). Đọc 25 câu: ghép câu với tranh (5), điền từ (5), đọc đoạn văn xét câu ★ đúng/sai (5), ghép câu hỏi – câu trả lời (10).",
  ],
  [
    "Đề thi HSK 3 gồm những phần nào?",
    "Nghe 40 câu: nghe hội thoại ghép tranh (10), nghe một đoạn văn xét câu ★ đúng/sai (10), hội thoại ngắn chọn đáp án (10), hội thoại dài chọn đáp án (10). Đọc 30 câu: ghép câu với câu đáp (10), chọn từ điền chỗ trống (10), đọc đoạn văn trả lời câu hỏi (10). Viết 10 câu: sắp xếp từ thành câu (5), nhìn pinyin viết chữ Hán (5). Tổng 300 điểm, đạt từ 180. Trên Hanni, câu viết chữ chọn trong các chữ đồng âm — giống thi trên máy, gõ pinyin rồi chọn chữ.",
  ],
  [
    "Có cần tạo tài khoản không?",
    "Không. Ai cũng làm và xem điểm, chữa bài được. Đăng nhập để lưu điểm từng đề và theo dõi tiến bộ qua các lần làm.",
  ],
  [
    "HSK 3.0 thì sao?",
    "Các kỳ thi HSK 1–6 thường kỳ năm 2026 vẫn dùng đề dạng hiện hành; đề theo chuẩn HSK 3.0 mới thi ở một số đợt riêng. Từ vựng trong đề Hanni lấy theo danh sách HSK 3.0 nên ôn theo đề này không bị lệch.",
  ],
];

export default async function MockExamHubPage() {
  const exams = await fetchExams();

  return (
    <div className="page-wrap max-w-6xl! space-y-8 py-8!">
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="panel tint-primary p-6 sm:p-8">
          <span className="eyebrow">LUYỆN THI HSK</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Đề thi thử HSK online
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Đúng cấu trúc đề thi HSK hiện hành: phần nghe có giọng đọc, phần đọc in pinyin như đề
            HSK 1–2, HSK 3 có thêm phần viết. Nộp bài là có điểm ngay, kèm chữa bài từng câu bằng
            tiếng Việt — lời thoại, bản dịch, chỗ dễ nhầm.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {["HSK 1 · HSK 2 · HSK 3", "Nghe · Đọc · Viết", "Chữa bài tiếng Việt", "Miễn phí"].map((t) => (
              <li key={t} className="rounded-full border border-primary/20 bg-surface/70 px-3 py-1.5">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <MockExamProgress exams={exams} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section aria-labelledby="exam-list" className="min-w-0 space-y-3">
          <h2 id="exam-list" className="text-lg font-extrabold tracking-tight">
            Chọn đề
          </h2>
          <MockExamList exams={exams} />
          <div className="pt-3">
            <MockExamInsights exams={exams} />
          </div>
          {/* Câu hỏi thường gặp nằm ở cột trái (không trải cả trang bên dưới):
           * danh sách đề chỉ vài thẻ nên cột trái hết sớm, cạnh cột phải dài 4
           * khối là một mảng trống lớn (đo 1920px: 503px vs 1019px). */}
          <section aria-labelledby="faq" className="space-y-3 pt-3">
            <h2 id="faq" className="text-lg font-extrabold tracking-tight">
              Câu hỏi thường gặp
            </h2>
            {FAQ.map(([q, a]) => (
              <details key={q} className="panel group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <Icon name="chevron" size={16} className="shrink-0 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted">{a}</p>
              </details>
            ))}
          </section>
        </section>

        <aside className="min-w-0 space-y-4">
          {/* Như ô "Đánh giá năng lực — Bạn đang ở đâu?" cạnh danh sách đề của Hanzii. */}
          <Link
            href="/kiem-tra-trinh-do"
            className="panel flex items-center gap-3 p-4 text-sm transition-colors hover:border-primary/40"
          >
            <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
              <Icon name="chart" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong>Chưa biết nên thi cấp nào?</strong>
              <span className="block text-xs text-muted">Kiểm tra trình độ — vài phút, không cần tài khoản</span>
            </span>
            <Icon name="arrow" size={16} className="shrink-0 text-muted" />
          </Link>
          <ExamStructure />
          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Icon name="spark" size={16} className="text-primary" /> Mẹo luyện thi
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-6">
              {TIPS.map((t, i) => (
                <li key={t} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </section>
          <Link
            href="/exams"
            className="panel flex items-center gap-3 p-4 text-sm transition-colors hover:border-primary/40"
          >
            <Icon name="clock" size={18} className="text-primary" />
            <span className="flex-1">
              <strong>Luyện nhanh từ vựng</strong>
              <span className="block text-xs text-muted">Trắc nghiệm tính giờ từng câu, 5 phút</span>
            </span>
            <Icon name="arrow" size={16} className="text-muted" />
          </Link>
        </aside>
      </div>

    </div>
  );
}
