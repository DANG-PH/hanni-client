"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import type { LessonNode } from "@/lib/types";
import { lessonMinutes, toUnits } from "@/lib/units";

/**
 * Lộ trình theo CHỦ ĐỀ, hai cột như Hanbeego: trái là danh sách chủ đề kèm
 * tiến độ, phải là các bài của chủ đề đang chọn. Mặc định mở chủ đề chứa bài
 * nên học tiếp. Trên điện thoại, chủ đề thành dải chip cuộn ngang.
 */
export function TopicExplorer({
  lessons,
  currentLessonId,
}: {
  lessons: LessonNode[];
  currentLessonId: string | null;
}) {
  const units = toUnits(lessons);
  const currentUnit = Math.max(
    0,
    units.findIndex((u) => u.lessons.some((l) => l.lesson.id === currentLessonId)),
  );
  const [picked, setPicked] = useState<number | null>(null);
  const active = units[picked ?? currentUnit] ?? units[0];
  if (!active) return null;
  const activeDone = active.lessons.filter((l) => l.lesson.status === "COMPLETED").length;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="panel min-w-0 p-2 lg:p-3">
        <p className="hidden px-2 pb-2 text-[11px] font-bold tracking-wider text-muted lg:flex lg:justify-between">
          <span>CHỦ ĐỀ</span>
          <span>TIẾN ĐỘ</span>
        </p>
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
          {units.map((u, i) => {
            const done = u.lessons.filter((l) => l.lesson.status === "COMPLETED").length;
            const selected = u === active;
            const finished = done === u.lessons.length;
            return (
              <li key={`${u.title}-${i}`} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={selected}
                  className={`motion-button flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    selected ? "bg-primary/10" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      finished
                        ? "bg-good text-white"
                        : selected
                          ? "bg-primary text-primary-fg"
                          : "bg-surface-2 text-muted"
                    }`}
                  >
                    <Icon name={finished ? "check" : u.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block max-w-40 truncate text-sm lg:line-clamp-2 lg:max-w-none lg:whitespace-normal ${selected ? "font-bold text-primary" : "font-semibold"}`}
                    >
                      {u.title}
                    </span>
                    <span className="mt-1 hidden h-1.5 overflow-hidden rounded-full bg-surface-2 lg:block">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${(done / u.lessons.length) * 100}%` }}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted">
                    {done}/{u.lessons.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="panel min-w-0 overflow-hidden" aria-labelledby="topic-title">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name={active.icon} size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="topic-title" className="truncate font-bold">
              {active.title}
            </h3>
            <p className="text-xs text-muted">
              {active.lessons.length} bài học · {activeDone} đã hoàn thành
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {activeDone}/{active.lessons.length}
          </span>
        </div>
        <ol className="space-y-2.5 p-3 sm:p-4">
          {active.lessons.map(({ lesson, part }) => {
            const completed = lesson.status === "COMPLETED";
            const isCurrent = lesson.id === currentLessonId;
            return (
              <li key={lesson.id}>
                <Link
                  href={`/bai-hoc/${lesson.id}`}
                  className={`hover-card flex items-center gap-3 rounded-2xl border px-3.5 py-3 sm:px-4 ${
                    isCurrent
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      completed
                        ? "bg-good text-white"
                        : isCurrent
                          ? "bg-primary text-primary-fg shadow-md shadow-primary/30"
                          : "bg-surface-2 text-muted"
                    }`}
                  >
                    {completed ? <Icon name="check" size={18} /> : lesson.orderIndex}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-bold">
                      Bài {lesson.orderIndex}
                      {part ? ` · phần ${part}` : ""}
                      {isCurrent && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-fg">
                          HỌC TIẾP
                        </span>
                      )}
                    </span>
                    <span lang="zh" className="hanzi mt-0.5 block truncate text-base text-primary">
                      {lesson.previewWords.join(" · ")}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted">
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
                        {lesson.wordCount} từ vựng
                      </span>
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
                        ~{lessonMinutes(lesson.wordCount)} phút
                      </span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-xs font-semibold text-muted sm:block">
                    {completed ? "Học lại" : "Bắt đầu"}
                  </span>
                  <Icon name="arrow" size={16} className="shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
