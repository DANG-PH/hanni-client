"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommentSection } from "@/components/comment-section";
import { Icon } from "@/components/icon";
import { MobileVideoTranscript } from "@/components/mobile-video-transcript";
import { TranscriptLine } from "@/components/transcript-line";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { VideoLikeButton } from "@/components/video-like-button";
import { YoutubePlayer } from "@/components/youtube-player";
import styles from "@/components/video-learning.module.css";
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
  const { data, isLoading, error, mutate } = useVideo(id);

  const [showPinyin, setShowPinyin] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [readMax, setReadMax] = useState(0);
  const seekRef = useRef<((s: number) => void) | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
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

  // Đổi tiêu đề tab trình duyệt theo tên video đang xem.
  useEffect(() => {
    if (!data) return;
    const prev = document.title;
    document.title = `${data.title} · Hanni`;
    return () => {
      document.title = prev;
    };
  }, [data]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => setVpH(vp.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [data]);

  // Keep the mobile controls within the available screen space, including
  // before the title has scrolled away. Grow the transcript as the video pins.
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    let frameId = 0;
    const measure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        workspace.style.setProperty(
          "--watch-top",
          `${Math.max(72, workspace.getBoundingClientRect().top)}px`,
        );
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
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
    <div className="page-wrap max-w-none! space-y-3 max-lg:px-3 max-lg:py-3 lg:space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/watch" className="inline-flex min-h-11 items-center gap-2 hover:text-primary lg:min-h-0">
          <Icon name="back" size={16} className="lg:hidden" />
          Học qua video
        </Link>
        <Icon name="chevron" size={14} className="hidden lg:block" />
        <span className="hidden font-medium text-foreground lg:inline">{data.title}</span>
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold max-lg:min-w-0 max-lg:flex-1 max-lg:text-base max-lg:leading-snug">
            {data.title}
            {data.titleZh && (
              <span className="hanzi ml-3 hidden text-lg font-normal text-muted lg:inline">
                {data.titleZh}
              </span>
            )}
          </h1>
          <VideoLikeButton
            videoId={id}
            liked={data.likedByMe}
            count={data.likeCount}
            onChange={(likedByMe, likeCount) =>
              void mutate({ ...data, likedByMe, likeCount }, { revalidate: false })
            }
          />
        </div>
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
          {data.author && <span className="hidden lg:inline">· {data.author}</span>}
          <span className="hidden items-center gap-1 lg:flex">
            <Icon name="message" size={13} />
            {data.commentCount} bình luận
          </span>
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

      <div ref={workspaceRef} className={`${styles.workspace} grid lg:grid-cols-[1.3fr_1fr] lg:gap-5`}>
        <div className="max-lg:contents lg:space-y-3">
          {/* On mobile, display:contents lets the player stay sticky across the
              whole learning area instead of stopping at the description. */}
          <div className="sticky top-[72px] z-20 self-start bg-background lg:static lg:z-auto lg:bg-transparent">
            <div className="relative max-lg:[&>div:first-child]:rounded-b-none">
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
          </div>
          {data.description && (
            <p className="hidden text-sm leading-6 text-muted lg:block">{data.description}</p>
          )}
        </div>

        <MobileVideoTranscript
          key={id}
          lines={data.lines}
          active={active}
          progress={pct}
          resumeAt={resumeAt}
          showPinyin={showPinyin}
          showTrans={showTrans}
          showCaption={showCaption}
          onTogglePinyin={() => setShowPinyin((v) => !v)}
          onToggleTrans={() => setShowTrans((v) => !v)}
          onToggleCaption={() => setShowCaption((v) => !v)}
          onSelect={selectLine}
        />

        <div className="panel hidden h-[72vh] flex-col overflow-hidden lg:flex">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <span className="text-xs font-bold tracking-wide">BẢN CHÉP</span>
            <button
              aria-pressed={showPinyin}
              onClick={() => setShowPinyin((v) => !v)}
              className={chip(showPinyin)}
            >
              Pinyin
            </button>
            <button
              aria-pressed={showTrans}
              onClick={() => setShowTrans((v) => !v)}
              className={chip(showTrans)}
            >
              Dịch
            </button>
            <button
              aria-pressed={showCaption}
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

      {data.description && (
        <details className="group rounded-xl border border-border bg-surface px-4 lg:hidden">
          <summary className="flex min-h-12 items-center justify-between gap-3 text-sm font-semibold">
            Giới thiệu video
            <Icon name="chevron" size={16} className="rotate-90 transition-transform group-open:rotate-270" />
          </summary>
          <p className="whitespace-pre-line break-words pb-4 text-sm leading-6 text-muted">{data.description}</p>
        </details>
      )}

      <CommentSection videoId={id} />

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
