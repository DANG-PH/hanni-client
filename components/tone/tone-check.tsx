"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { TONE_CLASS } from "@/components/tone-pinyin";
import { mediaUrl } from "@/lib/api";
import { markToneTried } from "@/lib/getting-started";
import { stopListening } from "@/lib/listening-audio";
import { TONES } from "@/lib/pinyin";
import {
  decodeAudio,
  guessTone,
  POINTS,
  scoreSyllables,
  surfaceTones,
  syllableContours,
  toneTemplate,
  type SyllableContour,
  type Tone,
} from "@/lib/pitch";

/** Chấm được khi pinyin số tách được từng âm tiết (bỏ 有（一）点儿 "youyidianr"…), tối đa 4. */
export function canToneCheck(pinyinNumeric: string): boolean {
  const syl = pinyinNumeric.trim().split(/\s+/);
  return syl.length <= 4 && syl.every((s) => /^[a-zü:]+[1-5]$/i.test(s));
}

interface Result {
  user: SyllableContour[];
  ref: ((number | null)[] | null)[];
  hasNative: boolean;
  tones: Tone[];
  scores: (number | null)[];
  guesses: (Tone | null)[];
  overall: number | null;
}

const nativeCache = new Map<string, Promise<SyllableContour[] | null>>();
function nativeContours(url: string | null, n: number): Promise<SyllableContour[] | null> {
  if (!url) return Promise.resolve(null);
  const key = `${url}#${n}`;
  if (!nativeCache.has(key))
    nativeCache.set(
      key,
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then(decodeAudio)
        .then(({ x, sr }) => syllableContours(x, sr, n))
        .catch(() => {
          nativeCache.delete(key);
          return null;
        }),
    );
  return nativeCache.get(key)!;
}

async function analyze(blob: Blob, hanzi: string, pinyinNumeric: string, audioUrl: string | null): Promise<Result | null> {
  const n = pinyinNumeric.trim().split(/\s+/).length;
  const [{ x, sr }, native] = await Promise.all([blob.arrayBuffer().then(decodeAudio), nativeContours(mediaUrl(audioUrl), n)]);
  const user = syllableContours(x, sr, n);
  if (!user || user.every((s) => !s.st)) return null;
  const tones = surfaceTones(hanzi, pinyinNumeric);
  const scores = scoreSyllables(user, native, tones);
  const known = scores.filter((s): s is number => s !== null);
  return {
    user,
    ref: native ? native.map((s) => s.st) : tones.map((t) => toneTemplate(t)),
    hasNative: !!native,
    tones,
    scores,
    guesses: user.map((s, i) => (s.st && tones[i] !== 5 ? guessTone(s.st) : null)),
    overall: known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null,
  };
}

function verdict(score: number | null): { label: string; cls: string } {
  if (score === null) return { label: "Chưa chấm được", cls: "text-muted" };
  if (score >= 85) return { label: "Chuẩn rồi!", cls: "text-good" };
  if (score >= 65) return { label: "Khá ổn", cls: "text-accent" };
  return { label: "Cần luyện thêm", cls: "text-danger" };
}

function syllableNote(tone: Tone, written: Tone, score: number | null, guess: Tone | null): string {
  if (tone === 5) return "Thanh nhẹ — đọc ngắn và nhẹ.";
  // 你好: viết nǐ (thanh 3) nhưng đọc thanh 2 — nói rõ, kẻo người học tưởng chấm nhầm.
  const sandhi = written !== tone ? `Biến điệu: viết thanh ${written}, đọc thành thanh ${tone}. ` : "";
  if (score === null) return `${sandhi}Chưa nghe rõ âm tiết này.`;
  const t = TONES[tone - 1];
  if (score >= 75) return `${sandhi}Đúng thanh ${tone}.`;
  if (guess && guess !== tone) return `${sandhi}Nghe giống thanh ${guess}. ${t.name}: ${t.desc} ${t.vi}`;
  return `${sandhi}Gần đúng — ${t.desc.charAt(0).toLowerCase()}${t.desc.slice(1)}`;
}

