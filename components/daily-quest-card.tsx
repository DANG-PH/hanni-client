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
    <Card className="space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-2xs">
            <Icon name="target" size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Nhiệm vụ hàng ngày
            </h3>
            <p className="text-[11px] text-muted">Hoàn thành để nhận xu thưởng</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          <div className="h-4 w-3/4 rounded-md bg-surface-2 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-surface-2 animate-pulse" />
        </div>
      ) : (
        <ul className="space-y-4">
          {data?.quests.map((quest) => (
            <li key={quest.key} className="space-y-2 rounded-xl border border-border/50 bg-surface-2/30 p-3 transition-colors hover:border-primary/20">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span
                  className={`flex items-center gap-2 font-semibold ${
                    quest.claimed ? "text-muted line-through" : "text-foreground"
                  }`}
                >
                  {quest.claimed ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-good/15 text-good">
                      <Icon name="check" size={12} />
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  {quest.title}
                </span>
                <span className="shrink-0 flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent shadow-2xs">
                  <Icon name="spark" size={13} />+{quest.xu} xu
                </span>
              </div>
              <ProgressBar
                value={(quest.progress / quest.target) * 100}
                label={quest.title}
                color={quest.claimed ? "bg-good" : "bg-primary"}
              />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Tiến độ</span>
                <span className="font-semibold text-foreground">
                  {Math.min(quest.progress, quest.target)} / {quest.target}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data?.allDone && (
        <div className="flex items-center gap-2.5 rounded-xl border border-good/30 bg-gradient-to-r from-good/15 to-good/5 p-3.5 text-sm font-bold text-good shadow-xs">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-good/20 text-good">
            <Icon name="check" size={16} />
          </span>
          <span>Hoàn thành tất cả nhiệm vụ hôm nay — thưởng thêm {data.allDoneBonusXu} xu!</span>
        </div>
      )}
    </Card>
  );
}
