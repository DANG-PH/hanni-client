"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useWords } from "@/lib/hooks";
import type { Word } from "@/lib/types";

const skills = [
  { href: "/vocabulary", label: "Từ vựng", icon: "cards" },
  { href: "/grammar", label: "Ngữ pháp", icon: "book" },
  { href: "/listening", label: "Luyện nghe", icon: "sound" },
  { href: "/pronunciation", label: "Phát âm", icon: "spark" },
] satisfies { href: string; label: string; icon: IconName }[];

type LibraryProps = {
  skill: "listening" | "pronunciation" | "grammar";
  title: string;
  description: string;
  /** Các bước làm, hiện trên màn hình dẫn dắt trước khi vào bài luyện thật. */
  startSteps: string[];
  children: (words: Word[]) => ReactNode;
};

/** Dùng cùng bộ từ vựng và phân trang với thư viện hiện có. */
export function PracticeLibrary(props: LibraryProps) {
  const { user, loading } = useRequireAuth();
  if (loading || !user) return <Spinner />;
  return <LibraryContent {...props} />;
}

function LibraryContent({
  skill,
  title,
  description,
  startSteps,
  children,
}: LibraryProps) {
  const [level, setLevel] = useState(1);
  const [page, setPage] = useState(1);
  const [started, setStarted] = useState(false);
  const words = useWords({ level, page });

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="MỖI NGÀY MỘT CHÚT TIẾN BỘ"
        title={title}
        description={description}
      >
        <Link
          href="/learn"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Lộ trình của bạn <Icon name="arrow" size={16} />
        </Link>
      </PageHeading>

      <nav
        aria-label="Kỹ năng tiếng Trung"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {skills.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === `/${skill}` ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors ${item.href === `/${skill}` ? "border-primary text-primary" : "border-transparent text-muted hover:border-primary/30 hover:text-foreground"}`}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Chọn cấp độ HSK"
          className="flex flex-wrap gap-2"
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === level}
              onClick={() => {
                setLevel(item);
                setPage(1);
              }}
              className={`motion-button min-h-10 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${item === level ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"}`}
            >
              HSK {item}
            </button>
          ))}
        </div>
        {words.data && (
          <p className="text-xs text-muted">
            {words.data.total.toLocaleString("vi-VN")} từ trong thư viện
          </p>
        )}
      </div>

      {words.error ? (
        <ErrorNote>
          Chưa tải được nội dung luyện tập.{" "}
          <button
            onClick={() => void words.mutate()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : words.isLoading ? (
        <Spinner />
      ) : words.data?.items.length ? (
        started ? (
          <div key={`${level}-${page}`}>{children(words.data.items)}</div>
        ) : (
          <StartCard
            icon={skills.find((item) => item.href === `/${skill}`)?.icon ?? "sound"}
            title={title}
            steps={startSteps}
            count={words.data.items.length}
            onStart={() => setStarted(true)}
          />
        )
      ) : (
        <EmptyState
          title="Nội dung đang được cập nhật"
          description="Cấp HSK này chưa có từ vựng. Chọn một cấp khác để tiếp tục luyện tập."
        />
      )}

      {words.data && words.data.totalPages > 1 && !words.error && (
        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-border pt-6">
          <Button
            variant="secondary"
            disabled={page === 1 || words.isLoading}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="back" size={16} />
            Nhóm trước
          </Button>
          <span aria-live="polite" className="text-sm text-muted">
            Nhóm {page} / {words.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= words.data.totalPages || words.isLoading}
            onClick={() => setPage(page + 1)}
          >
            Nhóm tiếp
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Màn hình dẫn dắt trước khi vào bài luyện thật — giải thích cách chơi thay vì bắt tương tác luôn. */
function StartCard({
  icon,
  title,
  steps,
  count,
  onStart,
}: {
  icon: IconName;
  title: string;
  steps: string[];
  count: number;
  onStart: () => void;
}) {
  return (
    <Card className="mx-auto max-w-xl space-y-6 text-center">
      <span className="icon-tile mx-auto h-14! w-14!">
        <Icon name={icon} size={26} />
      </span>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          Nhóm này có {count} từ. Làm theo các bước sau:
        </p>
      </div>
      <ol className="space-y-3 text-left">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm leading-6">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <Button className="w-full" onClick={onStart}>
        Bắt đầu <Icon name="arrow" size={16} />
      </Button>
    </Card>
  );
}

export function PracticeTips({
  title,
  tips,
  children,
}: {
  title: string;
  tips: string[];
  children?: ReactNode;
}) {
  return (
    <aside className="space-y-4">
      {children}
      <div className="reveal panel p-5">
        <div className="mb-5 flex items-center gap-2 font-semibold">
          <Icon name="spark" size={18} className="text-primary" />
          {title}
        </div>
        <ol className="space-y-4">
          {tips.map((tip, i) => (
            <li key={tip} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>
      </div>
      <Link
        href="/study"
        className="hover-card panel flex items-center justify-between gap-3 p-5"
      >
        <span>
          <span className="block text-sm font-semibold">
            Ôn lại để nhớ lâu hơn
          </span>
          <span className="mt-1 block text-xs text-muted">
            Tiếp tục với thẻ ghi nhớ của bạn
          </span>
        </span>
        <Icon name="arrow" className="shrink-0 text-primary" size={18} />
      </Link>
    </aside>
  );
}
