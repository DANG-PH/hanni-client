"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/icon";
import {
  LEADERBOARD_METRICS,
  LeaderboardOverview,
  LeaderboardRankings,
  LeaderboardSkeleton,
  metricDetails,
} from "@/components/leaderboard";
import {
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLeaderboard, useLeaderboardMetrics } from "@/lib/hooks";
import type { LeaderboardMetricKey } from "@/lib/types";

export default function LeaderboardPage() {
  const { user, loading } = useRequireAuth();
  const metrics = useLeaderboardMetrics();
  const [selectedMetric, setMetric] = useState<LeaderboardMetricKey>("learned");
  const [focusedMetric, setFocusedMetric] =
    useState<LeaderboardMetricKey>("learned");
  const tablist = useRef<HTMLDivElement>(null);
  const availableTabs = metrics.data?.filter((tab) =>
    LEADERBOARD_METRICS.some((supported) => supported.key === tab.key),
  );
  const tabs = availableTabs?.length ? availableTabs : LEADERBOARD_METRICS;
  const metric = tabs.some((tab) => tab.key === selectedMetric)
    ? selectedMetric
    : tabs[0].key;
  const focusableMetric = tabs.some((tab) => tab.key === focusedMetric)
    ? focusedMetric
    : metric;
  const board = useLeaderboard(metric);
  const details = metricDetails(metric);

  // Di chuyển focus không tải dữ liệu; Enter/Space hoặc bấm chuột mới đổi tiêu chí.
  function moveTabFocus(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    tablist.current
      ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
      [next]?.focus();
  }

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        eyebrow="CÙNG HỌC, CÙNG TIẾN BỘ"
        title="Bảng xếp hạng"
        description="Một chút nỗ lực mỗi ngày. Cùng nhau đi xa hơn trên hành trình học tiếng Trung."
      >
        <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-muted sm:inline-flex">
          <Icon name="spark" size={15} className="text-accent" />
          Mỗi ngày một bước tiến
        </span>
      </PageHeading>

      <div className="space-y-3">
        <div
          ref={tablist}
          role="tablist"
          aria-label="Tiêu chí xếp hạng"
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface-2/70 p-1.5 sm:grid-cols-4"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={metric === tab.key}
              aria-controls={`panel-${tab.key}`}
              tabIndex={focusableMetric === tab.key ? 0 : -1}
              onFocus={() => setFocusedMetric(tab.key)}
              onClick={() => setMetric(tab.key)}
              onKeyDown={(event) => moveTabFocus(event, index)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                metric === tab.key
                  ? "border-primary/15 bg-surface text-primary shadow-sm"
                  : "border-transparent text-muted hover:bg-surface/70 hover:text-foreground"
              }`}
            >
              <Icon
                name={metricDetails(tab.key).icon}
                size={17}
                className="shrink-0"
              />
              {tab.label}
            </button>
          ))}
        </div>
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted">
          <Icon name="info" size={14} className="mt-0.5 shrink-0" />
          {details.description}
        </p>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          id={`panel-${tab.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.key}`}
          tabIndex={0}
          hidden={metric !== tab.key}
          aria-busy={metric === tab.key && board.isLoading}
          className="space-y-5 rounded-2xl"
        >
          {metric === tab.key && (
            <>
              {board.error && (
                <ErrorNote>
                  {board.data
                    ? "Chưa cập nhật được bảng xếp hạng. Đang hiển thị dữ liệu đã tải."
                    : "Chưa tải được bảng xếp hạng."}{" "}
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
                    disabled={board.isValidating}
                    onClick={() => void board.mutate()}
                  >
                    {board.isValidating ? "Đang thử lại…" : "Thử lại"}
                  </button>
                </ErrorNote>
              )}
              {!board.data ? (
                !board.error && <LeaderboardSkeleton />
              ) : board.data.rows.length === 0 ? (
                <EmptyState
                  title="Hành trình bắt đầu từ bước nhỏ"
                  description="Chưa có người học được xếp hạng ở mục này. Bắt đầu học để ghi dấu bước tiến đầu tiên của bạn nhé."
                >
                  <LinkButton href={details.href}>
                    {details.action}
                    <Icon name="arrow" size={16} />
                  </LinkButton>
                </EmptyState>
              ) : (
                <>
                  <LeaderboardOverview board={board.data} user={user} />
                  <LeaderboardRankings board={board.data} />
                </>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
