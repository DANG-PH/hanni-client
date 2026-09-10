"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { AudioButton } from "@/components/audio-button";
import { useRequireAuth } from "@/lib/auth";
import { useWords } from "@/lib/hooks";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function VocabularyContent() {
  const { user, loading } = useRequireAuth();
  const searchParams = useSearchParams();
  const initialLevel = Number(searchParams.get("level") ?? 1);
  const [level, setLevel] = useState<number | undefined>(
    LEVELS.includes(initialLevel) ? initialLevel : 1,
  );
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const words = useWords({ level, q: term, page });
  if (loading || !user) return <Spinner />;

  function selectLevel(next: number | undefined) {
    setLevel(next);
    setPage(1);
  }

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="KHÁM PHÁ NGÔN NGỮ"
        title="Thư viện từ vựng"
        description="Từng từ một, mở rộng thế giới tiếng Trung của bạn."
      >
        <LinkButton href="/study">
          <Icon name="cards" size={17} />
          Vào ôn tập
        </LinkButton>
      </PageHeading>
      <Card className="space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(q.trim());
            setPage(1);
          }}
          className="flex gap-2 sm:gap-3"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Icon
              name="search"
              className="absolute left-4 top-3.5 text-muted"
              size={19}
            />
            <input
              aria-label="Tìm từ vựng theo Hán tự, pinyin hoặc nghĩa"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm Hán tự, pinyin hoặc nghĩa…"
              className="field pl-11!"
            />
          </div>
          <Button type="submit">Tìm kiếm</Button>
        </form>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Lọc theo cấp HSK"
        >
          {[undefined, ...LEVELS].map((l) => (
            <button
              key={l ?? "all"}
              onClick={() => selectLevel(l)}
              aria-pressed={level === l}
              className={`motion-button min-h-10 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${level === l ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"}`}
            >
              {l ? `HSK ${l}` : "Tất cả"}
            </button>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {level ? `Từ vựng HSK ${level}` : "Tất cả từ vựng"}
          <span className="ml-2 text-sm font-normal text-muted">
            {words.data ? `(${words.data.total} từ)` : ""}
          </span>
        </h2>
        {term && (
          <button
            onClick={() => {
              setQ("");
              setTerm("");
              setPage(1);
            }}
            className="flex items-center gap-2 text-xs text-muted"
          >
            Xóa tìm kiếm “{term}”<Icon name="close" size={14} />
          </button>
        )}
      </div>
      {words.error ? (
        <ErrorNote>
          Chưa tải được từ vựng.{" "}
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {words.data.items.map((w) => (
              <Card key={w.id} className="hover-card">
                <div className="flex items-start justify-between gap-3">
                  <span
                    lang="zh"
                    className="hanzi break-all text-4xl leading-normal"
                  >
                    {w.simplified}
                  </span>
                  <span className="shrink-0 rounded-lg bg-primary/7 px-2 py-1 text-[11px] font-medium text-primary">
                    HSK {w.hskLevel}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
                  {w.pinyin}
                  <AudioButton src={w.audioUrl} size={16} />
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-sm leading-6">
                    {w.meaningVi ?? w.meaningEn ?? (
                      <span className="italic text-muted">
                        Nghĩa đang được cập nhật
                      </span>
                    )}
                  </p>
                  {!w.meaningVi && w.meaningEn && (
                    <span className="text-[11px] text-muted">
                      Nghĩa tiếng Anh
                    </span>
                  )}
                  {w.pos.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      {w.pos.join(" · ")}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {words.data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 border-t border-border pt-6">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icon name="back" size={16} />
                Trước
              </Button>
              <span className="text-sm text-muted" aria-live="polite">
                {page} / {words.data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= words.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <Icon name="arrow" size={16} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={
            term ? "Chưa tìm thấy từ phù hợp" : "Chưa có từ vựng ở cấp này"
          }
          description={
            term
              ? "Thử một Hán tự, pinyin hoặc nghĩa khác. Bạn cũng có thể tìm trong tất cả cấp HSK."
              : "Hãy chọn cấp HSK khác để tiếp tục khám phá."
          }
        >
          <Button
            variant="secondary"
            onClick={() => {
              setQ("");
              setTerm("");
              selectLevel(undefined);
            }}
          >
            Xem tất cả từ vựng
          </Button>
        </EmptyState>
      )}
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <VocabularyContent />
    </Suspense>
  );
}
