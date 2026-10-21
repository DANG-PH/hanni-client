"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { TopicExplorer } from "@/components/learn/topic-explorer";
import { LinkButton, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath, useStudyStats } from "@/lib/hooks";

/**
 * Trang Ôn tập & Flashcard khi mở không kèm tham số — người học TỰ CHỌN bộ
 * thẻ. Trước đây mở ra là tự chạy một hàng thẻ không rõ lấy từ đâu (lỗi cũ
 * còn nhét cả từ HSK4-7), user báo "ôn flashcard sao vừa vào lại HSK6, chả
 * hiểu". Các trang học tiếng Trung khác cũng làm vậy: XieHanzi "Ôn tập" chỉ
 * ôn từ đã học, Hanbeego cho chọn bộ từ theo chủ đề.
 */
export function StudyHub() {
  const { user, loading } = useRequireAuth();
  const [level, setLevel] = useState<number | undefined>(undefined);
  const stats = useStudyStats();
  const path = useLearnPath(level);

  if (loading || !user) return <Spinner />;

  const s = stats.data;
  const due = s?.dueNow ?? 0;

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        icon="cards"
        title="Ôn tập"
        description="Từ đã học quay lại đúng lúc sắp quên — hoặc chọn một bài để ôn bằng flashcard."
      />

      <section className="panel tint-primary grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Icon name="cards" size={30} />
          </span>
          <div>
            <p className="text-3xl font-extrabold leading-none">
              {due}
              <span className="ml-2 text-base font-semibold text-muted">từ cần ôn hôm nay</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {s
                ? `Đã học ${s.learnedTotal + s.inProgress} từ · ${s.learnedTotal} từ đã thuộc lâu`
                : "Đang tải…"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {due > 0 ? (
            <LinkButton href="/study?review=1" className="min-w-44">
              <Icon name="play" size={16} /> Bắt đầu ôn
            </LinkButton>
          ) : (
            // Trạng thái trống luôn kèm 1 việc tiếp theo — trước đây chỉ có câu chữ, người mới phải tự tìm đường về trang chủ.
            <>
              <p className="max-w-64 text-sm text-muted">
                Chưa có từ đến hạn. Học bài mới, từ sẽ tự quay lại đây đúng lúc.
              </p>
              <LinkButton href="/learn" variant="secondary">
                <Icon name="play" size={16} /> Học bài mới
              </LinkButton>
            </>
          )}
          {!!s?.leechCount && (
            <LinkButton href="/study?leeches=1" variant="secondary">
              Ôn {s.leechCount} từ hay quên
            </LinkButton>
          )}
        </div>
      </section>

      <section aria-labelledby="decks">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="decks" className="text-lg font-bold">
              Flashcard theo bài
            </h2>
            <p className="text-sm text-muted">Chọn cấp, chọn chủ đề rồi chọn bài.</p>
          </div>
          {path.data && (
            <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Cấp HSK">
              {path.data.levels.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={l === path.data!.level}
                  onClick={() => setLevel(l)}
                  className={`motion-button shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    l === path.data!.level
                      ? "chip-on"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  HSK {l === 7 ? "7–9" : l}
                </button>
              ))}
            </div>
          )}
        </div>

        {!path.data ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            {/* Cùng khung chọn chủ đề → bài với lộ trình ở trang chủ: bài đã học
             * ôn bằng flashcard, chưa học thì mời học trước. */}
            <TopicExplorer
              key={path.data.level}
              lessons={path.data.lessons}
              currentLessonId={path.data.currentLessonId}
              variant="review"
            />
          </div>
        )}
      </section>
    </div>
  );
}
