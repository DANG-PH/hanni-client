"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { ProgressBar } from "./ui";
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

export function LessonPath({
  lessons,
  limit,
}: {
  lessons: LessonNode[];
  limit?: number;
}) {
  const shown = limit ? lessons.slice(0, limit) : lessons;

  return (
    <ol className={styles.list}>
      {shown.map((lesson) => {
        const meta = STATUS_META[lesson.status];
        const pct = lesson.wordCount
          ? (lesson.learnedWords / lesson.wordCount) * 100
          : 0;
        const locked = lesson.status === "LOCKED";
        const card = (
          <div
            className={`${styles.card} ${locked ? styles.cardLocked : ""}`}
            data-status={lesson.status}
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
