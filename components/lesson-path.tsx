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
  LOCKED: { label: "Chưa mở", tone: styles.locked },
};

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
}: {
  lessons: LessonNode[];
  currentLessonId?: string | null;
  totalLessons?: number;
}) {
  const firstOrder = lessons[0]?.orderIndex;
  const lastOrder = lessons.at(-1)?.orderIndex;
  const label =
    totalLessons && firstOrder && lastOrder
      ? `Bài học ${firstOrder} đến ${lastOrder} trong ${totalLessons} bài`
      : "Danh sách bài học";

  return (
    <ol
      className={styles.list}
      start={firstOrder}
      aria-label={label}
    >
      {lessons.map((lesson) => {
        const meta = STATUS_META[lesson.status];
        const pct = lesson.wordCount
          ? (lesson.learnedWords / lesson.wordCount) * 100
          : 0;
        const locked = lesson.status === "LOCKED";
        const card = (
          <div
            className={`${styles.card} ${locked ? styles.cardLocked : ""}`}
            data-status={lesson.status}
            data-current={
              lesson.id === currentLessonId ? "true" : undefined
            }
          >
            <span className={`${styles.number} ${meta.tone}`}>
              {lesson.status === "COMPLETED" ? (
                <Icon name="check" size={18} />
              ) : lesson.status === "LOCKED" ? (
                <Icon name="lock" size={15} />
              ) : (
                lesson.orderIndex
              )}
            </span>

            <div className={styles.copy}>
              <div className={styles.titleRow}>
                <span className={styles.title}>{lesson.title}</span>
                <span className={`${styles.status} ${meta.tone}`}>
                  {meta.label}
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

            {!locked && (
              <Icon
                name="arrow"
                size={18}
                className={styles.arrow}
                data-icon="arrow"
              />
            )}
          </div>
        );

        return (
          <li
            key={lesson.id}
            className={styles.item}
            data-status={lesson.status}
          >
            {locked ? (
              card
            ) : (
              <Link
                href={`/learn/${lesson.id}`}
                className={styles.link}
                aria-label={`Xem ${lesson.title}`}
              >
                {card}
              </Link>
            )}
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

  return (
    <div className={styles.window}>
      {hiddenBefore > 0 && (
        <div className={`${styles.windowControl} ${styles.windowControlBefore}`}>
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
          Đang xem bài <strong>{firstVisible}–{lastVisible}</strong> trên{" "}
          <strong>{lessons.length}</strong>
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
