"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Card, EmptyState, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLeaderboard, useLeaderboardMetrics } from "@/lib/hooks";
import type { LeaderboardMetricKey, LeaderboardRow } from "@/lib/types";

const FALLBACK_TABS: { key: LeaderboardMetricKey; label: string }[] = [
  { key: "learned", label: "Từ đã thuộc" },
  { key: "streak", label: "Chuỗi hiện tại" },
  { key: "longest", label: "Chuỗi dài nhất" },
  { key: "lessons", label: "Bài đã xong" },
];

export default function LeaderboardPage() {
  const { user, loading } = useRequireAuth();
  const metrics = useLeaderboardMetrics();
  const [metric, setMetric] = useState<LeaderboardMetricKey>("learned");
  const board = useLeaderboard(metric);

  if (loading || !user) return <Spinner />;

  const tabs = metrics.data ?? FALLBACK_TABS;
  const unit = board.data?.unit ?? "";

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        eyebrow="HÀNH TRÌNH CỦA BẠN"
        title="Bảng xếp hạng"
        description="So kè nhẹ nhàng cho vui — cùng nhau tiến bộ mỗi ngày."
      />

      <div
        role="tablist"
        aria-label="Tiêu chí xếp hạng"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={metric === t.key}
            onClick={() => setMetric(t.key)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              metric === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {board.error ? (
        <ErrorNote>
          Chưa tải được bảng xếp hạng.{" "}
          <button
            className="font-semibold underline"
            onClick={() => void board.mutate()}
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : board.isLoading || !board.data ? (
        <Spinner />
      ) : board.data.rows.length === 0 ? (
        <EmptyState
          title="Chưa có ai trên bảng"
          description="Hãy là người đầu tiên — học vài từ hoặc giữ chuỗi vài ngày."
        />
      ) : (
        <>
          <Card className="flex items-center gap-4 border-primary/15 bg-primary/5!">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-fg">
              {board.data.me.rank ?? "–"}
            </span>
            <div>
              <p className="text-sm text-muted">Hạng của bạn</p>
              <p className="font-semibold">
                {board.data.me.rank
                  ? `#${board.data.me.rank} / ${board.data.me.totalRanked} người học`
                  : "Chưa xếp hạng ở mục này"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {board.data.me.value.toLocaleString("vi-VN")} {unit}
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden p-0!">
            <ul className="divide-y divide-border">
              {board.data.rows.map((row) => (
                <Row key={row.userId} row={row} unit={unit} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ row, unit }: { row: LeaderboardRow; unit: string }) {
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
        user={{
          displayName: row.displayName,
          avatarUrl: row.avatarUrl,
          id: row.userId,
        }}
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
          {row.value.toLocaleString("vi-VN")}
        </span>
        <span className="text-[11px] text-muted">{unit}</span>
      </span>
    </li>
  );
}
