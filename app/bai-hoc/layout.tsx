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
