"use client";

import { LinkButton, ProgressBar, Spinner, Stat } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useProgress, useStreak, useStudyStats } from "@/lib/hooks";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const streak = useStreak();
  const stats = useStudyStats();
  const progress = useProgress();

  if (loading || !user) return <Spinner />;

  const goal = streak.data?.goal;
  const goalPct = goal ? (goal.progress / goal.value) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Chào {user.displayName} 👋</h1>
        <p className="text-muted">
          {stats.data?.dueNow
            ? `Bạn có ${stats.data.dueNow} thẻ đến hạn ôn.`
            : "Không có thẻ đến hạn — học từ mới nào!"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          label="Chuỗi ngày"
          value={`${streak.data?.currentStreak ?? 0} 🔥`}
          hint={`Dài nhất: ${streak.data?.longestStreak ?? 0}`}
        />
        <Stat label="Đến hạn" value={stats.data?.dueNow ?? "—"} />
        <Stat
          label="Từ mới hôm nay"
          value={
            stats.data
              ? `${stats.data.newDoneToday}/${
                  stats.data.newDoneToday + stats.data.newRemaining
                }`
              : "—"
          }
        />
        <Stat label="Đã thuộc" value={stats.data?.learnedTotal ?? "—"} />
      </div>

      {goal && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">
              Mục tiêu hôm nay ·{" "}
              {goal.type === "MINUTES" ? "phút học" : "từ ôn"}
            </span>
            <span className="text-muted">
              {Math.round(goal.progress)}/{goal.value}
              {goal.met ? " ✓" : ""}
            </span>
          </div>
          <ProgressBar value={goalPct} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <LinkButton href="/study">Bắt đầu ôn tập</LinkButton>
        <LinkButton href="/vocabulary" variant="secondary">
          Duyệt từ vựng
        </LinkButton>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Tiến độ theo cấp HSK</h2>
        {progress.isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-3">
            {progress.data?.levels.map((l) => (
              <div
                key={l.level}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    HSK {l.level}{" "}
                    <span className="text-muted">· {l.nameVi}</span>
                  </span>
                  <span className="text-muted">
                    {l.learned}/{l.totalWords} ({l.percentComplete}%)
                  </span>
                </div>
                <ProgressBar value={l.percentComplete} />
                <div className="mt-1 text-xs text-muted">
                  đang học {l.learning} · đến hạn {l.due} · sắp quên {l.atRisk}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
