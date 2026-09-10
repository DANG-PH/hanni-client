"use client";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Card, EmptyState, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLeaderboard } from "@/lib/hooks";
import type { LeaderboardRow } from "@/lib/types";

export default function LeaderboardPage() {
  const { user, loading } = useRequireAuth();
  const { data, error, isLoading, mutate } = useLeaderboard();

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title="Bảng xếp hạng"
        description="Xếp theo số từ đã thuộc (ôn đến khoảng cách ≥ 21 ngày). Cùng nhau tiến bộ mỗi ngày."
      />

      {error ? (
        <ErrorNote>
          Chưa tải được bảng xếp hạng.{" "}
          <button
            className="font-semibold underline"
            onClick={() => void mutate()}
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : isLoading || !data ? (
        <Spinner />
      ) : data.rows.length === 0 ? (
        <EmptyState
          title="Chưa có ai trên bảng"
          description="Học thuộc từ đầu tiên của bạn để mở màn bảng xếp hạng."
        />
      ) : (
        <>
          <Card className="flex items-center gap-4 border-primary/15 bg-primary/5!">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg">
              {data.me.rank ?? "–"}
            </span>
            <div>
              <p className="text-sm text-muted">Hạng của bạn</p>
              <p className="font-semibold">
                {data.me.rank
                  ? `#${data.me.rank} / ${data.me.totalRanked} người học`
                  : "Chưa xếp hạng — học thuộc vài từ để lên bảng"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {data.me.learnedWords.toLocaleString("vi-VN")} từ đã thuộc
              </p>
            </div>
          </Card>

          <Card className="p-0! overflow-hidden">
            <ul className="divide-y divide-border">
              {data.rows.map((row) => (
                <Row key={row.userId} row={row} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ row }: { row: LeaderboardRow }) {
  const medal =
    row.rank === 1
      ? "text-[#d4a017]"
      : row.rank === 2
        ? "text-[#9aa3af]"
        : row.rank === 3
          ? "text-[#b5763a]"
          : "text-muted";

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 ${
        row.isMe ? "bg-primary/[0.06]" : ""
      }`}
    >
      <span
        className={`w-7 shrink-0 text-center text-sm font-bold ${medal}`}
        aria-label={`Hạng ${row.rank}`}
      >
        {row.rank}
      </span>
      <Avatar
        user={{ displayName: row.displayName, avatarUrl: row.avatarUrl, id: row.userId }}
        size={36}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {row.displayName}
          {row.isMe && (
            <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              Bạn
            </span>
          )}
        </span>
        {row.currentStreak > 0 && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <Icon name="flame" size={12} className="text-primary" />
            {row.currentStreak} ngày
          </span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold">
          {row.learnedWords.toLocaleString("vi-VN")}
        </span>
        <span className="text-[11px] text-muted">từ đã thuộc</span>
      </span>
    </li>
  );
}
