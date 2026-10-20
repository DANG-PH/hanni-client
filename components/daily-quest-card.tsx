"use client";

import Link from "next/link";
import { Card, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icon";
import { useTodayQuests } from "@/lib/hooks";
import type { TodayQuests } from "@/lib/types";

/** Bấm nhiệm vụ là tới đúng chỗ làm; nhiệm vụ không có ở đây ("Học 5 từ mới") mở bài đang học. */
const QUEST_HREF: Record<string, string> = {
  review_words: "/study",
  complete_quiz: "/study",
  listening_practice: "/listening",
  pronunciation_practice: "/pronunciation",
};

/**
 * Thẻ "Nhiệm vụ hôm nay" ở trang chủ — 3 nhiệm vụ mỗi ngày, mỗi cái đo 1 tính năng khác nhau (ôn từ, quiz, luyện
 * nghe, luyện phát âm, học từ mới — xem `hanni-server/CLAUDE.md` mục "Nhiệm vụ hàng ngày"). Xong cả 3 thì server tự
 * cấp 1 lá chắn giữ chuỗi, thẻ chỉ hiển thị.
 */
export function DailyQuestCard({ lessonHref }: { lessonHref: string }) {
  const { data, isLoading } = useTodayQuests();
  const doneCount = data?.quests.filter((q) => q.done).length ?? 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="target" size={18} className="text-primary" />
          <h3 className="text-sm font-semibold">Nhiệm vụ hôm nay</h3>
        </div>
        {data && (
          <span className="text-xs text-muted">
            {doneCount}/{data.quests.length} xong
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <div className="space-y-3 py-2">
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-surface-2" />
          <div className="h-2 w-full animate-pulse rounded-full bg-surface-2" />
        </div>
      ) : (
        <ul className="space-y-2">
          {data.quests.map((quest) => (
            <li key={quest.key}>
              <Link
                href={QUEST_HREF[quest.key] ?? lessonHref}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    quest.done ? "bg-good/15 text-good" : "border-2 border-border"
                  }`}
                >
                  {quest.done && <Icon name="check" size={14} />}
                </span>
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span
                    className={`block text-sm font-medium ${quest.done ? "text-muted line-through" : ""}`}
                  >
                    {quest.title}
                  </span>
                  <ProgressBar
                    value={(quest.progress / quest.target) * 100}
                    label={quest.title}
                    color={quest.done ? "bg-good" : "bg-primary"}
                  />
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                  {quest.progress}/{quest.target}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && <QuestReward data={data} />}
    </Card>
  );
}

function QuestReward({ data }: { data: TodayQuests }) {
  const full = data.freezeCount >= data.maxFreeze;
  const text = !data.allDone
    ? full
      ? "Bạn đang có đủ lá chắn — dùng bớt rồi nhận thêm."
      : "Xong cả 3 → +1 lá chắn giữ chuỗi khi lỡ nghỉ 1 ngày."
    : data.justEarnedFreeze
      ? "Xong cả 3 — bạn vừa nhận 1 lá chắn giữ chuỗi!"
      : "Xong cả 3 nhiệm vụ hôm nay — giỏi lắm!";
  return (
    <p
      className={`mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
        data.allDone ? "bg-good/10 text-good" : "bg-surface-2 text-muted"
      }`}
    >
      <Icon name="shield" size={15} className="shrink-0" />
      <span className="flex-1">{text}</span>
      <span className="shrink-0 font-semibold">
        {data.freezeCount}/{data.maxFreeze}
      </span>
    </p>
  );
}
