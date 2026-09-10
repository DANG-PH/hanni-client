"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { useWordAudio } from "@/components/practice/use-word-audio";
import {
  Card,
  EmptyState,
  ErrorNote,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useGrammar, useGrammarLevels, useGrammarPoint } from "@/lib/hooks";
import type { GrammarExample, GrammarListItem } from "@/lib/types";

export default function GrammarPage() {
  const { user, loading } = useRequireAuth();
  const levels = useGrammarLevels();
  const [level, setLevel] = useState<number | null>(null);
  const active = level ?? levels.data?.[0]?.level;
  const list = useGrammar(active);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const grouped = useMemo(() => list.data ?? [], [list.data]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="HIỂU CÁCH DÙNG, ĐẶT CÂU TỰ NHIÊN"
        title="Ngữ pháp theo cấp HSK"
        description="Mỗi điểm ngữ pháp gồm giải thích ngắn gọn, cấu trúc câu và ví dụ có pinyin. Bấm để xem chi tiết."
      />

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
          <div
            role="group"
            aria-label="Chọn cấp độ HSK"
            className="flex flex-wrap gap-2"
          >
            {levels.data.map((item) => (
              <button
                key={item.level}
                type="button"
                aria-pressed={active === item.level}
                onClick={() => {
                  setLevel(item.level);
                  setOpenSlug(null);
                }}
                className={`motion-button rounded-xl border px-4 py-2 text-sm font-medium ${
                  active === item.level
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted hover:bg-surface-2"
                }`}
              >
                HSK {item.level}
                <span className="ml-1.5 text-xs font-normal opacity-70">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {list.isLoading ? (
            <Spinner />
          ) : list.error ? (
            <ErrorNote>Chưa tải được ngữ pháp cấp này.</ErrorNote>
          ) : (
            <div className="space-y-3">
              {grouped.map((point) => (
                <GrammarRow
                  key={point.slug}
                  point={point}
                  open={openSlug === point.slug}
                  onToggle={() =>
                    setOpenSlug((cur) =>
                      cur === point.slug ? null : point.slug,
                    )
                  }
                />
              ))}
            </div>
          )}
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
    <Card className="overflow-hidden p-0!">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-surface-2/50"
      >
        <span className="hanzi mt-0.5 shrink-0 text-2xl text-primary">
          {point.titleZh}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{point.titleVi}</span>
          <span className="mt-1 block text-sm leading-6 text-muted">
            {point.summaryVi}
          </span>
        </span>
        <Icon
          name="arrow"
          size={16}
          className={`mt-1 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5">
          {detail.isLoading ? (
            <Spinner />
          ) : detail.error || !detail.data ? (
            <ErrorNote>Chưa tải được chi tiết.</ErrorNote>
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
    </Card>
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
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          <Icon name={audio.playing ? "pause" : "sound"} size={15} />
        </button>
        <div className="min-w-0">
          <p className="hanzi text-base leading-snug">{example.zh}</p>
          {showPinyin && (
            <p className="mt-1 text-xs text-primary">{example.pinyin}</p>
          )}
          <p className="mt-1 text-sm text-muted">{example.vi}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPinyin((v) => !v)}
          className="ml-auto shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2"
        >
          {showPinyin ? "Ẩn pinyin" : "Pinyin"}
        </button>
      </div>
    </div>
  );
}
