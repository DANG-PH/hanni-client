import Link from "next/link";
import { Icon } from "./icon";
import { ProgressBar } from "./ui";
import type { LevelBucket } from "@/lib/types";

export function LevelCard({ level }: { level: LevelBucket }) {
  const tone =
    level.level <= 3
      ? "text-primary bg-primary/8"
      : level.level <= 6
        ? "text-accent bg-accent/8"
        : "text-lavender bg-lavender/8";
  return (
    <Link
      href={`/vocabulary?level=${level.level}`}
      className="reveal hover-card panel group block p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold ${tone}`}
        >
          {String(level.level).padStart(2, "0")}
        </span>
        <span className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-muted">
          {level.level <= 3
            ? "Sơ cấp"
            : level.level <= 6
              ? "Trung cấp"
              : "Cao cấp"}
        </span>
      </div>
      <h3 className="mt-4 font-semibold">
        HSK {level.level}{" "}
        <span className="font-normal text-muted">· {level.nameVi}</span>
      </h3>
      <div className="mb-2 mt-5 flex justify-between text-xs">
        <span className="text-muted">
          {level.learned} / {level.totalWords} từ đã thuộc
        </span>
        <span className="font-medium text-primary">
          {level.percentComplete}%
        </span>
      </div>
      <ProgressBar
        value={level.percentComplete}
        label={`Tiến độ HSK ${level.level}`}
      />
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {level.learning} đang học · {level.due} đến hạn
        </span>
        <Icon
          name="arrow"
          size={17}
          className="text-muted group-hover:text-primary"
        />
      </div>
    </Link>
  );
}
