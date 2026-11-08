"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icon";
import { SectionHeading } from "@/components/ui";
import type {
  Leaderboard,
  LeaderboardMetric,
  LeaderboardMetricKey,
  Me,
} from "@/lib/types";
import styles from "./leaderboard.module.css";

export const LEADERBOARD_METRICS: (LeaderboardMetric & {
  icon: IconName;
  description: string;
  href: string;
  action: string;
})[] = [
  {
    key: "streak",
    label: "Chuỗi hiện tại",
    unit: "ngày",
    icon: "flame",
    description: "Xếp hạng theo chuỗi ngày học liên tiếp hiện tại.",
    href: "/study",
    action: "Học tiếp hôm nay",
  },
  {
    key: "lessons",
    label: "Bài đã xong",
    unit: "bài",
    icon: "check",
    description: "Xếp hạng theo số bài học đã hoàn thành.",
    href: "/learn",
    action: "Tiếp tục học bài",
  },
];

export function metricDetails(key: LeaderboardMetricKey) {
  return LEADERBOARD_METRICS.find((item) => item.key === key)!;
}

const number = (value: number) => value.toLocaleString("vi-VN");

export function LeaderboardOverview({ board, user }: { board: Leaderboard; user: Me | null }) {
  const leaders = board.rows.slice(0, 3);
  const details = metricDetails(board.metric);

  return (
    <div className={user ? styles.overview : undefined}>
      <section className={`panel ${styles.leaders}`} aria-labelledby="leaders-title">
        <h2 id="leaders-title" className="flex items-center gap-2 text-sm font-bold">
          <Icon name="trophy" size={17} className="text-primary" />
          Dẫn đầu bảng
        </h2>
        <ol className={styles.podium}>
          {leaders.map((row) => (
            <li key={row.userId} value={row.rank}>
              <Link href={`/u/${row.userId}`} className={styles.leader} data-rank={row.rank}>
                <span className={styles.medal}>#{row.rank}</span>
                <Avatar user={{ ...row, id: row.userId }} size={44} />
                <span className={styles.podiumName}>{row.isMe ? "Bạn" : row.displayName}</span>
                <span className="text-sm tabular-nums text-muted">
                  <strong className="text-foreground">{number(row.value)}</strong> {board.unit}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      {user && (
        <section className={`panel ${styles.personal}`} aria-labelledby="your-rank-title">
          <h2 id="your-rank-title" className="text-sm font-bold">Vị trí của bạn</h2>
          <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
            {board.me.rank === null ? <span className="text-base">Chưa xếp hạng</span> : `#${number(board.me.rank)}`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {number(board.me.value)} {board.unit} · {number(board.me.totalRanked)} người trong bảng
          </p>
          <Link href={details.href} className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            {details.action} <Icon name="arrow" size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}

export function LeaderboardRankings({ board }: { board: Leaderboard }) {
  const limited = board.rows.length < board.me.totalRanked;

  return (
    <section className="panel overflow-hidden" aria-labelledby="rankings-title">
      <SectionHeading
        id="rankings-title"
        icon="trophy"
        tone="accent"
        title={limited ? "Người học dẫn đầu" : "Cộng đồng cùng tiến bộ"}
        className="px-4 py-4 sm:px-6"
      >
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
          {number(board.me.totalRanked)} người học
        </span>
      </SectionHeading>
      <table className={styles.table}>
        <caption className="sr-only">
          Bảng xếp hạng theo {board.label.toLocaleLowerCase("vi-VN")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={styles.rankColumn}>
              Hạng
            </th>
            <th scope="col">Người học</th>
            <th scope="col" className={styles.scoreColumn}>
              {board.label}
            </th>
          </tr>
        </thead>
        <tbody>
          {board.rows.map((row) => (
            <tr key={row.userId} data-me={row.isMe || undefined}>
              <td className={styles.rankColumn}>
                <span
                  className={styles.tableRank}
                  data-rank={row.rank}
                  aria-label={`Hạng ${row.rank}`}
                >
                  {row.rank === 1 ? (
                    <>
                      <Icon name="trophy" size={17} />
                      <span className="sr-only">1</span>
                    </>
                  ) : (
                    row.rank
                  )}
                </span>
              </td>
              <th scope="row" className="font-normal">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <Link href={`/u/${row.userId}`} className="shrink-0">
                    <Avatar user={{ ...row, id: row.userId }} size={36} />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/u/${row.userId}`}
                      className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-0.5 hover:underline"
                    >
                      <span className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
                        {row.displayName}
                      </span>
                      {row.isMe && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                          Bạn
                        </span>
                      )}
                    </Link>
                    {board.metric !== "streak" && row.currentStreak > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <Icon name="flame" size={12} className="text-primary" />
                        Chuỗi {number(row.currentStreak)} ngày
                      </span>
                    )}
                  </div>
                </div>
              </th>
              <td className={styles.scoreColumn}>
                <span
                  className={`block text-base font-semibold tabular-nums ${row.isMe ? "text-primary" : ""}`}
                >
                  {number(row.value)}
                </span>
                <span className="text-xs text-muted">{board.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-start gap-2 border-t border-border px-4 py-3 text-xs leading-5 text-muted sm:px-6">
        <Icon name="spark" size={14} className="mt-0.5 shrink-0 text-primary" />
        <p>
          {limited
            ? `Hiển thị ${number(board.rows.length)} người dẫn đầu. Vị trí riêng của bạn luôn ở phía trên.`
            : "Mỗi người một nhịp học. Mỗi ngày một bước tiến."}
        </p>
      </div>
    </section>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải bảng xếp hạng"
      className="space-y-5"
    >
      <span className="sr-only">Đang tải bảng xếp hạng…</span>
      <div
        aria-hidden="true"
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="panel h-80 bg-surface-2 motion-safe:animate-pulse" />
        <div className="panel order-first h-56 bg-surface-2 motion-safe:animate-pulse xl:order-last xl:h-80" />
      </div>
      <div
        aria-hidden="true"
        className="panel h-64 bg-surface-2 motion-safe:animate-pulse"
      />
    </div>
  );
}
