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
  const [showCaption, setShowCaption] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [readMax, setReadMax] = useState(0);
  const seekRef = useRef<((s: number) => void) | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const savedAt = useRef(0);
  const activeRef = useRef(0);
  const readRef = useRef(0);

  // Máy nhắc chữ: khung tiêu điểm cố định giữa panel, chữ trượt lên qua nó.
  const [vpH, setVpH] = useState(0);
  const [offset, setOffset] = useState(0);
  const [frame, setFrame] = useState({ top: 0, height: 72 });

  const times = useMemo(
    () => (data ? computeTimes(data.lines) : []),
    [data],
  );

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => setVpH(vp.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [data]);

  // Căn câu đang phát vào khung tiêu điểm (giữa panel).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !vpH) return;
    const el = track.querySelector<HTMLElement>(
      `[data-idx="${active ?? 1}"]`,
    );
    if (!el) return;
    const center = el.offsetTop + el.offsetHeight / 2;
    setOffset(Math.max(0, center - vpH / 2));
    setFrame({ top: vpH / 2 - el.offsetHeight / 2, height: el.offsetHeight });
  }, [active, vpH, showPinyin, showTrans, data]);

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
    (lineIndex: number) => {
      if (lineIndex === activeRef.current) return;
      activeRef.current = lineIndex;
      setActive(lineIndex);
      const nextRead = Math.max(readRef.current, lineIndex);
      readRef.current = nextRead;
      setReadMax(nextRead);
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
      if (idx >= 0) goToLine(idx + 1);
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
  const realSync = data.lines.some((l) => l.startMs != null);
  const resumeAt = data.progress.lastLineIndex;

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
          <span
            className={`rounded-md px-2 py-0.5 text-xs ${
              realSync
                ? "bg-good/10 text-good"
                : "bg-surface-2 text-muted"
            }`}
          >
            {realSync ? "Đồng bộ theo lời nói" : "Thời gian ước lượng"}
          </span>
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
            {/* Overlay đặt cao hơn thanh điều khiển YouTube (~48px) để không che nút tua. */}
            {showCaption && activeLine && (
              <div className="pointer-events-none absolute inset-x-4 bottom-16 z-10 rounded-lg bg-black/65 px-3 py-2 text-center">
                <p className="hanzi text-base leading-snug text-white sm:text-lg">
                  {activeLine.zh}
                </p>
                {showTrans && activeLine.vi && (
                  <p className="mt-0.5 text-xs text-white/80">{activeLine.vi}</p>
                )}
              </div>
            )}
          </div>
          {data.description && (
            <p className="text-sm leading-6 text-muted">{data.description}</p>
          )}
        </div>

        <div className="panel flex h-[62vh] flex-col overflow-hidden lg:h-[72vh]">
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
              onClick={() => setShowCaption((v) => !v)}
              className={chip(showCaption)}
              title="Hiện phụ đề đè lên video"
            >
              Phụ đề video
            </button>
            <span className="ml-auto w-9 text-right text-xs font-semibold text-muted">
              {pct}%
            </span>
          </div>

          <div ref={viewportRef} className="relative flex-1 overflow-hidden">
            {resumeAt > 1 &&
              resumeAt < data.sentenceCount &&
              active === null && (
                <div className="absolute inset-x-0 top-3 z-20 flex justify-center">
                  <button
                    onClick={() => selectLine(resumeAt)}
                    className="motion-button rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-fg shadow-lg"
                  >
                    <Icon name="play" size={13} className="-ml-0.5 mr-1 inline" />
                    Tiếp tục từ câu {resumeAt}
                  </button>
                </div>
              )}
            {/* Khung tiêu điểm cố định — chữ trượt vào đây, khung không di chuyển. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 z-0 rounded-xl border border-primary/25 bg-primary/[0.06] transition-all duration-300"
              style={{ top: frame.top, height: frame.height }}
            />
            <div
              ref={trackRef}
              className="relative z-10 will-change-transform"
              style={{
                transform: `translateY(${-offset}px)`,
                transition: "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div style={{ height: vpH / 2 }} />
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
              <div style={{ height: vpH / 2 }} />
            </div>
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
