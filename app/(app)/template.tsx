import type { ReactNode } from "react";

// Chuyển riêng nội dung trang, giữ sidebar và thanh công cụ ổn định.
export default function WorkspaceTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="workspace-enter">{children}</div>;
}
