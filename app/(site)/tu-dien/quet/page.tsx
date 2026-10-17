/**
 * Quét ảnh học từ — trang CÔNG KHAI (Google index được, nhắm truy vấn "dịch
 * tiếng Trung qua ảnh"), công cụ chạy sau khi đăng nhập (mỗi người 3 ảnh/ngày,
 * Premium 100). Khác Google Dịch ở chỗ mỗi từ trong ảnh nối thẳng vào từ điển
 * Hanni: âm Hán Việt, nghĩa, audio và lưu vào ôn tập.
 */
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icon";
import { ScanTool } from "@/components/scan/scan-tool";

export const metadata: Metadata = {
  title: "Quét ảnh dịch tiếng Trung, kèm âm Hán Việt | Hanni",
  description:
    "Chụp thực đơn, biển hiệu, bao bì, trang sách hay món ăn, đồ vật — Hanni đọc chữ Hán, dịch sang tiếng Việt và tách từng từ kèm pinyin, âm Hán Việt, nghĩa, audio để lưu vào ôn tập.",
  alternates: { canonical: "/tu-dien/quet" },
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "camera",
    title: "Chụp hoặc chọn ảnh",
    text: "Thực đơn, biển hiệu, bao bì, sách, tin nhắn, chữ viết tay. Không có chữ thì chụp món ăn, đồ vật.",
  },
  {
    icon: "search",
    title: "Bấm vào từng từ",
    text: "Mỗi từ có pinyin, âm Hán Việt, nghĩa tiếng Việt từ từ điển Hanni và audio phát âm chuẩn.",
  },
  {
    icon: "cards",
    title: "Lưu vào ôn tập",
    text: "Một chạm là từ vào danh sách ôn tập ngắt quãng — gặp lại đúng lúc sắp quên.",
  },
];

export default function ScanPage() {
  return (
    <div className="page-wrap max-w-5xl! space-y-7 py-10!">
      <section className="text-center">
        <span className="eyebrow">QUÉT ẢNH HỌC TỪ</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Chụp là hiểu chữ Hán</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
          Hanni đọc từng dòng chữ trong ảnh, dịch sang tiếng Việt rồi tách ra từng từ kèm pinyin,
          <strong className="text-foreground"> âm Hán Việt</strong> và nghĩa — chụp món ăn, đồ vật thì cho biết tên
          tiếng Trung của chúng.
        </p>
      </section>

      <ScanTool />

      <section aria-label="Cách dùng" className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="panel p-5">
            <span className="icon-tile">
              <Icon name={s.icon} />
            </span>
            <h2 className="mt-3 text-sm font-bold">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
