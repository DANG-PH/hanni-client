"use client";

import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { useAuth } from "@/lib/auth";

/** Khách → bài 1 HSK 1; đã đăng nhập → về lộ trình (KHÔNG qua `/bat-dau?level=1`:
 * trang đó lưu luôn cấp 1, người đang học HSK 3 ghé xem phiên âm sẽ bị đổi cấp). */
export function StartLearningCta() {
  const { user } = useAuth();
  return (
    <LinkButton href={user ? "/learn" : "/bat-dau?level=1"}>
      {user ? "Về lộ trình học" : "Học bài 1 HSK 1 — miễn phí"}
      <Icon name="arrow" size={16} />
    </LinkButton>
  );
}
