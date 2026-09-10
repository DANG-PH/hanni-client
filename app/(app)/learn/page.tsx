"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { LessonPath } from "@/components/lesson-path";
import { PageHeading, ProgressBar, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath } from "@/lib/hooks";

export default function LearnPage() {
  const { user, loading } = useRequireAuth();
  const [level, setLevel] = useState<number | undefined>();
  const { data, isLoading } = useLearnPath(level);

  if (loading || !user) return <Spinner />;

  const levels = data?.levels ?? [1, 2, 3, 4, 5, 6, 7];
  const activeLevel = level ?? data?.level;
  const pct = data?.totalLessons
    ? (data.completedLessons / data.totalLessons) * 100
    : 0;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="LỘ TRÌNH HỌC"
        title="Đi từng bài, vững từng cấp"
        description="Mỗi bài khoảng 15 từ, sắp theo tần suất dùng. Hoàn thành bài để mở bài kế tiếp."
      />

      <div className="flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeLevel === l
                ? "bg-primary text-primary-fg"
                : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            HSK {l}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <Spinner />
      ) : (
        <>
          <div className="panel flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Icon name="route" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {data.levelName}
                <span className="ml-2 text-sm font-normal text-muted">
                  {data.completedLessons}/{data.totalLessons} bài
                </span>
              </p>
              <div className="mt-2">
                <ProgressBar value={pct} label="Tiến độ cấp" />
              </div>
            </div>
          </div>

          <LessonPath lessons={data.lessons} />
        </>
      )}
    </div>
  );
}
