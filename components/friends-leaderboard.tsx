"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Card } from "@/components/ui";
import { useLeaderboard } from "@/lib/hooks";

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
    <Card>
      <div className="flex items-center justify-between">
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
        <ul className="mt-4 space-y-2.5">
          {rows.slice(0, 5).map((row) => (
            <li
              key={row.userId}
              className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
                row.isMe ? "bg-primary/8" : ""
              }`}
            >
              <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted">
                {row.rank}
              </span>
              <Avatar user={{ id: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl }} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {row.isMe ? "Bạn" : row.displayName}
              </span>
              <span className="shrink-0 text-sm font-semibold text-primary">
                {row.value} ngày
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