/** Biểu đồ đường cao độ: giọng chuẩn (nét đứt, xám) và giọng bạn (đỏ), mỗi âm tiết 1 ô. */
function ToneChart({ result, labels }: { result: Result; labels: string[] }) {
  const n = result.user.length;
  const W = 300 * n;
  const H = 150;
  const PAD = 14;
  const values = [...result.user.flatMap((s) => s.st ?? []), ...result.ref.flatMap((r) => r ?? [])].filter((v): v is number => v !== null);
  let lo = Math.min(...values, -4);
  let hi = Math.max(...values, 4);
  const mid = (lo + hi) / 2;
  if (hi - lo < 10) [lo, hi] = [mid - 5, mid + 5];
  const y = (v: number) => PAD + ((hi - v) / (hi - lo)) * (H - 2 * PAD);
  const slot = W / n;
  const path = (pts: (number | null)[] | null, i: number) => {
    if (!pts) return "";
    let d = "";
    let pen = false;
    pts.forEach((v, k) => {
      if (v === null) {
        pen = false;
        return;
      }
      const x = i * slot + 18 + (k / (POINTS - 1)) * (slot - 36);
      d += `${pen ? "L" : "M"}${x.toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Đường cao độ giọng chuẩn và giọng bạn theo từng âm tiết">
        {Array.from({ length: n - 1 }, (_, i) => (
          <line key={i} x1={(i + 1) * slot} x2={(i + 1) * slot} y1={6} y2={H - 6} stroke="var(--border)" strokeDasharray="3 4" />
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        {result.ref.map((r, i) => (
          <path key={`r${i}`} d={path(r, i)} fill="none" stroke="var(--muted)" strokeWidth={2.5} strokeDasharray="6 5" strokeLinecap="round" opacity={0.75} />
        ))}
        {result.user.map((u, i) => (
          <path key={`u${i}`} d={path(u.st, i)} fill="none" stroke="var(--primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <div className="flex">
        {labels.map((l, i) => (
          <span key={i} className={`flex-1 text-center text-sm font-semibold ${TONE_CLASS[String(result.tones[i])] ?? ""}`}>
            {l}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden="true"><line x1="1" x2="21" y1="3" y2="3" stroke="var(--muted)" strokeWidth="2.5" strokeDasharray="6 5" /></svg>
          {result.hasNative ? "Giọng chuẩn" : "Hình mẫu của thanh"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden="true"><line x1="1" x2="21" y1="3" y2="3" stroke="var(--primary)" strokeWidth="3" /></svg>
          Giọng bạn
        </span>
        <span>· càng cao trên hình là giọng càng cao</span>
      </figcaption>
    </figure>
  );
}

/** Kết quả chấm 1 bản ghi (dùng chung cho nút "Đọc thử" và trang luyện phát âm). */
export function ToneResultView({
  result,
  pinyin,
  pinyinNumeric,
  audioUrl,
  recordingUrl,
}: {
  result: Result;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
  recordingUrl: string | null;
}) {
  const parts = pinyin.trim().split(/\s+/);
  const numeric = pinyinNumeric.trim().split(/\s+/);
  const labels = parts.length === result.user.length ? parts : numeric;
  const written = numeric.map((s) => Number(/[1-5]$/.exec(s)?.[0] ?? 5) as Tone);
  const v = verdict(result.overall);
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="whitespace-nowrap text-sm font-semibold">Chấm thanh điệu</p>
        <p className="flex items-baseline gap-2 whitespace-nowrap">
          {result.overall !== null && <span className="text-2xl font-bold tabular-nums">{result.overall}</span>}
          <span className={`text-sm font-semibold ${v.cls}`}>{v.label}</span>
        </p>
      </div>
      <ToneChart result={result} labels={labels} />
      <ul className="mt-3 space-y-1.5">
        {result.tones.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-6">
            <span className={`w-14 shrink-0 font-semibold ${TONE_CLASS[String(t)] ?? ""}`}>{labels[i]}</span>
            <span className="min-w-0 flex-1 text-muted">{syllableNote(t, written[i] ?? t, result.scores[i], result.guesses[i])}</span>
            {result.scores[i] !== null && <span className="shrink-0 font-semibold tabular-nums">{result.scores[i]}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {audioUrl && (
          <button type="button" onClick={() => void new Audio(mediaUrl(audioUrl)!).play().catch(() => undefined)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-xs font-semibold hover:text-primary">
            <Icon name="sound" size={14} /> Nghe mẫu
          </button>
        )}
        {recordingUrl && (
          <button type="button" onClick={() => void new Audio(recordingUrl).play().catch(() => undefined)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-xs font-semibold hover:text-primary">
            <Icon name="play" size={14} /> Nghe lại giọng bạn
          </button>
        )}
      </div>
    </div>
  );
}

/** Chấm bản ghi có sẵn (trang luyện phát âm tự ghi âm, ở đây chỉ phân tích). */
export function ToneAnalysis({
  recordingUrl,
  hanzi,
  pinyin,
  pinyinNumeric,
  audioUrl,
}: {
  recordingUrl: string;
  hanzi: string;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
}) {
  const [state, setState] = useState<{ url: string; result: Result | null } | null>(null);
  useEffect(() => {
    if (!canToneCheck(pinyinNumeric)) return;
    let alive = true;
    fetch(recordingUrl)
      .then((r) => r.blob())
      .then((blob) => analyze(blob, hanzi, pinyinNumeric, audioUrl))
      .then((result) => alive && setState({ url: recordingUrl, result }))
      .catch(() => alive && setState({ url: recordingUrl, result: null }));
    return () => {
      alive = false;
    };
  }, [recordingUrl, hanzi, pinyinNumeric, audioUrl]);
  if (!canToneCheck(pinyinNumeric)) return null;
  if (!state || state.url !== recordingUrl) return <p className="text-xs text-muted">Đang chấm thanh điệu…</p>;
  if (!state.result) return <p className="text-xs text-muted">Chưa nghe rõ giọng để chấm thanh điệu — nói to, gần micro hơn nhé.</p>;
  return <ToneResultView result={state.result} pinyin={pinyin} pinyinNumeric={pinyinNumeric} audioUrl={audioUrl} recordingUrl={recordingUrl} />;
}

type Phase = "idle" | "recording" | "analyzing" | "done" | "error";

/**
 * "Đọc thử" — ghi âm 1 từ, tự dừng khi nói xong, vẽ đường cao độ giọng bạn chồng lên giọng
 * chuẩn và chấm từng âm tiết (xem `lib/pitch.ts`). Phân tích ngay trên máy: giọng không gửi
 * đi đâu, không cần tài khoản, không tốn lượt AI.
 */
export function ToneCheck({
  hanzi,
  pinyin,
  pinyinNumeric,
  audioUrl,
  align = "center",
  className = "",
}: {
  hanzi: string;
  pinyin: string;
  pinyinNumeric: string;
  audioUrl: string | null;
  align?: "center" | "start";
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const cleanup = useRef<() => void>(() => {});

  useEffect(() => () => cleanup.current(), []);
  useEffect(() => () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  if (!canToneCheck(pinyinNumeric)) return null;
  const n = pinyinNumeric.trim().split(/\s+/).length;

  async function start() {
    if (phase === "recording") {
      stopRef.current();
      return;
    }
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPhase("error");
      setError("Trình duyệt này chưa ghi âm được — thử Chrome, Edge hoặc Safari mới.");
      return;
    }
    stopListening();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (cause) {
      setPhase("error");
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Chưa có quyền dùng micro — cho phép micro cho trang này rồi thử lại."
          : "Không mở được micro. Kiểm tra thiết bị rồi thử lại.",
      );
      return;
    }
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    let raf = 0;
    const t0 = performance.now();
    const maxMs = Math.min(6000, 1600 + 700 * n);
    let noise = 0;
    let spoke = false;
    let quietSince = 0;
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      if (rec.state !== "inactive") rec.stop();
    };
    cleanup.current = () => {
      stop();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => undefined);
    };
    stopRef.current = stop;
    rec.onstop = () => {
      cleanup.current();
      const blob = new Blob(chunks, { type: rec.mimeType });
      if (!blob.size) {
        setPhase("error");
        setError("Chưa thu được âm thanh. Kiểm tra micro rồi thử lại.");
        return;
      }
      setRecordingUrl(URL.createObjectURL(blob));
      setPhase("analyzing");
      analyze(blob, hanzi, pinyinNumeric, audioUrl)
        .then((r) => {
          if (!r) {
            setPhase("error");
            setError("Chưa nghe rõ giọng — nói to, rõ và gần micro hơn nhé.");
            return;
          }
          setResult(r);
          setPhase("done");
          markToneTried();
        })
        .catch(() => {
          setPhase("error");
          setError("Chưa chấm được bản ghi này, thử đọc lại nhé.");
        });
    };
    // Tự dừng: đo ồn nền 150 ms đầu, nói to hơn hẳn mức đó là "đang nói", lặng 0,7 giây sau
    // khi đã nói là xong.
    const loop = () => {
      an.getFloatTimeDomainData(buf);
      let e = 0;
      for (let i = 0; i < buf.length; i++) e += buf[i] * buf[i];
      const rms = Math.sqrt(e / buf.length);
      const now = performance.now() - t0;
      if (now < 150) noise = Math.max(noise, rms);
      const speech = Math.max(0.015, noise * 3);
      if (meter.current) meter.current.style.transform = `scaleX(${Math.min(1, rms / (speech * 3))})`;
      if (rms > speech) {
        spoke = true;
        quietSince = 0;
      } else if (spoke && !quietSince) quietSince = now;
      if ((spoke && quietSince && now - quietSince > 700) || now > maxMs) stop();
      else raf = requestAnimationFrame(loop);
    };
    setResult(null);
    setPhase("recording");
    rec.start();
    raf = requestAnimationFrame(loop);
  }

  return (
    <div className={`w-full ${className}`}>
      <button
        type="button"
        onClick={() => void start()}
        disabled={phase === "analyzing"}
        aria-pressed={phase === "recording"}
        className={`motion-button flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${align === "center" ? "mx-auto" : ""} ${
          phase === "recording" ? "bg-primary text-primary-fg" : "border border-border bg-surface hover:border-primary/40 hover:text-primary"
        }`}
      >
        <Icon name="mic" size={17} />
        {phase === "recording"
          ? "Đang nghe… (bấm để dừng)"
          : phase === "analyzing"
            ? "Đang chấm…"
            : result
              ? "Đọc lại"
              : "Đọc thử — chấm thanh điệu"}
      </button>
      {phase === "recording" && (
        <span className={`mt-2 block h-1.5 w-40 overflow-hidden rounded-full bg-surface-2 ${align === "center" ? "mx-auto" : ""}`} aria-hidden="true">
          <span ref={meter} className="block h-full origin-left rounded-full bg-primary transition-transform duration-75" style={{ transform: "scaleX(0)" }} />
        </span>
      )}
      {phase === "error" && <p className={`mt-2 text-xs text-danger ${align === "center" ? "text-center" : ""}`}>{error}</p>}
      {result && phase !== "recording" && (
        <div className="mt-3">
          <ToneResultView result={result} pinyin={pinyin} pinyinNumeric={pinyinNumeric} audioUrl={audioUrl} recordingUrl={recordingUrl} />
        </div>
      )}
      {phase === "idle" && !result && (
        <p className={`mt-1.5 text-xs text-muted ${align === "center" ? "text-center" : ""}`}>Giọng bạn được phân tích ngay trên máy, không gửi đi đâu.</p>
      )}
    </div>
  );
}
