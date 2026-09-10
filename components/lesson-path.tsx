"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { ProgressBar } from "./ui";
import type { LessonNode } from "@/lib/types";

const STATUS_META: Record<
  LessonNode["status"],
  { label: string; tone: string }
> = {
  COMPLETED: { label: "Đã xong", tone: "bg-good/10 text-good" },
  IN_PROGRESS: { label: "Đang học", tone: "bg-primary/10 text-primary" },
  AVAILABLE: { label: "Mở", tone: "bg-accent/10 text-accent" },
  LOCKED: { label: "Khoá", tone: "bg-surface-2 text-muted" },
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
    <ol className="space-y-3">
      {shown.map((l) => {
        const meta = STATUS_META[l.status];
        const pct = l.wordCount ? (l.learnedWords / l.wordCount) * 100 : 0;
        const locked = l.status === "LOCKED";
        const inner = (
          <div
            className={`panel flex items-center gap-4 p-4 ${
              locked ? "opacity-60" : "hover-card"
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                l.status === "COMPLETED"
                  ? "bg-good/15 text-good"
                  : l.status === "LOCKED"
                    ? "bg-surface-2 text-muted"
                    : "bg-primary/12 text-primary"
              }`}
            >
              {l.status === "COMPLETED" ? (
                <Icon name="check" size={20} />
              ) : l.status === "LOCKED" ? (
                <Icon name="lock" size={16} />
              ) : (
                l.orderIndex
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{l.title}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${meta.tone}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className="hanzi mt-0.5 truncate text-sm text-muted">
                {l.previewWords.join("  ")}
                {l.previewWords.length ? "…" : ""}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={pct} label={`Tiến độ ${l.title}`} />
                <span className="shrink-0 text-xs text-muted">
                  {l.learnedWords}/{l.wordCount}
                </span>
              </div>
            </div>

            {!locked && (
              <Icon
                name="arrow"
                size={18}
                className="shrink-0 text-muted"
                data-icon="arrow"
              />
            )}
          </div>
        );
        return (
          <li key={l.id}>
            {locked ? (
              inner
            ) : (
              <Link href={`/study?lesson=${l.id}`}>{inner}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
