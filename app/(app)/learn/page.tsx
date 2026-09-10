"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import { LessonPath } from "@/components/lesson-path";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath } from "@/lib/hooks";

function LearnContent({ initialLevel }: { initialLevel?: number }) {
  const { user, loading } = useRequireAuth();
  const [level, setLevel] = useState<number | undefined>(initialLevel);
  const { data, isLoading, error, mutate } = useLearnPath(level);

  if (loading || !user) return <Spinner />;

  const activeLevel = level ?? data?.level;
  const pct = data?.totalLessons
    ? (data.completedLessons / data.totalLessons) * 100
    : 0;
  const currentLesson =
    data?.lessons.find(
      (lesson) =>
        lesson.id === data.currentLessonId && lesson.status !== "LOCKED",
    ) ??
    data?.lessons.find(
      (lesson) =>
        lesson.status === "IN_PROGRESS" || lesson.status === "AVAILABLE",
    );
  const totalWords =
    data?.lessons.reduce((total, lesson) => total + lesson.wordCount, 0) ?? 0;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="LỘ TRÌNH HSK"
        title="Từng bước nhỏ, tiến bộ mỗi ngày"
        description="Bắt đầu từ những từ quen thuộc. Học theo từng bài, ôn đúng lúc và nhìn thấy hành trình tiến bộ của bạn."
      >
        <LinkButton href="/study" variant="secondary">
          <Icon name="cards" size={17} /> Ôn tập hôm nay
        </LinkButton>
      </PageHeading>

      {!!data?.levels.length && (
        <div className="flex flex-wrap gap-2" aria-label="Chọn cấp độ HSK">
          {data.levels.map((item) => (
            <button
              key={item}
              onClick={() => setLevel(item)}
              aria-pressed={activeLevel === item}
              className={`motion-button min-h-11 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${activeLevel === item ? "border-primary bg-primary text-primary-fg shadow-sm" : "border-border bg-surface text-muted hover:border-primary/30 hover:text-primary"}`}
            >
              {item === 7 ? "HSK 7–9" : `HSK ${item}`}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <Card className="space-y-4">
          <ErrorNote>Chưa tải được lộ trình học. Vui lòng thử lại.</ErrorNote>
          <Button variant="secondary" onClick={() => void mutate()}>
            <Icon name="refresh" size={16} /> Tải lại lộ trình
          </Button>
        </Card>
      ) : isLoading || !data ? (
        <Spinner />
      ) : !data.lessons.length ? (
        <EmptyState
          title="Bài học đang được chuẩn bị"
          description="Cấp độ này chưa có bài học. Bạn có thể chọn cấp độ khác hoặc khám phá thư viện từ vựng."
        >
          <LinkButton href="/vocabulary">
            Khám phá từ vựng <Icon name="arrow" size={16} />
          </LinkButton>
        </EmptyState>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div className="reveal panel relative overflow-hidden p-6 sm:p-7">
              <span
                aria-hidden="true"
                className="hanzi pointer-events-none absolute -right-2 -top-6 text-[150px] leading-none text-primary/5"
              >
                学
              </span>
              <div className="relative flex items-start gap-4">
                <span className="icon-tile h-12! w-12! shrink-0">
                  <Icon name="route" size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-1">HÀNH TRÌNH CỦA BẠN</p>
                  <h2 className="text-xl font-semibold">{data.levelName}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {data.totalLessons} bài học{" "}
                    <span className="px-2 text-border">/</span>{" "}
                    {totalWords.toLocaleString("vi-VN")} từ vựng
                  </p>
                </div>
              </div>
              <div className="relative mt-6">
                <div className="mb-2 flex justify-between gap-3 text-xs">
                  <span className="text-muted">
                    Đã hoàn thành {data.completedLessons}/{data.totalLessons}{" "}
                    bài
                  </span>
                  <span className="font-semibold text-primary">
                    {Math.round(pct)}%
                  </span>
                </div>
                <ProgressBar value={pct} label="Tiến độ cấp HSK" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <h2 className="font-semibold">Danh sách bài học</h2>
              <p className="text-xs text-muted">
                Hoàn thành bài để mở bước tiếp theo
              </p>
            </div>
            <LessonPath lessons={data.lessons} />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24">
            {currentLesson && (
              <Card className="border-primary/20! bg-primary/4!">
                <span className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  BÀI HỌC TIẾP THEO
                </span>
                <h2 className="text-lg font-semibold">{currentLesson.title}</h2>
                <p lang="zh" className="hanzi mt-3 text-2xl leading-relaxed">
                  {currentLesson.previewWords.join(" · ")}
                </p>
                <p className="mt-3 text-sm text-muted">
                  {currentLesson.wordCount} từ vựng để khám phá
                </p>
                <LinkButton
                  href={`/learn/${currentLesson.id}`}
                  className="mt-5 w-full"
                >
                  {currentLesson.status === "IN_PROGRESS"
                    ? "Tiếp tục bài học"
                    : "Khám phá bài học"}
                  <Icon name="arrow" size={16} />
                </LinkButton>
              </Card>
            )}
            <Card>
              <span className="icon-tile mb-4">
                <Icon name="spark" size={20} />
              </span>
              <h2 className="font-semibold">Một chút mỗi ngày</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Nghe phát âm, đọc ví dụ rồi thử nhớ nghĩa. Dành thời gian ôn lại
                các từ đến hạn giúp bạn nhớ lâu hơn.
              </p>
              <LinkButton
                href="/progress"
                variant="ghost"
                className="mt-4 -ml-4"
              >
                Xem tiến độ của tôi <Icon name="arrow" size={15} />
              </LinkButton>
            </Card>
            <div className="rounded-2xl border border-dashed border-border p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon name="target" size={17} className="text-primary" /> Sẵn
                sàng thử sức?
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Kiểm tra vốn từ theo cấp độ HSK sau khi học.
              </p>
              <LinkButton
                href="/exams"
                variant="secondary"
                className="mt-4 w-full"
              >
                Kiểm tra từ vựng
              </LinkButton>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function LearnRoute() {
  const value = Number(useSearchParams().get("level"));
  const level =
    Number.isInteger(value) && value >= 1 && value <= 9 ? value : undefined;
  return <LearnContent key={level ?? "default"} initialLevel={level} />;
}

export default function LearnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LearnRoute />
    </Suspense>
  );
}
