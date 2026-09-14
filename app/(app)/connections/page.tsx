"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

/** Gộp vào /messages (tab "Kết nối") — trang riêng trước đó trùng lặp gần
 * như y hệt phần tìm người + bắt đầu nhắn tin đã có ở "Tin nhắn mới". Giữ
 * route này lại dạng redirect để link/bookmark cũ không bị 404. */
export default function ConnectionsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/messages?tab=connect");
  }, [router]);
  return <Spinner />;
}
