"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { TranscriptLine } from "@/components/transcript-line";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { YoutubePlayer } from "@/components/youtube-player";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useVideo } from "@/lib/hooks";

export default function WatchDetailPage() {
  const { user, loading } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useVideo(id);

  const [showPinyin, setShowPinyin] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [readMax, setReadMax] = useState(0);
  const seekRef = useRef<((s: number) => void) | null>(null);

  if (loading || !user || isLoading) return <Spinner />;
  if (error || !data)
    return (
      <div className="page-wrap max-w-xl space-y-4">
        <ErrorNote>Không tải được video này.</ErrorNote>
        <Link href="/watch" className="text-sm font-semibold text-primary">
          ← Về danh sách
        </Link>
      </div>
    );

  const read = Math.max(readMax, data.progress.linesRead);
  const pct = data.sentenceCount
    ? Math.round((read / data.sentenceCount) * 100)
    : 0;

  function selectLine(index: number, startMs: number | null) {
    setActive(index);
    if (startMs != null) seekRef.current?.(startMs / 1000);
    const next = Math.max(read, index);
    setReadMax(next);
    void api
      .patch(`/videos/${id}/progress`, {
        lastLineIndex: index,
        linesRead: next,
      })
      .catch(() => undefined);
  }

  async function del() {
    if (!confirm("Xoá video này?")) return;
    await api.del(`/videos/${id}`).catch(() => undefined);
    router.push("/watch");
  }

  return (
    <div className="page-wrap max-w-none! space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/watch" className="hover:text-primary">
          Học qua video
        </Link>
        <Icon name="chevron" size={14} />
        <span className="font-medium text-foreground">{data.title}</span>
        {data.isOwner && (
          <button
            onClick={() => void del()}
            className="ml-auto text-xs text-danger hover:underline"
          >
            Xoá
          </button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {data.title}
          {data.titleZh && (
            <span className="hanzi ml-3 text-lg font-normal text-muted">
              {data.titleZh}
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {data.hskLevel ? `HSK ${data.hskLevel} · ` : ""}
          {data.sentenceCount} câu
          {data.author ? ` · ${data.author}` : ""}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <YoutubePlayer youtubeId={data.youtubeId} seekRef={seekRef} />
          {data.description && (
            <p className="text-sm leading-6 text-muted">{data.description}</p>
          )}
        </div>

        <div className="panel flex max-h-[70vh] flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="text-xs font-bold tracking-wide">BẢN CHÉP</span>
            <button
              onClick={() => setShowPinyin((v) => !v)}
              className={`ml-auto rounded-lg px-2 py-1 text-xs font-medium ${
                showPinyin
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-2 text-muted"
              }`}
            >
              Pinyin
            </button>
            <button
              onClick={() => setShowTrans((v) => !v)}
              className={`rounded-lg px-2 py-1 text-xs font-medium ${
                showTrans
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-2 text-muted"
              }`}
            >
              Dịch
            </button>
            <span className="w-9 text-right text-xs font-semibold text-muted">
              {pct}%
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {data.lines.map((l) => (
              <TranscriptLine
                key={l.id}
                line={l}
                active={active === l.index}
                showPinyin={showPinyin}
                showTrans={showTrans}
                onSelect={() => selectLine(l.index, l.startMs)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => router.push("/watch")}>
          Xong
        </Button>
      </div>
    </div>
  );
}
