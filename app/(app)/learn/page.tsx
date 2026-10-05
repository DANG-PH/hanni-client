"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { mutate } from "swr";
import { Icon } from "@/components/icon";
import { CoursePath } from "@/components/learn/course-path";
import { LearnRail, TodayCard } from "@/components/learn/learn-rail";
import { LevelPicker } from "@/components/learn/level-picker";
import { Button, ErrorNote, LinkButton, ProgressBar, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath } from "@/lib/hooks";

/**
 * Trang chủ sau đăng nhập — MỘT lộ trình, MỘT nút "Học tiếp" (cách Duolingo
 * làm lại màn chính 2022: người học không biết dùng app thế nào cho "đúng"
 * khi có quá nhiều lối vào). Trước đây có cả /dashboard (hàng chục thẻ),
 * /learn (lộ trình + 6 chặng + mẹo + bài kiểm tra) lẫn flashcard tự do,
 * mỗi nơi tự chọn từ theo cách riêng — user báo "rất nhiều chức năng nhưng
 * rời rạc". Giờ: giữa là lộ trình theo chủ đề, phải là những gì kéo người
 * học quay lại mỗi ngày (chuỗi ngày, ôn tập, nhiệm vụ, giải đấu).
 */
export default function LearnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LearnHome />
    </Suspense>
  );
}

function LearnHome() {
  const { user, loading } = useRequireAuth();
  const { data, error, mutate: reload } = useLearnPath();
  const [switching, setSwitching] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const wanted = Number(params.get("level"));

  // `/learn?level=N` (thẻ cấp HSK ở trang chủ) = người dùng CHỌN cấp đó: lưu
  // làm cấp lộ trình rồi bỏ tham số khỏi URL.
  useEffect(() => {
    if (!user || !data || !Number.isInteger(wanted) || wanted < 1) return;
    const lvl = Math.min(wanted, 7);
    if (lvl !== data.level && data.levels.includes(lvl)) {
      void api
        .patch("/users/me/settings", { courseLevel: lvl })
        .then(() => mutate((key) => typeof key === "string" && key.startsWith("/learn")));
    }
    router.replace("/learn");
  }, [user, data, wanted, router]);

  if (loading || !user) return <Spinner />;

  const current = data?.lessons.find((l) => l.id === data.currentLessonId) ?? null;
  const pct = data?.totalLessons ? (data.completedLessons / data.totalLessons) * 100 : 0;
  const nextLevel = data ? data.levels.find((l) => l > data.level) : undefined;

  async function goToLevel(lvl: number) {
    setSwitching(true);
    try {
      await api.patch("/users/me/settings", { courseLevel: lvl });
      await mutate((key) => typeof key === "string" && key.startsWith("/learn"));
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">LỘ TRÌNH CỦA BẠN</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
                Học tiếng Trung mỗi ngày
              </h1>
            </div>
            {data && <LevelPicker current={data.level} levels={data.levels} />}
          </div>

          <div className="lg:hidden">
            <TodayCard />
          </div>

          {error ? (
            <div className="panel space-y-3 p-5">
              <ErrorNote>Chưa tải được lộ trình. Vui lòng thử lại.</ErrorNote>
              <Button variant="secondary" onClick={() => void reload()}>
                <Icon name="refresh" size={16} /> Tải lại
              </Button>
            </div>
          ) : !data ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <section
                className="panel tint-primary relative overflow-hidden p-5 sm:p-6"
                aria-labelledby="next-lesson"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold tracking-wider text-primary">
                    {current ? "BÀI TIẾP THEO" : "HOÀN THÀNH CẤP ĐỘ"}
                  </span>
                  <span className="text-muted">
                    {data.completedLessons}/{data.totalLessons} bài · HSK{" "}
                    {data.level === 7 ? "7–9" : data.level}
                  </span>
                </div>
                {current ? (
                  <>
                    <h2 id="next-lesson" className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                      Bài {current.orderIndex}: {current.title}
                    </h2>
                    <p lang="zh" className="hanzi mt-2 text-2xl text-primary">
                      {current.previewWords.join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {current.wordCount} từ mới · khoảng {Math.max(3, Math.round(current.wordCount * 0.6))} phút
                    </p>
                    <div className="mt-4">
                      <ProgressBar value={pct} label="Tiến độ cấp HSK" />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <LinkButton href={`/bai-hoc/${current.id}`} className="min-w-48">
                        <Icon name="play" size={16} />
                        {data.completedLessons === 0 ? "Bắt đầu bài đầu tiên" : "Học tiếp"}
                      </LinkButton>
                      <LinkButton href={`/learn/${current.id}`} variant="secondary">
                        Xem từ vựng bài này
                      </LinkButton>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 id="next-lesson" className="mt-2 text-xl font-extrabold tracking-tight">
                      Bạn đã học hết {data.totalLessons} bài HSK {data.level === 7 ? "7–9" : data.level}!
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Từ đã học vẫn tiếp tục quay lại ở phần Ôn tập để bạn nhớ lâu.
                    </p>
                    {nextLevel && (
                      <Button className="mt-4" disabled={switching} onClick={() => void goToLevel(nextLevel)}>
                        Lên HSK {nextLevel === 7 ? "7–9" : nextLevel}
                        <Icon name="arrow" size={16} />
                      </Button>
                    )}
                  </>
                )}
              </section>

              <CoursePath lessons={data.lessons} currentLessonId={data.currentLessonId} />
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-20">
          <LearnRail />
        </aside>
      </div>
    </div>
  );
}
