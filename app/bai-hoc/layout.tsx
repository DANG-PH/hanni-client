/**
 * BẢN ĐỒ TRANG — Khung tập trung (không sidebar) cho phiên học 1 bài
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   (Trang tĩnh — không gọi API nào.)
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";

// Phiên học sinh câu hỏi ngẫu nhiên mỗi lần — không phải nội dung nên index.
export const metadata: Metadata = {
  title: "Bài học | Hanni",
  robots: { index: false, follow: true },
};

export default function LessonSessionLayout({ children }: { children: ReactNode }) {
  return children;
}
