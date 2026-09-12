"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import {
  LearningHeader,
  LearningTip,
  LevelFilter,
} from "@/components/learning-library";
import styles from "@/components/learning-library.module.css";
import { useWordAudio } from "@/components/practice/use-word-audio";
import {
  Button,
  EmptyState,
  ErrorNote,
  LinkButton,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useGrammar, useGrammarLevels, useGrammarPoint } from "@/lib/hooks";
import type { GrammarExample, GrammarListItem } from "@/lib/types";

function normalizeSearch(text: string) {
  return text
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export default function GrammarPage() {
  const { user, loading } = useRequireAuth();
  const levels = useGrammarLevels();
  const [level, setLevel] = useState<number | null>(null);
  const active = level ?? levels.data?.[0]?.level;
  const list = useGrammar(active);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const term = normalizeSearch(query.trim());
    return (list.data ?? []).filter((point) =>
      normalizeSearch(
        `${point.titleZh} ${point.titleVi} ${point.summaryVi}`,
      ).includes(term),
    );
  }, [list.data, query]);

  if (loading || !user) return <Spinner />;

  return (
    <div className={`page-wrap ${styles.page}`}>
      <LearningHeader
        section="grammar"
        eyebrow="HIỂU CẤU TRÚC · NÓI TỰ NHIÊN"
        title="Từ những từ rời, thành câu hay."
        description="Khám phá ngữ pháp theo cấp HSK qua cấu trúc dễ hiểu và ví dụ gần gũi. Mỗi mẫu câu là một cách mới để nói điều bạn muốn."
      >
        <LinkButton href="/vocabulary" variant="secondary">
          <Icon name="book" size={16} /> Khám phá từ vựng
        </LinkButton>
        <span className={styles.heroNote}>
          <Icon name="sound" size={15} /> Ví dụ có pinyin & phát âm
        </span>
      </LearningHeader>

      {levels.error ? (
        <ErrorNote>
          Chưa tải được danh sách ngữ pháp.{" "}
          <button
            className="font-semibold underline"
            onClick={() => void levels.mutate()}
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : levels.isLoading ? (
        <Spinner />
      ) : !levels.data?.length ? (
        <EmptyState
          title="Chưa có nội dung ngữ pháp"
          description="Nội dung đang được biên soạn."
        />
      ) : (
        <>
          <section
            className={styles.toolbar}
            aria-label="Tìm kiếm và lọc ngữ pháp"
          >
            <div className={styles.toolbarTop}>
              <p className={styles.toolbarLabel}>Bạn đang học ở cấp độ nào?</p>
              <div className={`${styles.searchInput} ${styles.grammarSearch}`}>
                <Icon name="search" size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="field"
                  placeholder="Tìm cấu trúc, Hán tự, nghĩa…"
                  aria-label="Tìm ngữ pháp trong cấp đang chọn"
                  type="search"
                />
              </div>
            </div>
            <LevelFilter
              options={levels.data.map((item) => ({
                value: item.level,
                label: `HSK ${item.level === 7 ? "7–9" : item.level}`,
                count: item.count,
              }))}
              value={active}
              onChange={(value) => {
                setLevel(value ?? null);
                setOpenSlug(null);
              }}
            />
          </section>
          <div className={styles.contentColumns}>
            <section
              className={styles.contentMain}
              aria-label="Danh sách ngữ pháp"
            >
              <div className={styles.sectionHeading}>
                <h2>
                  Ngữ pháp HSK {active === 7 ? "7–9" : active}
                  <span className={styles.count} aria-live="polite">
                    {grouped.length} cấu trúc
                  </span>
                </h2>
                <span className={styles.muted}>
                  Chọn một cấu trúc để khám phá
                </span>
              </div>
              {list.isLoading ? (
                <Spinner />
              ) : list.error ? (
                <ErrorNote>
                  Chưa tải được ngữ pháp cấp này.{" "}
                  <button
                    className="font-semibold underline"
                    onClick={() => void list.mutate()}
                  >
                    Thử lại
                  </button>
                </ErrorNote>
              ) : !grouped.length ? (
                <EmptyState
                  title={
                    query
                      ? "Chưa tìm thấy cấu trúc phù hợp"
                      : "Chưa có ngữ pháp ở cấp này"
                  }
                  description={
                    query
                      ? "Thử từ khóa khác hoặc chọn một cấp HSK khác."
                      : "Hãy chọn một cấp HSK khác để tiếp tục học."
                  }
                >
                  {query && (
                    <Button variant="secondary" onClick={() => setQuery("")}>
                      Xóa tìm kiếm
                    </Button>
                  )}
                </EmptyState>
              ) : (
                <div className={styles.grammarList}>
                  {grouped
                    .filter((point) => !point.flat)
                    .map((point) => (
                      <GrammarRow
                        key={point.slug}
                        point={point}
                        open={openSlug === point.slug}
                        onToggle={() =>
                          setOpenSlug((current) =>
                            current === point.slug ? null : point.slug,
                          )
                        }
                      />
                    ))}
                  {grouped.some((point) => point.flat) && (
                    <details
                      open={
                        grouped.every((point) => point.flat) || !!query.trim()
                      }
                      className={styles.grammarRow}
                    >
                      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">
                        <Icon
                          name="book"
                          size={16}
                          className="mr-2 inline text-primary"
                        />
                        Đại cương HSK {active === 7 ? "7–9" : active} ·{" "}
                        {grouped.filter((point) => point.flat).length} mục
                      </summary>
                      <ul className="divide-y divide-border border-t border-border">
                        {grouped
                          .filter((point) => point.flat)
                          .map((point) => (
                            <li
                              key={point.slug}
                              className="flex items-start gap-3 px-5 py-4"
                            >
                              <span
                                lang="zh"
                                className={`hanzi ${styles.grammarCharacter}`}
                                data-long={Array.from(point.titleZh).length > 2}
                              >
                                {point.titleZh}
                              </span>
                              <span className="min-w-0">
                                <span className={styles.grammarTitle}>
                                  {point.titleVi}
                                </span>
                                <span className={styles.grammarSummary}>
                                  {point.summaryVi}
                                </span>
                              </span>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </section>
            <aside className={styles.aside}>
              <div className={styles.sideCard}>
                <span className={`${styles.badge} mb-4`}>
                  <Icon name="spark" size={12} /> HỌC MỘT CHÚT, NHỚ LÂU HƠN
                </span>
                <h2>3 bước để dùng được một mẫu câu</h2>
                <ol className={styles.steps}>
                  {[
                    [
                      "Hiểu cấu trúc",
                      "Đọc giải thích và chú ý vị trí của từng thành phần trong câu.",
                    ],
                    [
                      "Nghe & đọc theo",
                      "Nghe ví dụ, đọc theo pinyin rồi thử đọc lại khi ẩn pinyin.",
                    ],
                    [
                      "Đặt câu của bạn",
                      "Thay từ trong ví dụ bằng người, vật hoặc hoạt động quen thuộc.",
                    ],
                  ].map(([title, text], index) => (
                    <li key={title}>
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <div>
                        <strong>{title}</strong>
                        {text}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <LearningTip title="Từ vựng và ngữ pháp đi cùng nhau">
                Một cấu trúc quen sẽ dễ nhớ hơn khi dùng với những từ bạn vừa
                học.
                <Link href="/vocabulary">
                  Mở thư viện từ vựng <Icon name="arrow" size={14} />
                </Link>
              </LearningTip>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function GrammarRow({
  point,
  open,
  onToggle,
}: {
  point: GrammarListItem;
  open: boolean;
  onToggle: () => void;
}) {
  const detail = useGrammarPoint(open ? point.slug : null);

  return (
    <article className={styles.grammarRow}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`grammar-${point.slug}`}
        id={`grammar-trigger-${point.slug}`}
        className={styles.grammarTrigger}
      >
        <span
          lang="zh"
          className={`hanzi ${styles.grammarCharacter}`}
          data-long={Array.from(point.titleZh).length > 2}
        >
          {point.titleZh}
        </span>
        <span className="min-w-0 flex-1">
          <span className={styles.grammarTitle}>{point.titleVi}</span>
          <span className={styles.grammarSummary}>{point.summaryVi}</span>
        </span>
        <span className={styles.grammarArrow}>
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {open && (
        <div
          id={`grammar-${point.slug}`}
          role="region"
          aria-labelledby={`grammar-trigger-${point.slug}`}
          className={styles.grammarDetail}
        >
          {detail.isLoading ? (
            <Spinner />
          ) : detail.error || !detail.data ? (
            <ErrorNote>
              Chưa tải được chi tiết.{" "}
              <button
                onClick={() => void detail.mutate()}
                className="font-semibold underline"
              >
                Thử lại
              </button>
            </ErrorNote>
          ) : (
            <div className="space-y-5">
              <p className="whitespace-pre-line text-sm leading-7">
                {detail.data.explanationVi}
              </p>

              {detail.data.patterns.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">CẤU TRÚC</p>
                  <ul className="space-y-1.5">
                    {detail.data.patterns.map((pattern) => (
                      <li
                        key={pattern}
                        className="hanzi rounded-lg bg-surface-2 px-3 py-2 text-sm"
                      >
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="eyebrow mb-2">VÍ DỤ</p>
                <div className="space-y-2.5">
                  {detail.data.examples.map((example, i) => (
                    <ExampleRow key={i} example={example} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ExampleRow({ example }: { example: GrammarExample }) {
  const audio = useWordAudio(example.zh);
  const [showPinyin, setShowPinyin] = useState(true);

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => void audio.play()}
          disabled={audio.playing}
          aria-label="Nghe câu"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          <Icon name={audio.playing ? "pause" : "sound"} size={15} />
        </button>
        <div className="min-w-0">
          <p lang="zh" className="hanzi text-base leading-snug">
            {example.zh}
          </p>
          {showPinyin && (
            <p className="mt-1 text-xs text-primary">{example.pinyin}</p>
          )}
          <p className="mt-1 text-sm text-muted">{example.vi}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPinyin((v) => !v)}
          aria-pressed={showPinyin}
          className="ml-auto min-h-10 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2"
        >
          {showPinyin ? "Ẩn pinyin" : "Pinyin"}
        </button>
      </div>
    </div>
  );
}
