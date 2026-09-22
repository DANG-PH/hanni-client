"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";

/**
 * Khung cho các trang CÔNG KHAI (`(site)`): `/tu-dien`, `/ngu-phap`,
 * `/hoc-thu`, `/tu-da-biet`, `/hsk`…
 *
 * Lý do tồn tại: những trang này vừa là trang SEO cho người lạ, vừa là trang
 * tra cứu hằng ngày của người ĐÃ đăng nhập (sidebar có mục "Từ điển" và "Ngữ
 * pháp" trỏ thẳng vào đây). Khi gộp `/vocabulary` vào `/tu-dien`, người đang
 * đăng nhập bấm vào là rơi sang layout `(site)` — MẤT SẠCH sidebar, không
 * còn đường quay lại chỗ đang học.
 *
 * Giải pháp: đã đăng nhập thì bọc `AppShell` (giữ nguyên sidebar như mọi
 * trang trong app); khách thì giữ khung site tối giản. `children` vẫn là
 * Server Component nên nội dung vẫn nằm sẵn trong HTML cho Google — bọc
 * bằng client component ở ngoài không làm mất điều đó.
 */
export function SiteShell({
  guest,
  children,
}: {
  /** Khung dành cho khách chưa đăng nhập (Nav + footer của trang giới thiệu). */
  guest: ReactNode;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  // Chưa biết trạng thái đăng nhập: render khung khách để không nhấp nháy
  // sidebar rồi lại mất (và đây cũng là thứ bot nhìn thấy).
  if (loading || !user) return <>{guest}</>;
  return (
    <AppShell>
      <div id="main-content">{children}</div>
    </AppShell>
  );
}
