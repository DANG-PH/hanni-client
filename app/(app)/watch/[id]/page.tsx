"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { TranscriptLine } from "@/components/transcript-line";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { YoutubePlayer } from "@/components/youtube-player";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useVideo } from "@/lib/hooks";
import { hskBand } from "@/lib/hsk";
import type { VideoLine } from "@/lib/types";

/**
 * Thời điểm bắt đầu (giây) mỗi câu.
 * - Nếu bản chép có mốc `startMs` → dùng đúng (chuẩn tuyệt đối).
 * - Nếu không → ước lượng theo NHỊP ĐỌC (chữ/giây) + khoảng nghỉ, KHÔNG kéo giãn
 *   theo độ dài video. Highlight chạy đều đặn ~3–5s/câu; sau khi hết bản chép mẫu
 *   thì dừng ở câu cuối. Chỉ gần đúng, có thể lệch với lời nói thật.
 */
const LEAD_IN = 1.2; // giây chờ phần mở đầu video
const CHARS_PER_SEC = 3.2; // nhịp đọc chậm kiểu học tiếng
const GAP = 0.6; // nghỉ giữa hai câu

function computeTimes(lines: VideoLine[]): number[] {
  if (lines.some((l) => l.startMs != null)) {
    let last = 0;
    return lines.map((l) => {
      if (l.startMs != null) last = l.startMs / 1000;
      return last;
    });
  }
  let acc = LEAD_IN;
  return lines.map((l) => {
    const start = acc;
    const chars = Math.max(
      2,
      Array.from(l.zh.replace(/[，。、！？：；…·\s]/g, "")).length,
    );
    acc += chars / CHARS_PER_SEC + GAP;
    return start;
  });
}

export default function WatchDetailPage() {
  const { user, loading } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useVideo(id);

  const [showPinyin, setShowPinyin] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [showCaption, setShowCaption] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [readMax, setReadMax] = useState(0);
  const seekRef = useRef<((s: number) => void) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const savedAt = useRef(0);
  const activeRef = useRef(0);
  const readRef = useRef(0);
  const autoScrollRef = useRef(true);
  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  const times = useMemo(
    () => (data ? computeTimes(data.lines) : []),
    [data],
  );

  const saveProgress = useCallback(
    (index: number, read: number, force = false) => {
      const now = Date.now();
      if (!force && now - savedAt.current < 2500) return;
      savedAt.current = now;
      void api
        .patch(`/videos/${id}/progress`, {
          lastLineIndex: index,
          linesRead: read,
        })
        .catch(() => undefined);
    },
    [id],
  );

  const goToLine = useCallback(
    (lineIndex: number, scroll: boolean) => {
      if (lineIndex === activeRef.current) return;
      activeRef.current = lineIndex;
      setActive(lineIndex);
      const nextRead = Math.max(readRef.current, lineIndex);
      readRef.current = nextRead;
      setReadMax(nextRead);
      if (scroll) {
        panelRef.current
          ?.querySelector(`[data-idx="${lineIndex}"]`)
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      saveProgress(lineIndex, nextRead);
    },
    [saveProgress],
  );

  const onTick = useCallback(
    (t: number) => {
      if (!times.length) return;
      let idx = -1;
      for (let i = 0; i < times.length; i += 1) {
        if (times[i] <= t + 0.2) idx = i;
        else break;
      }
      if (idx >= 0) goToLine(idx + 1, autoScrollRef.current);
    },
    [times, goToLine],
  );

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
  const activeLine = active ? data.lines.find((l) => l.index === active) : null;

  function selectLine(index: number) {
    const t = times[index - 1];
    if (Number.isFinite(t)) seekRef.current?.(t);
    readRef.current = Math.max(readRef.current, read, index);
    activeRef.current = index;
    setActive(index);
    setReadMax(readRef.current);
    saveProgress(index, readRef.current, true);
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
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          {data.hskLevel && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                hskBand(data.hskLevel).tone
              }`}
            >
              HSK {data.hskLevel} · {hskBand(data.hskLevel).label}
            </span>
          )}
          <span>{data.sentenceCount} câu</span>
          {data.author && <span>· {data.author}</span>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          <div className="relative">
            <YoutubePlayer
              youtubeId={data.youtubeId}
              seekRef={seekRef}
              onTick={onTick}
            />
            {showCaption && activeLine && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-xl bg-black/70 px-4 py-2.5 text-center backdrop-blur-sm">
                <p className="hanzi text-lg leading-snug text-white sm:text-xl">
                  {activeLine.zh}
                </p>
                {showTrans && activeLine.vi && (
                  <p className="mt-0.5 text-xs text-white/80 sm:text-sm">
                    {activeLine.vi}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              onClick={() => setShowCaption((v) => !v)}
              className={chip(showCaption)}
            >
              Phụ đề trên video
            </button>
          </div>
          {data.description && (
            <p className="text-sm leading-6 text-muted">{data.description}</p>
          )}
        </div>

        <div className="panel flex max-h-[72vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <span className="text-xs font-bold tracking-wide">BẢN CHÉP</span>
            <button
              onClick={() => setShowPinyin((v) => !v)}
              className={chip(showPinyin)}
            >
              Pinyin
            </button>
            <button
              onClick={() => setShowTrans((v) => !v)}
              className={chip(showTrans)}
            >
              Dịch
            </button>
            <button
              onClick={() => setAutoScroll((v) => !v)}
              className={chip(autoScroll)}
              title="Tự cuộn theo lời nói"
            >
              Tự cuộn
            </button>
            <span className="ml-auto w-9 text-right text-xs font-semibold text-muted">
              {pct}%
            </span>
          </div>
          <div ref={panelRef} className="flex-1 space-y-1 overflow-y-auto p-2">
            {data.lines.map((l) => (
              <TranscriptLine
                key={l.id}
                line={l}
                active={active === l.index}
                showPinyin={showPinyin}
                showTrans={showTrans}
                onSelect={() => selectLine(l.index)}
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

function chip(on: boolean): string {
  return `rounded-lg px-2 py-1 text-xs font-medium ${
    on ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted"
  }`;
}
