"use client";

import { Icon } from "@/components/icon";
import { playWord } from "@/components/lesson-session/steps";

/** Nút nghe nhỏ: "bā 八 🔊". Không có ghi âm thì chỉ hiện chữ. */
export function SoundChip({
  mark,
  char,
  url,
  className = "",
}: {
  mark: string;
  char?: string;
  url?: string | null;
  className?: string;
}) {
  const body = (
    <>
      <span className="font-semibold">{mark}</span>
      {char && (
        <span lang="zh" className="hanzi text-muted">
          {char}
        </span>
      )}
    </>
  );
  if (!url)
    return <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>{body}</span>;
  return (
    <button
      type="button"
      onClick={() => playWord(url)}
      aria-label={`Nghe ${mark}`}
      className={`motion-button inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground hover:bg-primary/15 ${className}`}
    >
      <Icon name="sound" size={14} className="text-primary" />
      {body}
    </button>
  );
}
