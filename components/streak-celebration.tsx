"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { onStreakMilestone } from "@/lib/streak-celebration";

/** Chỉ 5 cột mốc — khớp `STREAK_1/3/7/30/100` trong achievement-catalog.ts
 * phía server. Copy khác nhau cho từng mốc thay vì 1 câu chung chung, vì
 * đây là màn hình HIẾM (mỗi mốc chỉ hiện đúng 1 lần trong đời tài khoản)
 * nên xứng đáng nói đúng ý nghĩa của riêng nó. Mốc 7 ngày viết dài hơn có
 * chủ đích — đây là ngưỡng quan trọng nhất theo research retention (xem
 * ghi chú trong lib/streak-celebration.ts). */
const MILESTONE_COPY: Record<number, { eyebrow: string; body: string }> = {
  1: {
    eyebrow: "Bước đầu tiên",
    body: "Buổi học đầu tiên luôn khó bắt đầu nhất — bạn vừa làm được rồi. Quay lại ngày mai để bắt đầu một chuỗi ngày học thật.",
  },
  3: {
    eyebrow: "Đang thành thói quen",
    body: "3 ngày liên tục không phải ngẫu nhiên — đó là một lựa chọn được lặp lại. Giữ nhịp này thêm vài hôm nữa để cán mốc 1 tuần.",
  },
  7: {
    eyebrow: "Cột mốc quan trọng nhất",
    body: "Một tuần không bỏ lỡ ngày nào — đây là lúc việc học thật sự bắt đầu bám rễ thành thói quen, khó bỏ hơn hẳn những ngày đầu. Cứ giữ nhịp này.",
  },
  30: {
    eyebrow: "Một tháng tròn",
    body: "30 ngày liền không đứt quãng. Đây không còn là thử nghiệm nữa — tiếng Trung đã thành một phần thói quen hằng ngày của bạn.",
  },
  100: {
    eyebrow: "Rất ít người đi được tới đây",
    body: "100 ngày liên tục là một con số hiếm. Dù kết quả tiếng Trung ra sao, riêng sự đều đặn này đã là một thành tựu thật.",
  },
};

/**
 * Màn ăn mừng CỘT MỐC chuỗi ngày học — hiện 1 LẦN mỗi mốc (1/3/7/30/100),
 * kích hoạt qua sự kiện realtime khi huy hiệu STREAK_* vừa mở khoá (xem
 * `lib/streak-celebration.ts` cho lý do tách riêng khỏi chuông thông báo
 * và khỏi dòng "Chuỗi N ngày" lặp lại cuối mỗi buổi ôn ở `/study`).
 *
 * Mount MỘT LẦN ở `app-shell.tsx` (như `NotificationBell`) để bắt được sự
 * kiện dù người dùng đang ở trang nào — mở khoá streak thường xảy ra ngay
 * sau khi ôn xong ở `/study`, nhưng cũng có thể xảy ra ở nơi khác (vd học
 * từ mới qua bản chép video cũng tính vào streak).
 */
export function StreakCelebration() {
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => onStreakMilestone(setMilestone), []);

  if (milestone == null) return null;

  const copy = MILESTONE_COPY[milestone] ?? {
    eyebrow: "Cột mốc mới",
    body: "Một cột mốc chuỗi ngày mới — cứ giữ nhịp học đều đặn nhé.",
  };

  return (
    <div
      role="dialog"
      aria-label={`Chuỗi ${milestone} ngày`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-7 text-center shadow-2xl"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <button
          type="button"
          onClick={() => setMilestone(null)}
          aria-label="Đóng"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Icon name="close" size={16} />
        </button>

        <span
          className="icon-tile mx-auto flex h-20 w-20 items-center justify-center bg-danger/10 text-danger"
          style={{ animation: "reveal-in 600ms var(--motion-ease) both" }}
        >
          <Icon name="flame" size={40} />
        </span>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-danger">
          {copy.eyebrow}
        </p>
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight">
          Chuỗi {milestone} ngày!
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">{copy.body}</p>

        <Button className="mt-6 w-full" onClick={() => setMilestone(null)}>
          Tiếp tục học
          <Icon name="arrow" size={16} />
        </Button>
      </div>
    </div>
  );
}
