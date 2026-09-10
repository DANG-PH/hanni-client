import type { ReactNode } from "react";
import { PageMotion } from "@/components/page-motion";

// Template khởi động lại hiệu ứng khi đổi trang, giữ nguyên header và auth context.
export default function Template({ children }: { children: ReactNode }) {
  return <PageMotion>{children}</PageMotion>;
}
