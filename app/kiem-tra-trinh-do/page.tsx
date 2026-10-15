import type { Metadata } from "next";
import { PlacementTest } from "@/components/placement-test";

// Màn giới thiệu render sẵn trong HTML (client component vẫn SSR trạng thái
// đầu) — "kiểm tra trình độ tiếng Trung" là truy vấn người Việt hay tìm, nên
// trang này được index, khác `/bai-hoc`.
export const metadata: Metadata = {
  title: "Kiểm tra trình độ tiếng Trung miễn phí — bạn đang ở HSK mấy? | Hanni",
  description:
    "Bài kiểm tra trình độ tiếng Trung online miễn phí, không cần đăng ký: câu hỏi nghe – đọc bằng từ vựng HSK 3.0 thật, chọn cấp bắt đầu, đúng thì lên cấp, sai thì xuống cấp — biết ngay nên học từ HSK mấy. Khoảng 2–5 phút.",
  alternates: { canonical: "/kiem-tra-trinh-do" },
};

export default function PlacementPage() {
  return <PlacementTest />;
}
