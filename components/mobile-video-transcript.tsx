"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoLine } from "@/lib/types";
import { Icon } from "./icon";
import { TranscriptLine } from "./transcript-line";
import styles from "./video-learning.module.css";

export function MobileVideoTranscript({
  lines,
  active,
  progress,
  resumeAt,
  showPinyin,
  showTrans,
  showCaption,
  onTogglePinyin,
  onToggleTrans,
  onToggleCaption,
  onSelect,
}: {
  lines: VideoLine[];
  active: number | null;
  progress: number;
  resumeAt: number;
  showPinyin: boolean;
  showTrans: boolean;
  showCaption: boolean;
  onTogglePinyin: () => void;
  onToggleTrans: () => void;
  onToggleCaption: () => void;
  onSelect: (index: number) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const position = Math.max(
    0,
    lines.findIndex((line) => line.index === active),
  );
  const current = lines[position];

  const scrollToCurrent = useCallback(() => {
    const panel = viewport.current;
    if (!panel?.clientHeight || !current) return;
    if (active === null) {
      panel.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const row = panel.querySelector<HTMLElement>(
      `[data-idx="${current.index}"]`,
    );
    if (!row) return;
    // Scroll only the transcript; scrollIntoView would also move the video/page.
    panel.scrollTo({
      top:
        panel.scrollTop +
        row.getBoundingClientRect().top -
        panel.getBoundingClientRect().top -
        8,
      behavior: "instant",
    });
  }, [active, current]);

  useEffect(() => {
    if (!following) return;
    scrollToCurrent();
    const panel = viewport.current;
    if (!panel) return;
    const observer = new ResizeObserver(scrollToCurrent);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [following, scrollToCurrent, showPinyin, showTrans]);

  function select(index: number) {
    setFollowing(true);
    onSelect(index);
    // Replaying the same sentence does not change `active`.
    if (index === current?.index) scrollToCurrent();
  }

  return (
    <section
      aria-label="Bản chép video"
      className={`${styles.transcript} flex min-h-[300px] flex-col overflow-hidden rounded-b-2xl border border-t-0 border-border bg-surface lg:hidden`}
    >
      <div className="shrink-0 border-b border-border px-3 pb-2 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <h2 className="font-bold">
            Bản chép{" "}
            <span className="font-normal text-muted">· {lines.length} câu</span>
          </h2>
          <span className="text-muted">Đã học {progress}%</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pinyin", on: showPinyin, toggle: onTogglePinyin },
            { label: "Bản dịch", on: showTrans, toggle: onToggleTrans },
            { label: "Phụ đề video", on: showCaption, toggle: onToggleCaption },
          ].map(({ label, on, toggle }) => (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={toggle}
              className={`min-h-11 rounded-lg px-1 text-xs font-medium ${on ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label="Các câu trong video, chạm một câu để nghe"
          onTouchMove={() => setFollowing(false)}
          onWheel={() => setFollowing(false)}
          onKeyDown={(event) => {
            if (
              [
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
                "Home",
                "End",
                " ",
              ].includes(event.key)
            )
              setFollowing(false);
          }}
          className="relative h-full overflow-y-auto overscroll-y-contain p-2 [scrollbar-width:thin]"
        >
          {active === null &&
            resumeAt > 1 &&
            lines.some((line) => line.index === resumeAt) && (
              <button
                type="button"
                onClick={() => select(resumeAt)}
                className="mb-2 min-h-11 w-full rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary"
              >
                Tiếp tục từ câu {resumeAt}
              </button>
            )}
          {lines.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Video này chưa có bản chép.
            </p>
          ) : (
            lines.map((line) => (
              <TranscriptLine
                key={line.id}
                line={line}
                active={active === line.index}
                compact
                showPinyin={showPinyin}
                showTrans={showTrans}
                onSelect={() => select(line.index)}
              />
            ))
          )}
          <div aria-hidden="true" className="h-10" />
        </div>
        {!following && current && (
          <button
            type="button"
            onClick={() => {
              setFollowing(true);
              scrollToCurrent();
            }}
            className="absolute bottom-2 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-primary/20 bg-surface px-4 text-xs font-semibold text-primary shadow-lg"
          >
            <Icon name="target" size={15} /> Về câu đang phát
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
        <div className="grid grid-cols-[1fr_1.3fr_1fr] items-center gap-2">
          <button
            type="button"
            disabled={!current || position === 0}
            onClick={() => select(lines[position - 1].index)}
            className="flex min-h-11 items-center justify-center gap-1 rounded-lg bg-surface-2 text-xs font-medium disabled:opacity-35"
          >
            <Icon name="chevron" size={14} className="rotate-180" /> Câu trước
          </button>
          <button
            type="button"
            disabled={!current}
            onClick={() => current && select(current.index)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-fg disabled:opacity-35"
          >
            <Icon name="refresh" size={15} /> Nghe lại câu
          </button>
          <button
            type="button"
            disabled={!current || position === lines.length - 1}
            onClick={() => select(lines[position + 1].index)}
            className="flex min-h-11 items-center justify-center gap-1 rounded-lg bg-surface-2 text-xs font-medium disabled:opacity-35"
          >
            Câu sau <Icon name="chevron" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
