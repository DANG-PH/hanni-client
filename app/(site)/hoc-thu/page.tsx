/**
 * "Học thử" — 8 thẻ từ HSK1, KHÔNG cần đăng ký.
 *
 * Mảnh ghép giữa SEO và người dùng thật: `/tu-dien` kéo người từ Google về,
 * nhưng đọc xong nghĩa một từ rồi thì hết — họ chưa nếm được việc HỌC ở
 * Hanni ra sao, mà đã bị đòi tạo tài khoản. Research retention (Duolingo và
 * cộng đồng app học ngôn ngữ) đều chỉ về cùng một chỗ: cho người dùng chạm
 * tới giá trị cốt lõi NGAY trong phiên đầu, và đừng bắt đăng ký trước khi
 * họ thấy giá trị đó.
 *
 * Cố tình làm ĐƠN GIẢN, không đụng SRS: chỉ lật thẻ xem nghĩa. Học xong 8 từ
 * mới mời tạo tài khoản, và lúc đó lời mời là CỤ THỂ ("lưu 8 từ vừa học")
 * chứ không chung chung.
 *
 * Trang vỏ là Server Component (nội dung + metadata cho Google), phần lật
 * thẻ nằm trong client component riêng.
 */
import type { Metadata } from "next";
import { API_BASE } from "@/lib/api";
import type { Paginated, Word } from "@/lib/types";
import { TrialDeck } from "./trial-deck";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Học thử 8 từ tiếng Trung HSK 1 — không cần đăng ký | Hanni",
  description:
    "Học thử ngay 8 từ vựng HSK 1 đầu tiên kèm pinyin, âm Hán Việt và audio phát âm chuẩn. Không cần tạo tài khoản, không cần cài đặt gì.",
  alternates: { canonical: "/hoc-thu" },
};

async function fetchTrialWords(): Promise<Word[]> {
  // try/catch: fetch THROW khi API không phản hồi (build/ISR), không chỉ !res.ok
  try {
    const res = await fetch(`${API_BASE}/words?level=1&pageSize=8`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Paginated<Word>;
    return data.items;
  } catch {
    return [];
  }
}

export default async function HocThuPage() {
  const words = await fetchTrialWords();

  return (
    <div className="page-wrap max-w-2xl! space-y-6 py-10!">
      <section className="text-center">
        <span className="eyebrow">HỌC THỬ NGAY</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          8 từ đầu tiên của bạn
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted">
          Không cần đăng ký, không cần cài gì. Chạm vào thẻ để xem nghĩa và
          âm Hán Việt — cách người Việt nhớ chữ Hán nhanh nhất.
        </p>
      </section>

      {words.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Chưa tải được từ vựng. Vui lòng thử lại sau.
        </p>
      ) : (
        <TrialDeck words={words} />
      )}
    </div>
  );
}
