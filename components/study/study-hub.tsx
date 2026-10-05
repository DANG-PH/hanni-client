"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { toUnits } from "@/lib/units";
import { LinkButton, Spinner } from "@/components/ui";
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
  const [topic, setTopic] = useState(0);

  if (loading || !user) return <Spinner />;

  const s = stats.data;
  const due = s?.dueNow ?? 0;
  const units = path.data ? toUnits(path.data.lessons) : [];
  const unit = units[Math.min(topic, units.length - 1)];

  return (
    <div className="page-wrap space-y-6">
      <div>
        <p className="eyebrow">ÔN TẬP & FLASHCARD</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          Ôn đúng lúc, nhớ thật lâu
        </h1>
        <p className="mt-1 text-sm text-muted">
          Hanni đưa từ bạn đã học quay lại đúng lúc sắp quên. Hoặc chọn một bài bên dưới để
          ôn bằng flashcard.
        </p>
      </div>

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
            <p className="max-w-64 text-sm text-muted">
              Chưa có từ đến hạn. Học bài mới, từ sẽ tự quay lại đây đúng lúc.
            </p>
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
                  onClick={() => {
                    setLevel(l);
                    setTopic(0);
                  }}
                  className={`motion-button shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                    l === path.data!.level
                      ? "border-primary bg-primary text-primary-fg"
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
          <div className="mt-4 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {units.map((u, i) => {
                const done = u.lessons.filter((l) => l.lesson.startedWords > 0).length;
                return (
                  <li key={`${u.title}-${i}`} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setTopic(i)}
                      className={`motion-button flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm ${
                        i === topic
                          ? "border-primary/40 bg-primary/8 font-semibold text-primary"
                          : "border-border bg-surface hover:border-primary/30"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{u.title}</span>
                      <span className="shrink-0 text-[11px] text-muted">
                        {done}/{u.lessons.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {unit && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {unit.lessons.map(({ lesson, part }) => {
                  const started = lesson.startedWords > 0;
                  return (
                    <li key={lesson.id} className="panel flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold">
                          Bài {lesson.orderIndex}
                          {part ? ` · phần ${part}` : ""}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            started ? "bg-good/12 text-good" : "bg-surface-2 text-muted"
                          }`}
                        >
                          {started ? `Đã học ${lesson.startedWords}/${lesson.wordCount}` : "Chưa học"}
                        </span>
                      </div>
                      <p lang="zh" className="hanzi mt-2 text-xl text-primary">
                        {lesson.previewWords.join(" · ")}
                      </p>
                      <p className="text-xs text-muted">{lesson.wordCount} từ</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {started ? (
                          <LinkButton href={`/study?lesson=${lesson.id}`} className="min-h-9! px-3! text-xs!">
                            <Icon name="cards" size={14} /> Ôn bằng flashcard
                          </LinkButton>
                        ) : (
                          <LinkButton href={`/bai-hoc/${lesson.id}`} className="min-h-9! px-3! text-xs!">
                            <Icon name="play" size={14} /> Học bài này trước
                          </LinkButton>
                        )}
                        <Link
                          href={`/learn/${lesson.id}`}
                          className="inline-flex items-center rounded-lg px-2 text-xs font-medium text-muted hover:text-primary"
                        >
                          Xem từ vựng
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
