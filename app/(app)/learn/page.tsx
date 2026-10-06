"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { mutate } from "swr";
import Image from "next/image";
import { DailyQuestCard } from "@/components/daily-quest-card";
import { Icon } from "@/components/icon";
import { TodayCard } from "@/components/learn/today-card";
import { TopicExplorer } from "@/components/learn/topic-explorer";
import { NotificationNudge } from "@/components/pwa/notification-nudge";
import { Button, ErrorNote, LinkButton, Spinner } from "@/components/ui";
import { VideoShelf } from "@/components/video-shelf";
import { WeeklyLeagueCard } from "@/components/weekly-league-card";
import { WordOfTheDayCard } from "@/components/word-of-the-day";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath, useLevels } from "@/lib/hooks";
import { lessonMinutes, toUnits } from "@/lib/units";

/**
 * Trang chủ sau đăng nhập — MỘT lộ trình, MỘT nút "Học tiếp" (cách Duolingo
 * làm lại màn chính 2022), bố cục theo Hanbeego (user chỉ đích danh làm mẫu):
 * thẻ bài tiếp theo + vòng tiến độ, thẻ chuỗi ngày; tab cấp HSK để xem; chủ
 * đề hai cột (danh sách chủ đề | các bài); nhiệm vụ, giải đấu, từ vựng hôm
 * nay và video ở cuối (Hanbeego cũng đặt các thẻ này ngay trang chủ).
 */
export default function LearnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LearnHome />
    </Suspense>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-surface-2" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-700"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-foreground text-[15px] font-extrabold">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

function LearnHome() {
  const { user, loading } = useRequireAuth();
  const [viewLevel, setViewLevel] = useState<number | undefined>(undefined);
  const { data, error, mutate: reload } = useLearnPath(viewLevel);
  const course = useLearnPath();
  const levels = useLevels();
  const [switching, setSwitching] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const wanted = Number(params.get("level"));

  async function chooseLevel(lvl: number) {
    setSwitching(true);
    try {
      await api.patch("/users/me/settings", { courseLevel: lvl });
      setViewLevel(undefined);
      await mutate((key) => typeof key === "string" && key.startsWith("/learn"));
    } finally {
      setSwitching(false);
    }
  }

  // `/learn?level=N` (thẻ cấp HSK ở trang chủ) = người dùng CHỌN cấp đó: lưu
  // làm cấp lộ trình rồi bỏ tham số khỏi URL.
  useEffect(() => {
    if (!user || !course.data || !Number.isInteger(wanted) || wanted < 1) return;
    const lvl = Math.min(wanted, 7);
    if (lvl !== course.data.level && course.data.levels.includes(lvl)) {
      void api
        .patch("/users/me/settings", { courseLevel: lvl })
        .then(() => mutate((key) => typeof key === "string" && key.startsWith("/learn")));
    }
    router.replace("/learn");
  }, [user, course.data, wanted, router]);

  if (loading || !user) return <Spinner />;

  const courseLevel = course.data?.level;
  const viewing = data?.level;
  const isCourse = viewing === courseLevel;
  const current = data?.lessons.find((l) => l.id === data.currentLessonId) ?? null;
  const pct = data?.totalLessons ? (data.completedLessons / data.totalLessons) * 100 : 0;
  const units = data ? toUnits(data.lessons) : [];
  const unitsDone = units.filter((u) => u.lessons.every((l) => l.lesson.status === "COMPLETED")).length;
  const levelName = (lvl: number) =>
    lvl === 7 ? "Cao cấp" : (levels.data?.find((l) => l.level === lvl)?.nameVi ?? "");
  const nextLevel = data ? data.levels.find((l) => l > data.level) : undefined;

  return (
    <div className="page-wrap space-y-5">
      <NotificationNudge />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel tint-primary relative flex flex-col gap-5 overflow-hidden p-5 sm:flex-row sm:items-center sm:p-6 md:pr-44" aria-labelledby="next-lesson">
          {/* Cáo Hanni — mascot vốn chỉ hiện ở màn tải trang; các app học khác
           * (Hanbeego, Hanpeak) dùng mascot khắp nơi để tạo cảm giác thân thiện. */}
          <Image
            src="/anhloading.png"
            alt=""
            width={190}
            height={160}
            priority
            className="pointer-events-none absolute -right-3 bottom-0 hidden h-40 w-auto md:block"
          />
          {error ? (
            <div className="space-y-3">
              <ErrorNote>Chưa tải được lộ trình. Vui lòng thử lại.</ErrorNote>
              <Button variant="secondary" onClick={() => void reload()}>
                <Icon name="refresh" size={16} /> Tải lại
              </Button>
            </div>
          ) : !data ? (
            <div className="skeleton h-36 w-full rounded-2xl" />
          ) : (
            <>
              <ProgressRing value={pct} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wider text-primary">
                  LỘ TRÌNH HSK {data.level === 7 ? "7–9" : data.level} · {levelName(data.level).toUpperCase()}
                </p>
                {current ? (
                  <>
                    <h1 id="next-lesson" className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
                      Bài {current.orderIndex}: {current.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                      <span lang="zh" className="hanzi text-base text-primary">
                        {current.previewWords.join(" · ")}
                      </span>{" "}
                      · {current.wordCount} từ · ~{lessonMinutes(current.wordCount)} phút
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Đã xong {data.completedLessons}/{data.totalLessons} bài · {unitsDone}/{units.length} chủ đề
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <LinkButton href={`/bai-hoc/${current.id}`} className="min-w-52 uppercase tracking-wide">
                        <Icon name="play" size={16} />
                        {data.completedLessons === 0 ? "Bắt đầu học" : "Học tiếp"}
                      </LinkButton>
                      {!isCourse && (
                        <Button variant="secondary" disabled={switching} onClick={() => void chooseLevel(data.level)}>
                          Chọn học HSK {data.level === 7 ? "7–9" : data.level}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h1 id="next-lesson" className="mt-1.5 text-xl font-extrabold tracking-tight">
                      Bạn đã học hết {data.totalLessons} bài!
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                      Từ đã học vẫn quay lại ở phần Ôn tập để bạn nhớ lâu.
                    </p>
                    {nextLevel && (
                      <Button className="mt-4" disabled={switching} onClick={() => void chooseLevel(nextLevel)}>
                        Lên HSK {nextLevel === 7 ? "7–9" : nextLevel}
                        <Icon name="arrow" size={16} />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
        <TodayCard />
      </div>

      {data && (
        <section aria-labelledby="path-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="path-title" className="text-lg font-extrabold tracking-tight">
                Lộ trình bài học HSK {data.level === 7 ? "7–9" : data.level}
              </h2>
              <p className="text-sm text-muted">
                Học theo chủ đề — bài nào cũng mở, Hanni đánh dấu sẵn bài nên học tiếp.
              </p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Cấp HSK">
            {data.levels.map((l) => {
              const selected = l === viewing;
              return (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setViewLevel(l === courseLevel ? undefined : l)}
                  className={`motion-button flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold ${
                    selected
                      ? "border-primary bg-primary text-primary-fg shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_62%,#000)]"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  HSK {l === 7 ? "7–9" : l}
                  {l === courseLevel && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                        selected ? "bg-primary-fg/20" : "bg-primary/10 text-primary"
                      }`}
                    >
                      ĐANG HỌC
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <TopicExplorer key={data.level} lessons={data.lessons} currentLessonId={data.currentLessonId} />
        </section>
      )}

      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DailyQuestCard />
        <WeeklyLeagueCard />
        <WordOfTheDayCard />
      </div>

      <VideoShelf limit={8} />
    </div>
  );
}
