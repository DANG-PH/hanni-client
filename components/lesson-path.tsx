"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "./icon";
import { Button, ProgressBar } from "./ui";
import type { LessonNode } from "@/lib/types";
import styles from "./lesson-path.module.css";

const STATUS_META: Record<
  LessonNode["status"],
  { label: string; tone: string }
> = {
  COMPLETED: { label: "Đã xong", tone: styles.completed },
  IN_PROGRESS: { label: "Đang học", tone: styles.inProgress },
  AVAILABLE: { label: "Sẵn sàng", tone: styles.available },
};

/** Bỏ dấu tiếng Việt để gõ "do an" vẫn ra "Đồ ăn & thức uống". */
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

const PATH_WINDOW_SIZE = 6;
const PATH_CONTEXT_BEFORE_CURRENT = 1;

type LessonRange = { start: number; end: number };

function currentLessonIndex(
  lessons: LessonNode[],
  currentLessonId?: string | null,
) {
  const explicitIndex = currentLessonId
    ? lessons.findIndex((lesson) => lesson.id === currentLessonId)
    : -1;
  if (explicitIndex >= 0) return explicitIndex;

  const availableIndex = lessons.findIndex(
    (lesson) =>
      lesson.status === "IN_PROGRESS" || lesson.status === "AVAILABLE",
  );
  return availableIndex >= 0 ? availableIndex : Math.max(lessons.length - 1, 0);
}

function initialRange(length: number, currentIndex: number): LessonRange {
  const preferredStart = Math.max(
    0,
    currentIndex - PATH_CONTEXT_BEFORE_CURRENT,
  );
  const end = Math.min(length, preferredStart + PATH_WINDOW_SIZE);
  return {
    start: Math.max(0, end - PATH_WINDOW_SIZE),
    end,
  };
}

