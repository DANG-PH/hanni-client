/**
 * Luyện thi HSK — danh sách đề thi thử đúng cấu trúc đề thật (Hanbeego,
 * HiHSK, XieHanzi đều có; trước đây `/exams` của Hanni chỉ là trắc nghiệm từ
 * vựng). Trang công khai cho SEO ("đề thi thử HSK 1", "cấu trúc đề HSK 1" là
 * truy vấn người Việt hay tìm) — khách làm được, đăng nhập để lưu điểm.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { MockExamList, MockExamProgress } from "@/components/mock-exam/exam-list";
import { API_BASE } from "@/lib/api";
import type { MockExamMeta } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Đề thi thử HSK online miễn phí — đúng cấu trúc đề thật, chấm điểm ngay | Hanni",
  description:
    "Làm đề thi thử HSK online miễn phí, đúng cấu trúc đề thi hiện hành: phần nghe có giọng đọc, phần đọc in pinyin, tự chấm điểm và chữa bài từng câu bằng tiếng Việt (lời thoại, bản dịch). Không cần đăng ký.",
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

const HSK1_STRUCTURE = [
  { part: "Nghe — Phần 1", task: "Nghe từ, đối chiếu tranh: đúng ✓ / sai ✗", n: 5 },
  { part: "Nghe — Phần 2", task: "Nghe 1 câu, chọn 1 trong 3 tranh", n: 5 },
  { part: "Nghe — Phần 3", task: "Nghe hội thoại, ghép với tranh A–F", n: 5 },
  { part: "Nghe — Phần 4", task: "Nghe câu + câu hỏi, chọn đáp án", n: 5 },
  { part: "Đọc — Phần 1", task: "Đọc từ, đối chiếu tranh: đúng ✓ / sai ✗", n: 5 },
  { part: "Đọc — Phần 2", task: "Đọc câu, ghép với tranh A–F", n: 5 },
  { part: "Đọc — Phần 3", task: "Ghép câu hỏi với câu trả lời A–F", n: 5 },
  { part: "Đọc — Phần 4", task: "Chọn từ A–F điền vào chỗ trống", n: 5 },
];

const TIPS = [
  "Bấm giờ như thi thật để quen áp lực thời gian.",
  "Phần nghe: đọc trước các tranh/đáp án để biết cần nghe gì.",
  "Phần ghép A–F: làm câu chắc chắn trước, loại dần phương án đã dùng.",
  "Sai ở đâu, ôn lại đúng từ vựng đó trong lộ trình rồi làm đề khác.",
];

const FAQ: [string, string][] = [
  [
    "Đề thi thử trên Hanni có giống đề HSK thật không?",
    "Giống về CẤU TRÚC: HSK 1 gồm 40 câu (20 câu nghe, 20 câu đọc), 8 dạng câu y như đề thật, thang 200 điểm. Nội dung do Hanni tự soạn bằng đúng 300 từ vựng HSK 1, tranh minh hoạ bằng biểu tượng, phần nghe dùng giọng đọc tiếng Trung của trình duyệt chứ không phải băng ghi âm đề thật.",
  ],
  [
    "Thi HSK 1 bao nhiêu điểm thì đạt?",
    "Tổng 200 điểm (nghe 100, đọc 100), đạt từ 120 điểm. HSK 3 trở lên có thêm phần viết, tổng 300 điểm, đạt từ 180.",
  ],
  [
    "Đề HSK 1 thi trong bao lâu?",
    "Khoảng 40 phút: nghe chừng 15 phút, đọc 17 phút, cộng thời gian điền phiếu. Đề thử trên Hanni cho 35 phút làm bài.",
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
            HSK 1–2. Nộp bài là có điểm ngay, kèm chữa bài từng câu bằng tiếng Việt — lời thoại,
            bản dịch, chỗ dễ nhầm.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            {["40 câu · 35 phút", "200 điểm, đạt 120", "Chữa bài tiếng Việt", "Miễn phí"].map((t) => (
              <li key={t} className="rounded-full border border-primary/20 bg-surface/70 px-3 py-1.5">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <MockExamProgress exams={exams} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section aria-labelledby="exam-list" className="space-y-3">
          <h2 id="exam-list" className="text-lg font-extrabold tracking-tight">
            Chọn đề
          </h2>
          <MockExamList exams={exams} />
        </section>

        <aside className="space-y-4">
          <section className="panel p-5">
            <h2 className="text-sm font-bold">Cấu trúc đề thi HSK 1</h2>
            <table className="mt-3 w-full text-xs">
              <tbody>
                {HSK1_STRUCTURE.map((r) => (
                  <tr key={r.part} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-2 align-top font-semibold whitespace-nowrap">{r.part}</td>
                    <td className="py-2 text-muted">{r.task}</td>
                    <td className="py-2 pl-2 text-right align-top font-semibold">{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted">Tổng 40 câu · 200 điểm · đạt từ 120 điểm.</p>
          </section>
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

      <section aria-labelledby="faq" className="space-y-3">
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
    </div>
  );
}
