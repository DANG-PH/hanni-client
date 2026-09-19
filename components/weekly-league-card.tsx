"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Card } from "@/components/ui";
import { useWeeklyLeague } from "@/lib/hooks";
import styles from "./friends-leaderboard.module.css";

const ZONE_LABEL: Record<string, string> = {
  promote: "Sắp thăng hạng",
  demote: "Sắp rớt hạng",
};

/**
 * Thẻ "Giải đấu tuần" ở dashboard — xếp hạng theo số lượt ôn tập trong tuần
 * cùng những người ở CÙNG bậc, reset mỗi tuần, tự thăng/giáng hạng. Khác hẳn
 * bảng xếp hạng tĩnh vô tận ở `/leaderboard` — đây là cơ chế giữ chân người
 * dùng mạnh nhất theo research (thăng/giáng hạng tạo động lực quay lại mỗi
 * tuần), xem `hanni-server/CLAUDE.md` mục "Giải đấu học tập theo tuần".
 */
export function WeeklyLeagueCard() {
  const board = useWeeklyLeague();
  const data = board.data;

  return (
    <Card className={styles.card}>
      <div className={styles.heading}>
        <div className="flex items-center gap-2 text-primary">
          <Icon name="trophy" size={18} />
          <span className="text-sm font-semibold">
            Giải đấu tuần
            {data && (
              <span
                className="ml-2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: data.tier.color,
                  backgroundColor: `${data.tier.color}1a`,
                }}
              >
                {data.tier.name}
              </span>
            )}
          </span>
        </div>
        {data && (
          <span className="text-xs text-muted">
            Còn {data.daysRemaining} ngày
          </span>
        )}
      </div>

      {board.isLoading ? (
        <p className="my-6 text-sm text-muted">Đang tải…</p>
      ) : !data?.rows.length ? (
        <p className="my-4 text-sm text-muted">
          Ôn tập vài từ hôm nay để bắt đầu tham gia giải đấu tuần này.
        </p>
      ) : (
        <ul className={styles.list}>
          {data.rows.slice(0, 5).map((row) => (
            <li
              key={row.userId}
              className={styles.row}
              data-me={row.isMe || undefined}
            >
              <span className={styles.rank}>{row.rank}</span>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar
                  user={{
                    id: row.userId,
                    displayName: row.displayName,
                    avatarUrl: row.avatarUrl,
                  }}
                  size={28}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.isMe ? "Bạn" : row.displayName}
                </span>
              </div>
              {row.zone !== "safe" && (
                <span
                  className={`shrink-0 text-[11px] font-semibold ${
                    row.zone === "promote" ? "text-good" : "text-danger"
                  }`}
                >
                  {ZONE_LABEL[row.zone]}
                </span>
              )}
              <span className="shrink-0 text-sm font-semibold text-primary">
                {row.points} lượt ôn
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/study"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        Ôn tập ngay để giữ hạng <Icon name="arrow" size={13} />
      </Link>
    </Card>
  );
}
