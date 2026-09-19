"use client";

import { useId, useState, type Key, type ReactNode } from "react";
import { Icon } from "./icon";
import { Button } from "./ui";
import styles from "./progressive-list.module.css";

export type ProgressiveListProps<T> = {
  /** Toàn bộ dữ liệu của danh sách. */
  items: readonly T[];
  /** Render phần nội dung với số phần tử hiện đang được mở. */
  renderItems: (visibleItems: readonly T[]) => ReactNode;
  /** Số phần tử xuất hiện khi danh sách vừa mở. Mặc định là 6. */
  initialCount?: number;
  /** Số phần tử được thêm sau mỗi lần bấm. Mặc định là 6. */
  step?: number;
  /** Nhãn số nhiều, ví dụ: "bài học", "video" hoặc "từ vựng". */
  itemLabel: string;
  /** Đổi giá trị này khi chuyển sang một tập dữ liệu khác cần thu gọn lại. */
  resetKey?: Key;
};

type ProgressiveListContentProps<T> = Omit<
  ProgressiveListProps<T>,
  "resetKey"
>;

function clampCount(value: number, maximum: number) {
  if (!Number.isFinite(value)) {
    return maximum;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function ProgressiveListContent<T>({
  items,
  renderItems,
  initialCount = 6,
  step = 6,
  itemLabel,
}: ProgressiveListContentProps<T>) {
  const totalCount = items.length;
  const initialVisibleCount = clampCount(initialCount, totalCount);
  const batchSize = Math.max(1, Math.floor(Number.isFinite(step) ? step : 6));
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const listId = useId();

  const safeVisibleCount = Math.min(visibleCount, totalCount);
  const visibleItems = items.slice(0, safeVisibleCount);
  const remainingCount = totalCount - safeVisibleCount;
  const nextCount = Math.min(batchSize, remainingCount);
  const hasMoreItems = remainingCount > 0;
  const canShowAll = remainingCount > batchSize;
  const canCollapse = safeVisibleCount > initialVisibleCount;

  return (
    <section className={styles.root} aria-label={`Danh sách ${itemLabel}`}>
      <div className={styles.summary}>
        <p className={styles.count} role="status" aria-live="polite">
          Đang hiển thị {safeVisibleCount} / {totalCount} {itemLabel}
        </p>
      </div>

      <div id={listId} className={styles.items}>
        {renderItems(visibleItems)}
      </div>

      {(hasMoreItems || canCollapse) && (
        <div className={styles.controls}>
          {hasMoreItems && (
            <Button
              variant="secondary"
              className={styles.button}
              aria-controls={listId}
              onClick={() => {
                setVisibleCount((currentCount) =>
                  Math.min(totalCount, currentCount + batchSize),
                );
              }}
            >
              <Icon name="plus" size={16} />
              Xem thêm {nextCount} {itemLabel}
            </Button>
          )}

          {canShowAll && (
            <Button
              variant="ghost"
              className={styles.button}
              aria-controls={listId}
              onClick={() => {
                setVisibleCount(totalCount);
              }}
            >
              <Icon name="arrow" size={16} />
              Xem tất cả
            </Button>
          )}

          {canCollapse && (
            <Button
              variant="ghost"
              className={styles.button}
              aria-controls={listId}
              onClick={() => {
                setVisibleCount(initialVisibleCount);
              }}
            >
              <Icon name="chevron" size={16} className={styles.collapseIcon} />
              Thu gọn
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Danh sách có thể mở dần cho các màn hình chứa nhiều mục.
 *
 * Inner component được remount theo resetKey và độ dài mảng; nhờ đó trạng thái
 * hiển thị luôn quay về initialCount khi đổi tập dữ liệu, không cần đồng bộ
 * state bằng effect.
 */
export function ProgressiveList<T>({
  resetKey,
  items,
  ...props
}: ProgressiveListProps<T>) {
  const contentKey = `${String(resetKey ?? "progressive-list")}-${items.length}`;

  return <ProgressiveListContent key={contentKey} items={items} {...props} />;
}
