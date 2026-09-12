"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./selection-group.module.css";

/** Nền chọn trượt theo nút thật, tự căn lại khi xuống dòng hoặc đổi cỡ chữ. */
export function SelectionGroup({
  children,
  className = "",
  label,
  value,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  value: string | number | undefined;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const indicator = group.querySelector<HTMLElement>(
      "[data-selection-indicator]",
    );
    if (!indicator) return;

    function align() {
      const selected = group!.querySelector<HTMLElement>(
        '[aria-pressed="true"]',
      );
      if (!selected) {
        delete group!.dataset.selectionReady;
        return;
      }
      indicator!.style.width = `${selected.offsetWidth}px`;
      indicator!.style.height = `${selected.offsetHeight}px`;
      indicator!.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`;
      group!.dataset.selectionReady = "true";
    }

    align();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(align);
    observer?.observe(group);
    group
      .querySelectorAll("button")
      .forEach((button) => observer?.observe(button));
    return () => observer?.disconnect();
  }, [value, children]);

  return (
    <div
      ref={groupRef}
      className={`${styles.group} ${className}`}
      role="group"
      aria-label={label}
    >
      <span
        data-selection-indicator
        className={styles.indicator}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
