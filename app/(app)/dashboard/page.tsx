"use client";

import Link from "next/link";
import { HeroBanner } from "@/components/hero-banner";
import { Icon } from "@/components/icon";
import { LessonPath } from "@/components/lesson-path";
import { Card, ErrorNote, ProgressBar, Spinner, Stat } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath, useStreak, useStudyStats } from "@/lib/hooks";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const streak = useStreak();
  const stats = useStudyStats();
  const path = useLearnPath();

  if (loading || !user) return <Spinner />;

  const goal = streak.data?.goal;
  const goalPct = goal && goal.value > 0 ? (goal.progress / goal.value) * 100 : 0;
  const current = path.data?.lessons.find(
    (l) => l.id === path.data?.currentLessonId,
  );

  return (
    <div className="page-wrap space-y-8">
      <HeroBanner
        title="Học mỗi ngày,"
        highlight="tiến bộ không ngừng!"
        subtitle={`Chào ${user.displayName}. Học tiếng Trung mỗi ngày một chút — theo lộ trình HSK, nhớ lâu nhờ ôn đúng lúc.`}
        ctaLabel="Bắt đầu học ngay"
        ctaHref={current ? `/study?lesson=${current.id}` : "/learn"}
      />

      {(stats.error || streak.error || path.error) && (
        <ErrorNote>Chưa tải được một số dữ liệu. Thử tải lại trang.</ErrorNote>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Tiếp tục học */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Icon name="play" size={18} />
            <span className="text-sm font-semibold">Tiếp tục học</span>
          </div>
          {path.isLoading ? (
            <p className="my-6 text-sm text-muted">Đang tải lộ trình…</p>
          ) : current ? (
            <>
              <div className="my-4">
                <p className="text-lg font-semibold">
                  {current.title}
                  <span className="ml-2 text-sm font-normal text-muted">
                    {path.data?.levelName}
                  </span>
                </p>
                <p className="hanzi mt-1 text-sm text-muted">
                  {current.previewWords.join("  ")}…
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar
                    value={
                      current.wordCount
                        ? (current.learnedWords / current.wordCount) * 100
                        : 0
                    }
                    label="Tiến độ bài hiện tại"
                  />
                  <span className="shrink-0 text-xs text-muted">
                    {current.learnedWords}/{current.wordCount}
                  </span>
                </div>
              </div>
              <Link
                href={`/study?lesson=${current.id}`}
                className="motion-button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-fg"
              >
                {current.startedWords > 0 ? "Học tiếp bài này" : "Vào bài"}
                <Icon name="arrow" size={16} />
              </Link>
            </>
          ) : (
            <div className="my-4">
              <p className="text-sm text-muted">
                Bạn đã hoàn thành mọi bài đang mở. Xem lộ trình để chọn cấp tiếp
                theo.
              </p>
              <Link
                href="/learn"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Mở lộ trình <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
        </Card>

        {/* Mục tiêu hôm nay */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Mục tiêu hôm nay</span>
            <Link
              href="/settings"
              className="rounded-lg p-2 text-muted hover:bg-surface-2"
            >
              <Icon name="settings" size={16} />
            </Link>
          </div>
          {goal ? (
            <>
              <div className="my-4 flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name={goal.met ? "check" : "target"} size={26} />
                </span>
                <div>
                  <span className="text-3xl font-semibold">
                    {Math.round(goal.progress)}
                  </span>
                  <span className="text-sm text-muted">
                    {" "}
                    / {goal.value}{" "}
                    {goal.type === "MINUTES" ? "phút" : "từ ôn"}
                  </span>
                </div>
              </div>
              <ProgressBar value={goalPct} label="Mục tiêu hôm nay" />
            </>
          ) : (
            <p className="my-6 text-sm text-muted">Đang tải mục tiêu…</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Chuỗi ngày học"
          value={streak.data ? `${streak.data.currentStreak}` : "—"}
          hint={streak.data ? `Kỷ lục ${streak.data.longestStreak} ngày` : ""}
          icon="flame"
          tone="text-warn bg-warn/10"
        />
        <Stat
          label="Cần ôn tập"
          value={stats.data?.dueNow ?? "—"}
          hint="Từ đã đến lịch ôn"
          icon="cards"
        />
        <Stat
          label="Bài đã xong"
          value={
            path.data
              ? `${path.data.completedLessons}/${path.data.totalLessons}`
              : "—"
          }
          hint={path.data?.levelName ?? ""}
          icon="route"
          tone="text-lavender bg-lavender/10"
        />
        <Stat
          label="Từ đã thuộc"
          value={stats.data?.learnedTotal ?? "—"}
          hint="Vốn từ của bạn"
          icon="book"
          tone="text-good bg-good/10"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Lộ trình {path.data?.levelName ?? ""}
          </h2>
          <Link
            href="/learn"
            className="flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Xem đầy đủ <Icon name="arrow" size={16} />
          </Link>
        </div>
        {path.isLoading ? (
          <Spinner />
        ) : path.data ? (
          <LessonPath lessons={path.data.lessons} limit={5} />
        ) : null}
      </section>
    </div>
  );
}
