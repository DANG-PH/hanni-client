"use client";

import { useState } from "react";
import { Button, Card, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useWords } from "@/lib/hooks";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function VocabularyPage() {
  const { user, loading } = useRequireAuth();
  const [level, setLevel] = useState<number | undefined>(1);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const words = useWords({ level, q: term, page });

  if (loading || !user) return <Spinner />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Từ vựng HSK 3.0</h1>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setLevel(undefined);
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-sm ${
            level === undefined ? "bg-primary text-primary-fg" : "bg-surface-2"
          }`}
        >
          Tất cả
        </button>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => {
              setLevel(l);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm ${
              level === l ? "bg-primary text-primary-fg" : "bg-surface-2"
            }`}
          >
            HSK {l}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(q);
          setPage(1);
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm Hán tự / pinyin / nghĩa"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary">
          Tìm
        </Button>
      </form>

      {words.isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {words.data?.items.map((w) => (
              <Card key={w.id} className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="hanzi text-2xl font-semibold">
                    {w.simplified}
                  </span>
                  <span className="text-xs text-muted">HSK {w.hskLevel}</span>
                </div>
                <div className="text-sm text-muted">{w.pinyin}</div>
                <div className="text-sm">
                  {w.meaningVi ?? w.meaningEn ?? (
                    <span className="text-muted italic">chưa có nghĩa</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
          {words.data && words.data.items.length === 0 && (
            <p className="text-muted">Không tìm thấy từ nào.</p>
          )}

          {words.data && words.data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-muted">
                {page} / {words.data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= words.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
