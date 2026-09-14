import type { ReactNode } from "react";
import { WorkspaceMotion } from "@/components/workspace-motion";

// Chuyển riêng nội dung trang, giữ sidebar và thanh công cụ ổn định.
export default function WorkspaceTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceMotion>{children}</WorkspaceMotion>;
}
