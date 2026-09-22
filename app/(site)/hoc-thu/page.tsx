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
import type { Word } from "@/lib/types";
import { TrialDeck } from "./trial-deck";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Học thử 8 từ tiếng Trung bạn đã biết sẵn — không cần đăng ký | Hanni",
  description:
    "8 từ tiếng Trung mà âm Hán Việt trùng luôn nghĩa tiếng Việt: 时间 = thời gian, 电话 = điện thoại, 机会 = cơ hội. Có pinyin và audio phát âm chuẩn, không cần tạo tài khoản.",
  alternates: { canonical: "/hoc-thu" },
};

async function fetchTrialWords(): Promise<Word[]> {
  // `/words/trial` chứ không phải 8 từ HSK1 thông dụng nhất: những từ đó là
  // 的/我/你/是/了/不/在/他 — toàn hư từ, âm Hán Việt không gợi được gì, tức
  // là thẻ ĐẦU TIÊN người lạ nhìn thấy lại phản chứng đúng lời hứa của trang
  // ("âm Hán Việt — cách người Việt nhớ chữ Hán nhanh nhất"). Xem
  // WordsService.trialWords().
  // try/catch: fetch THROW khi API không phản hồi (build/ISR), không chỉ !res.ok
  try {
    const res = await fetch(`${API_BASE}/words/trial`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    return (await res.json()) as Word[];
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
          8 từ bạn đã biết sẵn
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted">
          Không cần đăng ký, không cần cài gì. Đây là những từ mà âm Hán Việt
          TRÙNG luôn nghĩa tiếng Việt — chạm vào thẻ để thấy bạn đã biết chúng
          từ trước rồi.
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
