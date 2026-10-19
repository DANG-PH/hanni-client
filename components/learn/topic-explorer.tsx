"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import { useLesson } from "@/lib/hooks";
import type { LessonNode } from "@/lib/types";
import { lessonMinutes, toUnits } from "@/lib/units";

/** `learn`: lộ trình ở trang chủ (bấm bài → học). `review`: chọn bộ flashcard ở
 * trang Ôn tập (bài đã học → ôn thẻ, chưa học → học trước). */
type Variant = "learn" | "review";

const isDone = (l: LessonNode, v: Variant) => (v === "learn" ? l.status === "COMPLETED" : l.startedWords > 0);
const lessonHref = (l: LessonNode, v: Variant) =>
  v === "review" && l.startedWords > 0 ? `/study?lesson=${l.id}` : `/bai-hoc/${l.id}`;

/**
 * Chọn bài theo CHỦ ĐỀ, hai cột như Hanbeego: trái là danh sách chủ đề kèm
 * tiến độ, phải là các bài của chủ đề đang chọn + từ vựng của 1 bài. Mặc định
 * mở chủ đề chứa bài nên học tiếp. Trên điện thoại, chủ đề thành dải chip cuộn
 * ngang. Dùng chung cho lộ trình (`/learn`) và flashcard theo bài (`/study`).
 *
 * Cột PHẢI quyết định chiều cao (tối thiểu ~32rem), danh sách chủ đề lấp đúng
 * chiều cao đó và tự cuộn: chủ đề HSK 1 chỉ 1–2 bài, để 2 cột tự cao theo nội
 * dung thì cạnh danh sách 15 chủ đề là một mảng trống lớn (user chụp màn hình
 * hỏi, 2026-10-16) — Hanbeego không gặp vì mỗi chủ đề của họ có 4–9 bài.
 */
