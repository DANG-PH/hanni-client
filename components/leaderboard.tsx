import { Avatar } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icon";
import { LinkButton } from "@/components/ui";
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
  encouragement: string;
  href: string;
  action: string;
})[] = [
  {
    key: "learned",
    label: "Từ đã thuộc",
    unit: "từ",
    icon: "book",
    description: "Xếp hạng theo số từ vựng đã thuộc.",
    encouragement:
      "Mỗi từ ghi nhớ là một bước tiến. Cùng ôn thêm một chút nhé!",
    href: "/study",
    action: "Ôn từ vựng",
  },
  {
    key: "streak",
    label: "Chuỗi hiện tại",
    unit: "ngày",
    icon: "flame",
    description: "Xếp hạng theo chuỗi ngày học liên tiếp hiện tại.",
    encouragement:
      "Một chút hôm nay, thêm một ngày bền bỉ. Giữ nhịp học của bạn nhé!",
    href: "/study",
    action: "Học tiếp hôm nay",
  },
  {
    key: "longest",
    label: "Chuỗi dài nhất",
    unit: "ngày",
    icon: "trophy",
    description: "Xếp hạng theo chuỗi ngày học dài nhất từng đạt được.",
    encouragement: "Đi từng bước nhỏ để chinh phục kỷ lục của chính mình.",
    href: "/study",
    action: "Học tiếp hôm nay",
  },
  {
    key: "lessons",
    label: "Bài đã xong",
    unit: "bài",
    icon: "check",
    description: "Xếp hạng theo số bài học đã hoàn thành.",
    encouragement:
      "Thêm một bài học, thêm một điều mới. Tiếp tục hành trình nhé!",
    href: "/learn",
    action: "Tiếp tục học bài",
  },
];

export function metricDetails(key: LeaderboardMetricKey) {
  return LEADERBOARD_METRICS.find((item) => item.key === key)!;
}

const number = (value: number) => value.toLocaleString("vi-VN");

export function LeaderboardOverview({
  board,
  user,
}: {
  board: Leaderboard;
  user: Me;
}) {
  const leaders = board.rows
    .filter((row) => row.rank >= 1 && row.rank <= 3)
    .slice(0, 3);
  const details = metricDetails(board.metric);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-5">
      {leaders.length > 0 && (
        <section
          className={`panel min-w-0 overflow-hidden ${styles.spotlight}`}
          aria-labelledby="leaders-title"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
            <div>
              <h2
                id="leaders-title"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Icon name="trophy" size={18} className="text-accent" />
                Những gương mặt nổi bật
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Cùng lan tỏa tinh thần học mỗi ngày.
              </p>
            </div>
            <span className="hidden rounded-full border border-accent/20 bg-accent/8 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-accent sm:block">
              TOP {leaders.length}
            </span>
          </div>
          <ol className={styles.podium} aria-label="Những người học dẫn đầu">
            {leaders.map((row) => (
              <li
                key={row.userId}
                value={row.rank}
                data-rank={row.rank}
                className={styles.podiumEntry}
              >
                <div className={styles.podiumAvatar}>
                  {row.rank === 1 && (
                    <Icon
                      name="trophy"
                      size={22}
                      className={styles.winnerIcon}
                    />
                  )}
                  <Avatar
                    user={{ ...row, id: row.userId }}
                    size={52}
                    className={styles.avatar}
                  />
                  <span className={styles.medal}>
                    <span className="sr-only">Hạng </span>
                    {row.rank}
                  </span>
                </div>
                <p className={styles.podiumName} title={row.displayName}>
                  {row.displayName}
                </p>
                <span
                  className={`mt-1 text-[10px] font-semibold ${row.isMe ? "text-primary" : "text-muted"}`}
                >
                  {row.isMe ? "Bạn" : `Hạng ${row.rank}`}
                </span>
                <div className={styles.podiumStep}>
                  <strong className="block text-lg leading-6 font-bold tabular-nums sm:text-xl">
                    {number(row.value)}
                  </strong>
                  <span className="text-[11px] text-muted">{board.unit}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section
        className={`panel order-first min-w-0 border-primary/15 p-5 xl:order-last xl:flex xl:flex-col xl:p-6 ${leaders.length === 0 ? "xl:col-span-2" : ""}`}
        aria-labelledby="your-rank-title"
      >
        <div className="flex items-center gap-2.5">
          <Avatar user={user} size={34} />
          <div className="min-w-0">
            <h2 id="your-rank-title" className="text-sm font-semibold">
              Vị trí của bạn
            </h2>
            <p className="truncate text-xs text-muted">{user.displayName}</p>
          </div>
          <Icon
            name={details.icon}
            size={19}
            className="ml-auto shrink-0 text-primary"
          />
        </div>
        <dl className="my-4 grid grid-cols-2 divide-x divide-border xl:my-5">
          <div className="pr-3">
            <dt className="text-xs text-muted">Thứ hạng</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-primary tabular-nums [overflow-wrap:anywhere]">
              {board.me.rank === null ? (
                <span className="text-base font-semibold">Chưa xếp hạng</span>
              ) : (
                <>
                  <span className="mr-0.5 text-lg font-medium">#</span>
                  {number(board.me.rank)}
                </>
              )}
            </dd>
            <dd className="mt-1 text-[11px] text-muted">
              trong {number(board.me.totalRanked)} người học
            </dd>
          </div>
          <div className="pl-4">
            <dt className="text-xs text-muted">{board.label}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere]">
              {number(board.me.value)}
            </dd>
            <dd className="mt-1 text-[11px] text-muted">{board.unit}</dd>
          </div>
        </dl>
        <p className="mb-4 hidden text-xs leading-5 text-muted xl:block">
          {details.encouragement}
        </p>
        <LinkButton href={details.href} className="w-full xl:mt-auto">
          {details.action}
          <Icon name="arrow" size={16} />
        </LinkButton>
      </section>
    </div>
  );
}

export function LeaderboardRankings({ board }: { board: Leaderboard }) {
  const limited = board.rows.length < board.me.totalRanked;

  return (
    <section className="panel overflow-hidden" aria-labelledby="rankings-title">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <h2 id="rankings-title" className="text-base font-semibold">
          {limited ? "Người học dẫn đầu" : "Cộng đồng cùng tiến bộ"}
        </h2>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
          {number(board.me.totalRanked)} người học
        </span>
      </div>
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
                  <Avatar user={{ ...row, id: row.userId }} size={36} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
                        {row.displayName}
                      </span>
                      {row.isMe && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          Bạn
                        </span>
                      )}
                    </div>
                    {board.metric !== "streak" && row.currentStreak > 0 && (
                      <span className="mt-1 flex items-center gap-1 text-[11px] text-muted">
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
                <span className="text-[11px] text-muted">{board.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-start gap-2 border-t border-border px-4 py-3 text-[11px] leading-5 text-muted sm:px-6">
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
