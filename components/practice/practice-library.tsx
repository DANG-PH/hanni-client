"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  Button,
  EmptyState,
  ErrorNote,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useWords } from "@/lib/hooks";
import type { Word } from "@/lib/types";
import { LevelFilter } from "@/components/learning-library";
import styles from "./practice-library.module.css";

const skillIcons = {
  listening: "sound",
  pronunciation: "spark",
  grammar: "book",
} satisfies Record<string, IconName>;

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
  const sessionRef = useRef<HTMLDivElement>(null);

  const pagination = words.data &&
    words.data.totalPages > 1 &&
    !words.error && (
      <div className={styles.pagination}>
        <Button
          variant="ghost"
          disabled={page === 1 || words.isLoading}
          onClick={() => setPage(page - 1)}
        >
          <Icon name="back" size={15} /> Nhóm trước
        </Button>
        <span aria-live="polite">
          Nhóm {page} / {words.data.totalPages}
        </span>
        <Button
          variant="ghost"
          disabled={page >= words.data.totalPages || words.isLoading}
          onClick={() => setPage(page + 1)}
        >
          Nhóm tiếp <Icon name="arrow" size={15} />
        </Button>
      </div>
    );

  return (
    <div className="page-wrap learning-workspace">
      <PageHeading
        icon={skillIcons[skill]}
        eyebrow="Luyện tập mỗi ngày"
        title={title}
        description={description}
      >
        <Link
          href="/learn"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-primary"
        >
          Lộ trình của bạn <Icon name="arrow" size={16} />
        </Link>
      </PageHeading>

      {started ? (
        <>
          <div className={styles.sessionBar}>
            <p>
              <span className={styles.levelBadge}>HSK {level}</span> Nhóm {page}{" "}
              · {words.data?.items.length ?? 0} từ
            </p>
            <Button variant="ghost" onClick={() => setStarted(false)}>
              <Icon name="settings" size={16} /> Đổi bài luyện
            </Button>
          </div>
          <div
            ref={sessionRef}
            tabIndex={-1}
            className="outline-none"
            aria-label="Bài luyện"
          >
            {words.error ? (
              <ErrorNote>
                Chưa tải được bài luyện.{" "}
                <button
                  className="underline"
                  onClick={() => void words.mutate()}
                >
                  Thử lại
                </button>
              </ErrorNote>
            ) : words.isLoading ? (
              <Spinner />
            ) : words.data?.items.length ? (
              <div key={`${level}-${page}`}>{children(words.data.items)}</div>
            ) : (
              <EmptyState
                title="Chưa có từ trong nhóm này"
                description="Chọn nhóm khác để tiếp tục luyện tập."
              />
            )}
          </div>
          {pagination}
        </>
      ) : (
        <section className={styles.setup} aria-label="Chuẩn bị bài luyện">
          <div className={styles.setupMain}>
            <div className={styles.setupHeading}>
              <span className="icon-tile">
                <Icon name={skillIcons[skill]} size={22} />
              </span>
              <div>
                <h2>Bài luyện của bạn</h2>
                <p>Chọn mức vừa sức, tiến bộ từng chút một.</p>
              </div>
            </div>
            <div className={styles.levelPicker}>
              <h3>Chọn cấp độ HSK</h3>
              <LevelFilter
                options={Array.from({ length: 9 }, (_, i) => ({
                  value: i + 1,
                  label: `HSK ${i + 1}`,
                }))}
                value={level}
                onChange={(value) => {
                  setLevel(value ?? 1);
                  setPage(1);
                }}
              />
            </div>
            <div className={styles.sessionSummary} aria-live="polite">
              <span className={styles.levelBadge}>HSK {level}</span>
              <div>
                <strong>
                  {words.isLoading
                    ? "Đang chuẩn bị từ vựng…"
                    : words.error
                      ? "Chưa tải được từ vựng"
                      : `${words.data?.items.length ?? 0} từ trong bài luyện`}
                </strong>
                <p>
                  {words.data && !words.error
                    ? `${words.data.total.toLocaleString("vi-VN")} từ trong thư viện · Nhóm ${page}`
                    : "Nghe kỹ, luyện từng từ theo nhịp của bạn."}
                </p>
              </div>
            </div>
            {words.error && (
              <ErrorNote>
                Chưa tải được nội dung.{" "}
                <button
                  onClick={() => void words.mutate()}
                  className="font-semibold underline"
                >
                  Thử lại
                </button>
              </ErrorNote>
            )}
            {!words.error && !words.isLoading && !words.data?.items.length && (
              <p className="text-sm text-muted">
                Cấp độ này đang được cập nhật. Chọn một cấp khác để bắt đầu nhé.
              </p>
            )}
            <Button
              className={styles.startButton}
              disabled={
                words.isLoading || !!words.error || !words.data?.items.length
              }
              onClick={() => {
                setStarted(true);
                requestAnimationFrame(() => {
                  sessionRef.current?.focus({ preventScroll: true });
                  sessionRef.current?.scrollIntoView({
                    block: "start",
                    behavior: "instant",
                  });
                });
              }}
            >
              {skill === "listening"
                ? "Bắt đầu luyện nghe"
                : skill === "pronunciation"
                  ? "Bắt đầu luyện phát âm"
                  : "Bắt đầu luyện tập"}
              <Icon name="arrow" size={17} />
            </Button>
            {pagination}
          </div>
          <aside className={styles.guide}>
            <p className={styles.guideLabel}>
              <Icon name="spark" size={16} /> Một chút chuẩn bị
            </p>
            <h2>
              {skill === "listening"
                ? "Lắng nghe. Ghi nhớ. Hiểu hơn."
                : "Nghe mẫu. Cất tiếng. Tự tin hơn."}
            </h2>
            <ol>
              {startSteps.map((step, i) => (
                <li key={step}>
                  <span>{i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <p className={styles.guideNote}>
              <Icon
                name={skill === "pronunciation" ? "mic" : "headphones"}
                size={18}
              />
              {skill === "pronunciation"
                ? "Chuẩn bị micro và một góc yên tĩnh để nghe rõ giọng mình."
                : "Dùng tai nghe nếu có để nghe rõ từng thanh điệu."}
            </p>
          </aside>
        </section>
      )}
    </div>
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
