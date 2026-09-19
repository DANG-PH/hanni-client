"use client";

import { Card, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icon";
import { useTodayQuests } from "@/lib/hooks";

/**
 * Thẻ "Nhiệm vụ hàng ngày" ở dashboard — 3 nhiệm vụ mỗi ngày, MỖI NHIỆM VỤ
 * lấy tiêu chí từ 1 tính năng KHÁC NHAU đã có sẵn (ôn từ vựng, làm quiz,
 * luyện nghe, luyện phát âm, học từ mới) để kéo người dùng qua lại giữa các
 * tính năng thay vì mỗi tính năng đứng 1 mình — xem `hanni-server/CLAUDE.md`
 * mục "Nhiệm vụ hàng ngày". Server tự cộng xu ngay khi phát hiện hoàn
 * thành, thẻ này chỉ hiển thị, không có nút "Nhận thưởng" riêng.
 */
export function DailyQuestCard() {
  const { data, isLoading } = useTodayQuests();

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon name="target" size={18} />
        <span className="text-sm font-semibold text-foreground">
          Nhiệm vụ hàng ngày
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Đang tải…</p>
      ) : (
        <ul className="space-y-4">
          {data?.quests.map((quest) => (
            <li key={quest.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span
                  className={`flex items-center gap-1.5 font-medium ${
                    quest.claimed ? "text-muted line-through" : ""
                  }`}
                >
                  {quest.claimed && (
                    <Icon name="check" size={14} className="text-good" />
                  )}
                  {quest.title}
                </span>
                <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-accent">
                  <Icon name="spark" size={13} />+{quest.xu}
                </span>
              </div>
              <ProgressBar
                value={(quest.progress / quest.target) * 100}
                label={quest.title}
                color={quest.claimed ? "bg-good" : "bg-primary"}
              />
              <p className="text-xs text-muted">
                {Math.min(quest.progress, quest.target)}/{quest.target}
              </p>
            </li>
          ))}
        </ul>
      )}

      {data?.allDone && (
        <div className="flex items-center gap-2 rounded-xl bg-good/8 p-3 text-sm font-medium text-good">
          <Icon name="check" size={16} />
          Xong cả 3 nhiệm vụ hôm nay — thưởng thêm {data.allDoneBonusXu} xu!
        </div>
      )}
    </Card>
  );
}