function LessonItems({
  lessons,
  currentLessonId,
  totalLessons,
  listLabel,
}: {
  lessons: LessonNode[];
  currentLessonId?: string | null;
  totalLessons?: number;
  /** Ghi đè nhãn khi danh sách KHÔNG liền mạch (kết quả tìm kiếm). */
  listLabel?: string;
}) {
  const firstOrder = lessons[0]?.orderIndex;
  const lastOrder = lessons.at(-1)?.orderIndex;
  const label =
    listLabel ??
    (totalLessons && firstOrder && lastOrder
      ? `Bài học ${firstOrder} đến ${lastOrder} trong ${totalLessons} bài`
      : "Danh sách bài học");

  return (
    <ol className={styles.list} start={firstOrder} aria-label={label}>
      {lessons.map((lesson) => {
        const meta = STATUS_META[lesson.status];
        const pct = lesson.wordCount
          ? (lesson.learnedWords / lesson.wordCount) * 100
          : 0;
        const card = (
          <div
            className={styles.card}
            data-status={lesson.status}
            data-current={lesson.id === currentLessonId ? "true" : undefined}
          >
            <span className={`${styles.number} ${meta.tone}`}>
              {lesson.status === "COMPLETED" ? (
                <Icon name="check" size={18} />
              ) : (
                lesson.orderIndex
              )}
            </span>

            <div className={styles.copy}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{lesson.title}</span>
                {/* Bỏ khoá bài (2026-09-22) nên mọi bài đều mở — người mới
                 * nhìn 27 bài "Sẵn sàng" giống nhau lại không biết vào đâu.
                 * Nhãn chữ rõ ràng cho bài nên học tiếp: gợi ý thay vì cấm. */}
                <span
                  className={`${styles.status} ${
                    lesson.id === currentLessonId
                      ? styles.inProgress
                      : meta.tone
                  }`}
                >
                  {lesson.id === currentLessonId
                    ? lesson.startedWords > 0
                      ? "Học tiếp"
                      : "Bắt đầu từ đây"
                    : meta.label}
                </span>
              </div>
              <p className={`hanzi ${styles.preview}`}>
                {lesson.previewWords.join("  ")}
                {lesson.previewWords.length ? "…" : ""}
              </p>
              <div className={styles.progressRow}>
                <ProgressBar value={pct} label={`Tiến độ ${lesson.title}`} />
                <span className={styles.progressValue}>
                  {lesson.learnedWords}/{lesson.wordCount}
                </span>
              </div>
            </div>

            <Icon
              name="arrow"
              size={18}
              className={styles.arrow}
              data-icon="arrow"
            />
          </div>
        );

        return (
          <li
            key={lesson.id}
            className={styles.item}
            data-status={lesson.status}
          >
            <Link
              href={`/learn/${lesson.id}`}
              className={styles.link}
              aria-label={`Xem ${lesson.title}`}
            >
              {card}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function FocusedLessonPath({
  lessons,
  currentLessonId,
}: {
  lessons: LessonNode[];
  currentLessonId?: string | null;
}) {
  // Tìm theo CHỦ ĐỀ: cửa sổ 6 bài/lần là đủ khi đi tuần tự, nhưng từ khi bỏ
  // khoá thì người học chọn bài tự do — mà HSK 7-9 có tới 357 bài, lật từng
  // trang 6 bài để tìm "Thành ngữ" là không thực tế.
  const [query, setQuery] = useState("");
  const focusedIndex = currentLessonIndex(lessons, currentLessonId);
  const focusedLessonId = currentLessonId ?? lessons[focusedIndex]?.id;
  const defaultRange = initialRange(lessons.length, focusedIndex);
  const [range, setRange] = useState<LessonRange>(() => defaultRange);
  const listId = useId();
  const visibleLessons = lessons.slice(range.start, range.end);
  const hiddenBefore = range.start;
  const hiddenAfter = lessons.length - range.end;
  const changedFromDefault =
    range.start !== defaultRange.start || range.end !== defaultRange.end;
  const firstVisible = visibleLessons[0]?.orderIndex ?? 0;
  const lastVisible = visibleLessons.at(-1)?.orderIndex ?? 0;

  function showPrevious() {
    setRange((current) => ({
      ...current,
      start: Math.max(0, current.start - PATH_WINDOW_SIZE),
    }));
  }

  function showNext() {
    setRange((current) => ({
      ...current,
      end: Math.min(lessons.length, current.end + PATH_WINDOW_SIZE),
    }));
  }

  function showAll() {
    setRange({ start: 0, end: lessons.length });
  }

  function collapseToCurrent() {
    setRange(defaultRange);
  }

  const needle = normalize(query.trim());
  const matches = needle
    ? lessons.filter((lesson) => normalize(lesson.title).includes(needle))
    : [];

  return (
    <div className={styles.window}>
      <label className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm bài theo chủ đề: gia đình, đồ ăn…"
          aria-label="Tìm bài học theo chủ đề"
        />
      </label>

      {needle ? (
        <div className={styles.searchResult}>
          <p className={styles.windowStatus} role="status" aria-live="polite">
            {matches.length
              ? `${matches.length} bài khớp "${query.trim()}"`
              : `Không có bài nào khớp "${query.trim()}"`}
          </p>
          {matches.length > 0 && (
            <LessonItems
              lessons={matches}
              currentLessonId={focusedLessonId}
              listLabel={`${matches.length} bài khớp từ khoá`}
            />
          )}
          <Button
            variant="ghost"
            className={styles.searchBack}
            onClick={() => setQuery("")}
          >
            <Icon name="back" size={15} /> Quay lại lộ trình
          </Button>
        </div>
      ) : (
        <>
          {hiddenBefore > 0 && (
            <div
              className={`${styles.windowControl} ${styles.windowControlBefore}`}
            >
              <Button
                variant="secondary"
                onClick={showPrevious}
                aria-controls={listId}
                aria-expanded={false}
              >
                <Icon name="back" size={15} />
                Xem {Math.min(PATH_WINDOW_SIZE, hiddenBefore)} bài trước
              </Button>
              <span>{hiddenBefore} bài đang ẩn</span>
            </div>
          )}

          <div id={listId}>
            <LessonItems
              lessons={visibleLessons}
              currentLessonId={focusedLessonId}
              totalLessons={lessons.length}
            />
          </div>

          <div className={styles.windowFooter}>
            <p className={styles.windowStatus} role="status" aria-live="polite">
              Đang xem bài{" "}
              <strong>
                {firstVisible}–{lastVisible}
              </strong>{" "}
              trên <strong>{lessons.length}</strong>
            </p>
            <div className={styles.windowActions}>
              {hiddenAfter > 0 && (
                <Button
                  variant="secondary"
                  onClick={showNext}
                  aria-controls={listId}
                  aria-expanded={false}
                >
                  Xem {Math.min(PATH_WINDOW_SIZE, hiddenAfter)} bài tiếp
                  <Icon name="arrow" size={15} />
                </Button>
              )}
              {(hiddenBefore > 0 || hiddenAfter > 0) && (
                <Button
                  variant="ghost"
                  onClick={showAll}
                  aria-controls={listId}
                  aria-expanded={false}
                >
                  Xem tất cả
                </Button>
              )}
              {changedFromDefault && (
                <Button
                  variant="ghost"
                  onClick={collapseToCurrent}
                  aria-controls={listId}
                  aria-expanded
                >
                  Thu gọn về bài đang học
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function LessonPath({
  lessons,
  limit,
  currentLessonId,
}: {
  lessons: LessonNode[];
  limit?: number;
  currentLessonId?: string | null;
}) {
  if (limit) {
    return (
      <LessonItems
        lessons={lessons.slice(0, limit)}
        currentLessonId={currentLessonId}
        totalLessons={lessons.length}
      />
    );
  }

  if (lessons.length <= PATH_WINDOW_SIZE) {
    return (
      <LessonItems
        lessons={lessons}
        currentLessonId={currentLessonId}
        totalLessons={lessons.length}
      />
    );
  }

  const resetKey = `${currentLessonId ?? ""}:${lessons.map((lesson) => lesson.id).join(",")}`;
  return (
    <FocusedLessonPath
      key={resetKey}
      lessons={lessons}
      currentLessonId={currentLessonId}
    />
  );
}
