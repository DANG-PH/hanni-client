/**
 * "HSK 3.0 là gì" — trang tra cứu cho người MỚI tìm hiểu tiếng Trung.
 *
 * Nhắm truy vấn đầu phễu ("HSK là gì", "HSK 3 cần bao nhiêu từ", "HSK 3.0
 * khác HSK cũ thế nào") — nhóm đông nhất nhưng Hanni chưa có gì để đón.
 *
 * CỐ TÌNH không viết bài dài cạnh tranh trực diện với các trung tâm tiếng
 * Trung (họ đã viết nhiều và chuẩn SEO tốt). Thay vào đó làm thứ họ KHÔNG
 * có: bảng tra cứu gọn + link thẳng vào danh sách từ vựng và ngữ pháp thật
 * của từng cấp. Người đọc muốn biết "HSK 3 cần bao nhiêu từ" thì xem bảng
 * rồi bấm vào xem luôn 495 từ đó, không phải đọc 2000 chữ giới thiệu.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import type { HskLevel } from "@/lib/types";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "HSK 3.0 là gì? 9 cấp cần bao nhiêu từ vựng | Hanni",
  description:
    "Bảng tra cứu HSK 3.0 (9 cấp, hiệu lực từ 7/2026): mỗi cấp cần bao nhiêu từ vựng, bao nhiêu chữ Hán, khác gì HSK cũ 6 cấp. Kèm danh sách từ vựng đầy đủ từng cấp.",
  alternates: { canonical: "/hsk" },
};

async function fetchLevels(): Promise<HskLevel[]> {
  // try/catch: fetch THROW khi API không phản hồi, không chỉ !res.ok
  try {
    const res = await fetch(`${API_BASE}/levels`, { next: { revalidate } });
    if (!res.ok) return [];
    return (await res.json()) as HskLevel[];
  } catch {
    return [];
  }
}

const BAND_VI: Record<string, string> = {
  ELEMENTARY: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Cao cấp",
};

export default async function HskPage() {
  const levels = await fetchLevels();
  // HSK 7-9 thi chung một đề nên chỉ hiện 1 dòng đại diện.
  const rows = levels.filter((l) => l.level <= 7);

  return (
    <div className="page-wrap max-w-4xl! space-y-8 py-10!">
      <section className="text-center">
        <span className="eyebrow">TRA CỨU</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          HSK 3.0 cần bao nhiêu từ vựng?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted">
          HSK 3.0 là khung đánh giá tiếng Trung mới, ban hành 11/2025 và có
          hiệu lực từ <strong className="text-foreground">tháng 7/2026</strong>.
          Khác bản cũ ở chỗ chia <strong className="text-foreground">9 cấp
          thay vì 6</strong>, và yêu cầu từ vựng tăng mạnh — HSK 6 cũ khoảng
          5.000 từ, còn cấp 7–9 mới lên tới ~11.000 từ.
        </p>
      </section>

      {rows.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Chưa tải được dữ liệu. Vui lòng thử lại sau.
        </p>
      ) : (
        <section className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3 font-medium">Cấp</th>
                <th className="px-4 py-3 font-medium">Bậc</th>
                <th className="px-4 py-3 font-medium">Từ mới</th>
                <th className="px-4 py-3 font-medium">Tích luỹ</th>
                <th className="px-4 py-3 font-medium">Chữ đọc</th>
                <th className="px-4 py-3 font-medium">Xem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.level} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    HSK {l.level === 7 ? "7–9" : l.level}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {BAND_VI[l.band] ?? l.band}
                  </td>
                  <td className="px-4 py-3">
                    {l.newWords2025.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {l.cumulative2025.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {l.readingChars?.toLocaleString("vi-VN") ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/tu-dien?level=${l.level}`}
                      className="text-primary hover:underline"
                    >
                      {l.wordsInDb.toLocaleString("vi-VN")} từ
                    </Link>
                    <span className="mx-1.5 text-muted">·</span>
                    <Link
                      href={`/ngu-phap?level=${l.level}`}
                      className="text-primary hover:underline"
                    >
                      ngữ pháp
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel p-6">
        <h2 className="text-base font-bold">Nên bắt đầu từ đâu?</h2>
        <div className="mt-3 space-y-2 text-sm leading-7 text-muted">
          <p>
            <strong className="text-foreground">Chưa học bao giờ</strong> — bắt
            đầu HSK 1 (300 từ). Đây là mức đủ để chào hỏi, nói về gia đình,
            thời gian, đồ ăn.
          </p>
          <p>
            <strong className="text-foreground">Đã học HSK cũ</strong> — số
            cấp đổi nhưng từ vựng nền không mất đi. HSK 4 cũ tương đương
            khoảng HSK 4–5 mới.
          </p>
          <p>
            <strong className="text-foreground">Người Việt có lợi thế riêng</strong>{" "}
            — hơn 60% từ vựng tiếng Việt gốc Hán, nên nhiều từ bạn{" "}
            <Link href="/tu-da-biet" className="text-primary hover:underline">
              đã biết sẵn mà không hay biết
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">
          Biết cần bao nhiêu từ rồi — giờ học thôi
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Hanni chia sẵn từng cấp thành bài học theo chủ đề (Gia đình, Đồ ăn,
          Thời tiết...) và nhắc bạn ôn đúng lúc sắp quên. Miễn phí toàn bộ.
        </p>
        <LinkButton href="/hoc-thu" className="mt-4">
          Học thử — không cần đăng ký
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>
    </div>
  );
}
