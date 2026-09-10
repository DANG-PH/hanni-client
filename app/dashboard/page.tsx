"use client";

import Link from "next/link";
import {
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  Spinner,
  Stat,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { LevelCard } from "@/components/level-card";
import { useRequireAuth } from "@/lib/auth";
import { useProgress, useStreak, useStudyStats } from "@/lib/hooks";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const streak = useStreak();
  const stats = useStudyStats();
  const progress = useProgress();
  if (loading || !user) return <Spinner />;
  const goal = streak.data?.goal;
  const goalPct =
    goal && goal.value > 0 ? (goal.progress / goal.value) * 100 : 0;
  return (
    <div className="page-wrap space-y-8">
      <PageHeading
        eyebrow="GÓC HỌC TẬP CỦA BẠN"
        title={`Chào ${user.displayName}!`}
        description="Thêm một chút tiếng Trung, thêm một bước tiến hôm nay."
      />
      {(stats.error || streak.error || progress.error) && (
        <ErrorNote>
          Chưa tải được một số dữ liệu học tập. Vui lòng thử tải lại trang.
        </ErrorNote>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-primary/6 p-6 sm:p-8">
          <span
            aria-hidden="true"
            className="hanzi absolute -bottom-10 right-4 rotate-[-12deg] text-[180px] leading-none text-primary/6"
          >
            学
          </span>
          <div className="relative">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <Icon name="spark" size={16} />
              MỖI NGÀY MỘT CHÚT
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              Sẵn sàng cho buổi học mới?
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted">
              {stats.data
                ? stats.data.dueNow > 0
                  ? `Có ${stats.data.dueNow} từ đang chờ bạn ôn lại. Cùng củng cố những gì đã học nhé.`
                  : "Hiện không có từ đến hạn ôn. Bạn có thể tiếp tục khám phá thư viện từ vựng."
                : "Ôn lại từ cũ, khám phá từ mới và giữ nhịp học của riêng bạn."}
            </p>
            <LinkButton href="/study" className="mt-6 px-5!">
              Bắt đầu ôn tập <Icon name="arrow" size={17} />
            </LinkButton>
          </div>
        </section>
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mục tiêu hôm nay</h2>
            <Link
              href="/settings"
              aria-label="Điều chỉnh mục tiêu"
              className="rounded-lg p-2 text-muted hover:bg-surface-2"
            >
              <Icon name="settings" size={17} />
            </Link>
          </div>
          {goal ? (
            <>
              <div className="my-4 flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <Icon name={goal.met ? "check" : "target"} size={29} />
                </span>
                <div>
                  <span className="text-3xl font-semibold">
                    {Math.round(goal.progress)}
                  </span>
                  <span className="text-sm text-muted">
                    {" "}
                    / {goal.value} {goal.type === "MINUTES" ? "phút" : "từ ôn"}
                  </span>
                  <p className="mt-1 text-xs text-muted">
                    {goal.met
                      ? "Bạn đã hoàn thành mục tiêu!"
                      : "Từng chút một cũng là tiến bộ."}
                  </p>
                </div>
              </div>
              <ProgressBar value={goalPct} label="Mục tiêu hôm nay" />
            </>
          ) : (
            <p className="my-6 text-sm text-muted">
              {streak.isLoading
                ? "Đang tải mục tiêu…"
                : "Mục tiêu chưa có dữ liệu."}
            </p>
          )}
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Chuỗi ngày học"
          value={streak.data ? `${streak.data.currentStreak} ngày` : "—"}
          hint={
            streak.data
              ? `Kỷ lục của bạn: ${streak.data.longestStreak} ngày`
              : "Duy trì thói quen mỗi ngày"
          }
          icon="flame"
          tone="text-warn bg-warn/8"
        />
        <Stat
          label="Cần ôn tập"
          value={stats.data?.dueNow ?? "—"}
          hint="Từ đã đến lịch ôn lại"
          icon="cards"
        />
        <Stat
          label="Từ mới hôm nay"
          value={stats.data?.newDoneToday ?? "—"}
          hint={
            stats.data
              ? `Còn ${stats.data.newRemaining} từ mới trong ngày`
              : "Khám phá thêm mỗi ngày"
          }
          icon="spark"
          tone="text-lavender bg-lavender/8"
        />
        <Stat
          label="Từ đã thuộc"
          value={stats.data?.learnedTotal ?? "—"}
          hint="Vốn từ bạn đã xây dựng"
          icon="book"
          tone="text-good bg-good/8"
        />
      </div>
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Hành trình HSK của bạn</h2>
            <p className="mt-1 text-sm text-muted">
              Chọn một cấp để khám phá từ vựng.
            </p>
          </div>
          <Link
            href="/progress"
            className="flex items-center gap-2 text-sm font-medium text-primary"
          >
            Xem tiến độ <Icon name="arrow" size={16} />
          </Link>
        </div>
        {progress.isLoading ? (
          <Spinner />
        ) : progress.data?.levels.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress.data.levels.map((l) => (
              <LevelCard key={l.level} level={l} />
            ))}
          </div>
        ) : (
          !progress.error && (
            <EmptyState
              title="Hành trình đang chờ bạn"
              description="Bắt đầu khám phá từ vựng để xây dựng vốn tiếng Trung của mình."
            >
              <LinkButton href="/vocabulary">Khám phá từ vựng</LinkButton>
            </EmptyState>
          )
        )}
      </section>
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-sm leading-6 text-muted">
          <span className="font-medium text-foreground">Một mẹo nhỏ: </span>Hãy
          ôn từ đến hạn trước khi học từ mới. Những lần gặp lại đúng lúc sẽ giúp
          bạn nhớ lâu hơn.
        </p>
      </div>
    </div>
  );
}
