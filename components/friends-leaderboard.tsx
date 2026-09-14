"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { MessageIconButton } from "@/components/message-icon-button";
import { Card } from "@/components/ui";
import { useLeaderboard } from "@/lib/hooks";
import styles from "./friends-leaderboard.module.css";

/**
 * Thẻ "So với bạn bè" ở dashboard — bảng xếp hạng chuỗi ngày học nhưng chỉ
 * tính trong nhóm (chính mình + người đang theo dõi), thay vì bảng xếp hạng
 * toàn app. Cho lý do cụ thể để theo dõi ai đó (xem tiến độ bạn bè) thay vì
 * theo dõi xong không thấy tác dụng gì.
 */
export function FriendsLeaderboard() {
  const board = useLeaderboard("streak", "friends");
  const rows = board.data?.rows ?? [];
  const hasFriends = rows.some((r) => !r.isMe);

  return (
    <Card className={styles.card}>
      <div className={styles.heading}>
        <div className="flex items-center gap-2 text-primary">
          <Icon name="flame" size={18} />
          <span className="text-sm font-semibold">So với bạn bè</span>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs font-medium text-primary hover:underline"
        >
          Xem đầy đủ
        </Link>
      </div>

      {board.isLoading ? (
        <p className="my-6 text-sm text-muted">Đang tải…</p>
      ) : !hasFriends ? (
        <div className="my-4">
          <p className="text-sm text-muted">
            Theo dõi bạn bè để so chuỗi ngày học với nhau, cùng nhắc nhau giữ
            nhịp mỗi ngày.
          </p>
          <Link
            href="/leaderboard"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            Tìm người để theo dõi <Icon name="arrow" size={15} />
          </Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {rows.slice(0, 5).map((row) => (
            <li
              key={row.userId}
              className={styles.row}
              data-me={row.isMe || undefined}
            >
              <span className={styles.rank}>
                {row.rank}
              </span>
              <Link
                href={`/u/${row.userId}`}
                className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
              >
                <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.isMe ? "Bạn" : row.displayName}
                </span>
              </Link>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {row.value} ngày
              </span>
              {!row.isMe && <MessageIconButton userId={row.userId} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
