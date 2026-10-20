"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Popup toàn màn hình (`fixed inset-0`) luôn gắn thẳng vào <body>. Để nằm trong trang thì đã gặp 2 lỗi: khối cha có
 * backdrop-filter/transform giữ `fixed` lại (popup Premium mở từ thanh trên chỉ còn 1 dải ngang), và `space-y-*` của
 * khối cha cộng margin vào popup (popup hướng dẫn hụt 32px ở đáy). Chỉ dùng cho popup mở sau khi người dùng bấm —
 * lúc dựng HTML phía server chưa có `document`.
 */
export function Overlay({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
