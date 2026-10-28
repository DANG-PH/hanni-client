"use client";

/**
 * BẢN ĐỒ TRANG — XẾP HẠNG (/leaderboard) — giải đấu tuần + bảng xếp hạng theo tiêu chí
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /leaderboard          ← useLeaderboard() ở lib/hooks.ts (← chính trang này)
 *                               → server: modules/leaderboard/leaderboard.controller.ts → LeaderboardService.top()
 *   GET /leaderboard/league   ← useWeeklyLeague() ở lib/hooks.ts (← components/weekly-league-card.tsx)
 *                               → server: modules/leaderboard/leaderboard.controller.ts → LeagueService.getMyLeague()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
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
import { WeeklyLeagueCard } from "@/components/weekly-league-card";
import { useAuth } from "@/lib/auth";
import { useLeaderboard } from "@/lib/hooks";
import type { LeaderboardMetricKey } from "@/lib/types";

const LEADERBOARD_TOUR_STEPS: TourStep[] = [
  {
    icon: "flame",
    title: "Chuỗi ngày học",
    description:
      "Bảng mặc định: ai học liên tục nhiều ngày nhất. Mỗi ngày học 1 bài hoặc ôn vài từ là giữ được chuỗi.",
  },
  {
    icon: "check",
    title: "Bài đã xong",
    description: "Đổi tab để xếp theo số bài học đã hoàn thành trên lộ trình.",
  },
  {
    icon: "trophy",
    title: "Giải đấu tuần",
    description:
      "Thi đua theo tuần với người cùng bậc: đầu bảng lên bậc, cuối bảng xuống bậc — thẻ \"Giải đấu tuần\" ở đầu trang này.",
  },
];

export default function LeaderboardPage() {
  // Khách xem được bảng chung (2026-10-18); hạng của mình cần tài khoản.
  const { user, loading } = useAuth();
  // Chỉ còn "Chuỗi hiện tại" (mặc định) + "Bài đã xong" (2026-10-19): "Từ đã thuộc" cần ôn đều ~21 ngày
  // mới tính nên trống với mọi người, "Chuỗi dài nhất" trùng ý "Chuỗi hiện tại" (`LEADERBOARD_METRICS`).
  const [selectedMetric, setMetric] = useState<LeaderboardMetricKey>("streak");
  const [focusedMetric, setFocusedMetric] =
    useState<LeaderboardMetricKey>("streak");
  const tablist = useRef<HTMLDivElement>(null);
  const tabs = LEADERBOARD_METRICS;
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

  if (loading) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <FeatureTour tourKey="leaderboard" steps={LEADERBOARD_TOUR_STEPS} />
      <PageHeading
        icon="trophy"
        tone="accent"
        eyebrow="Cùng học, cùng tiến bộ"
        title="Bảng xếp hạng"
        description="Giải đấu tuần với người cùng bậc, và bảng xếp hạng theo chuỗi ngày học, số bài đã xong."
      >
        <TourButton tourKey="leaderboard" />
      </PageHeading>

      {/* Giải đấu tuần ở đây chứ không ở trang chủ học (2026-10-21) — như Duolingo để giải đấu ở tab riêng; trang chủ
       * chỉ giữ việc cần làm hôm nay. Thông báo kết quả tuần mở `/leaderboard#giai-dau`. */}
      {user && <WeeklyLeagueCard />}

      <div className="space-y-3">
        <div
          ref={tablist}
          role="tablist"
          aria-label="Tiêu chí xếp hạng"
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface-2/70 p-1.5"
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