export function TopicExplorer({
  lessons,
  currentLessonId,
  variant = "learn",
}: {
  lessons: LessonNode[];
  currentLessonId: string | null;
  variant?: Variant;
}) {
  const units = toUnits(lessons);
  const currentUnit = Math.max(
    0,
    units.findIndex((u) => u.lessons.some((l) => l.lesson.id === currentLessonId)),
  );
  const [picked, setPicked] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  // Đưa chủ đề đang học vào tầm nhìn TRONG danh sách (cuộn dọc ở máy tính, dải
  // chip ngang ở điện thoại) — gán scrollTop/scrollLeft của chính danh sách,
  // `scrollIntoView` sẽ kéo cả trang theo.
  useEffect(() => {
    const list = listRef.current;
    const item = currentRef.current;
    if (!list || !item) return;
    if (list.scrollHeight > list.clientHeight) list.scrollTop = item.offsetTop - list.offsetTop - 8;
    if (list.scrollWidth > list.clientWidth) list.scrollLeft = item.offsetLeft - list.offsetLeft - 8;
  }, []);
  const active = units[picked ?? currentUnit] ?? units[0];
  if (!active) return null;
  const activeDone = active.lessons.filter((l) => isDone(l.lesson, variant)).length;
  // Bài để xem trước từ vựng: lộ trình → bài nên học tiếp (hoặc bài đầu chưa
  // xong); ôn tập → bài đầu đã học (bộ thẻ có thể ôn ngay).
  const featured =
    variant === "review"
      ? (active.lessons.find((l) => l.lesson.startedWords > 0) ??
        active.lessons.find((l) => l.lesson.id === currentLessonId) ??
        active.lessons[0])
      : (active.lessons.find((l) => l.lesson.id === currentLessonId) ??
        active.lessons.find((l) => l.lesson.status !== "COMPLETED") ??
        active.lessons[0]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="panel min-w-0 p-2 lg:flex lg:flex-col lg:p-3">
        <p className="hidden px-2 pb-2 text-xs font-bold tracking-wider text-muted lg:flex lg:justify-between">
          <span>CHỦ ĐỀ</span>
          <span>{variant === "review" ? "ĐÃ HỌC" : "TIẾN ĐỘ"}</span>
        </p>
        {/* Máy tính: danh sách không góp chiều cao (absolute trong phần còn
         * lại) — cao đúng bằng cột phải rồi cuộn bên trong. */}
        <div className="lg:relative lg:min-h-0 lg:flex-1">
          <ul
            ref={listRef}
            className="flex gap-2 overflow-x-auto lg:absolute lg:inset-0 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:overflow-y-auto lg:pr-1"
          >
            {units.map((u, i) => {
              const done = u.lessons.filter((l) => isDone(l.lesson, variant)).length;
              const selected = u === active;
              const finished = done === u.lessons.length;
              return (
                <li key={`${u.title}-${i}`} ref={i === currentUnit ? currentRef : undefined} className="shrink-0 lg:shrink">
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
      </div>

      <section className="panel min-w-0 overflow-hidden lg:min-h-[32rem]" aria-labelledby="topic-title">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name={active.icon} size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="topic-title" className="truncate font-bold">
              {active.title}
            </h3>
            <p className="text-xs text-muted">
              {active.lessons.length} bài · {activeDone} {variant === "review" ? "bài đã học" : "đã hoàn thành"}
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
            {activeDone}/{active.lessons.length}
          </span>
        </div>
        <ol className="space-y-2.5 p-3 sm:p-4">
          {active.lessons.map(({ lesson, part }) => {
            const done = isDone(lesson, variant);
            const isCurrent = variant === "learn" && lesson.id === currentLessonId;
            return (
              <li key={lesson.id}>
                <Link
                  href={lessonHref(lesson, variant)}
                  className={`hover-card flex items-center gap-3 rounded-2xl border px-3.5 py-3 sm:px-4 ${
                    isCurrent ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      done
                        ? "bg-good text-white"
                        : isCurrent
                          ? "bg-primary text-primary-fg shadow-md shadow-primary/30"
                          : "bg-surface-2 text-muted"
                    }`}
                  >
                    {done ? <Icon name="check" size={18} /> : lesson.orderIndex}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-bold">
                      Bài {lesson.orderIndex}
                      {part ? ` · phần ${part}` : ""}
                      {isCurrent && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg">
                          HỌC TIẾP
                        </span>
                      )}
                      {variant === "review" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            done ? "bg-good/12 text-good" : "bg-surface-2 text-muted"
                          }`}
                        >
                          {done ? `Đã học ${lesson.startedWords}/${lesson.wordCount}` : "Chưa học"}
                        </span>
                      )}
                    </span>
                    <span lang="zh" className="hanzi mt-0.5 block truncate text-base text-primary">
                      {lesson.previewWords.join(" · ")}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5">{lesson.wordCount} từ vựng</span>
                      <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
                        ~{lessonMinutes(lesson.wordCount)} phút
                      </span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-xs font-semibold text-muted sm:block">
                    {variant === "review"
                      ? done
                        ? "Ôn flashcard"
                        : "Học trước"
                      : lesson.status === "COMPLETED"
                        ? "Học lại"
                        : "Bắt đầu"}
                  </span>
                  <Icon name="arrow" size={16} className="shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ol>
        {featured && (
          <LessonWords key={featured.lesson.id} lesson={featured.lesson} part={featured.part} variant={variant} />
        )}
      </section>
    </div>
  );
}

/** Từ vựng của 1 bài ngay trong danh sách: chữ Hán, pinyin, âm Hán Việt, nghĩa,
 * nút nghe — biết trước mình sắp học/ôn gì (và thấy bao nhiêu từ "đã biết
 * sẵn" qua âm Hán Việt) trước khi bấm vào bài. */
function LessonWords({ lesson, part, variant }: { lesson: LessonNode; part: string | null; variant: Variant }) {
  const { data, error } = useLesson(lesson.id);
  if (error) return null;
  const cta =
    variant === "review"
      ? lesson.startedWords > 0
        ? "Ôn bằng flashcard"
        : "Học bài này trước"
      : lesson.status === "COMPLETED"
        ? "Học lại bài này"
        : "Học bài này";
  return (
    <div className="border-t border-border/70 px-3 pt-3.5 pb-4 sm:px-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="text-sm font-bold">
          Từ vựng bài {lesson.orderIndex}
          {part ? ` · phần ${part}` : ""}
          <span className="ml-1.5 font-normal text-muted">({lesson.wordCount} từ)</span>
        </h4>
        <Link
          href={lessonHref(lesson, variant)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {cta} <Icon name="arrow" size={13} />
        </Link>
      </div>
      {!data ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: Math.min(6, lesson.wordCount) }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {data.words.map((w) => (
              <li key={w.id} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2">
                <span lang="zh" className="hanzi shrink-0 text-xl font-semibold">
                  {w.simplified}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-xs">
                    <span className="text-muted">{w.pinyin}</span>
                    {w.hanViet && <span className="ml-1.5 font-semibold text-hanviet">{w.hanViet}</span>}
                  </span>
                  <span className="block truncate text-xs">{w.meaningVi?.split(";")[0]}</span>
                </span>
                <AudioButton src={w.audioUrl} size={15} className="shrink-0" />
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {data.relatedGrammar.length > 0 && (
              <>
                <span className="font-semibold text-muted">Ngữ pháp trong bài:</span>
                {data.relatedGrammar.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/ngu-phap/${g.slug}`}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 font-semibold hover:border-primary/40 hover:text-primary"
                  >
                    <span lang="zh" className="hanzi mr-1">
                      {g.titleZh}
                    </span>
                    {g.titleVi}
                  </Link>
                ))}
              </>
            )}
            <Link
              href={`/learn/${lesson.id}`}
              className="ml-auto inline-flex items-center gap-1 font-semibold text-muted hover:text-primary"
            >
              Xem câu ví dụ <Icon name="arrow" size={12} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
