"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import type { LessonNode } from "@/lib/types";

interface Unit {
  title: string;
  lessons: { lesson: LessonNode; part: string | null }[];
}

/** "Số đếm & số lượng (1/2)" → chủ đề "Số đếm & số lượng", phần "1/2". Các
 * bài liền nhau cùng chủ đề gộp thành 1 cụm — lộ trình đọc theo CHỦ ĐỀ như
 * HelloChinese thay vì một danh sách 27 bài rời rạc. */
function toUnits(lessons: LessonNode[]): Unit[] {
  const units: Unit[] = [];
  for (const lesson of lessons) {
    const m = /^(.*?)\s*\((\d+\/\d+)\)\s*$/.exec(lesson.title);
    const title = m ? m[1] : lesson.title;
    const last = units[units.length - 1];
    if (last && last.title === title) last.lessons.push({ lesson, part: m?.[2] ?? null });
    else units.push({ title, lessons: [{ lesson, part: m?.[2] ?? null }] });
  }
  return units;
}

export function CoursePath({
  lessons,
  currentLessonId,
}: {
  lessons: LessonNode[];
  currentLessonId: string | null;
}) {
  const units = toUnits(lessons);

  return (
    <ol className="space-y-5">
      {units.map((unit, ui) => {
        const done = unit.lessons.filter((l) => l.lesson.status === "COMPLETED").length;
        return (
          <li key={`${unit.title}-${ui}`} className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {ui + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-muted">
                  CHỦ ĐỀ {ui + 1}
                </p>
                <h3 className="truncate text-sm font-bold sm:text-base">{unit.title}</h3>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  done === unit.lessons.length
                    ? "bg-good/12 text-good"
                    : "bg-surface-2 text-muted"
                }`}
              >
                {done === unit.lessons.length ? "Đã xong" : `${done}/${unit.lessons.length} bài`}
              </span>
            </div>
            <ol className="divide-y divide-border/60">
              {unit.lessons.map(({ lesson, part }) => {
                const isCurrent = lesson.id === currentLessonId;
                const completed = lesson.status === "COMPLETED";
                return (
                  <li
                    key={lesson.id}
                    className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${isCurrent ? "bg-primary/5" : ""}`}
                  >
                    <Link
                      href={`/bai-hoc/${lesson.id}`}
                      aria-label={`${completed ? "Học lại" : "Học"} bài ${lesson.orderIndex}: ${lesson.title}`}
                      className={`motion-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-transform hover:scale-105 ${
                        completed
                          ? "border-good bg-good text-white"
                          : isCurrent
                            ? "border-primary bg-primary text-primary-fg shadow-md shadow-primary/30"
                            : "border-border bg-surface text-muted"
                      }`}
                    >
                      {completed ? <Icon name="check" size={18} /> : isCurrent ? <Icon name="play" size={16} /> : lesson.orderIndex}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        Bài {lesson.orderIndex}
                        {part ? ` · phần ${part}` : ""}
                        {isCurrent && (
                          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-fg">
                            HỌC TIẾP
                          </span>
                        )}
                      </p>
                      <p lang="zh" className="hanzi truncate text-xs text-muted">
                        {lesson.previewWords.join(" · ")}
                        <span className="font-sans"> · {lesson.wordCount} từ</span>
                      </p>
                    </div>
                    <Link
                      href={`/learn/${lesson.id}`}
                      className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-primary"
                    >
                      Từ vựng
                    </Link>
                    <Link
                      href={`/bai-hoc/${lesson.id}`}
                      className={`hidden shrink-0 rounded-xl px-3 py-2 text-xs font-semibold sm:inline-flex ${
                        isCurrent
                          ? "bg-primary text-primary-fg"
                          : "border border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {completed ? "Học lại" : "Bắt đầu"}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
