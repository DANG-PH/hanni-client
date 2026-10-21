"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Icon } from "@/components/icon";
import { parseTemplates, recognize, type Stroke, type Template } from "@/lib/handwriting";

const SIZE = 256; // cạnh ô viết, px CSS

let templatesPromise: Promise<Template[]> | null = null;
/** Tệp mẫu (~500 KB) chỉ tải khi mở ô viết tay lần đầu, dùng chung cho cả phiên. */
function loadTemplates(): Promise<Template[]> {
  templatesPromise ??= fetch("/hanzi-strokes/recog.txt")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    })
    .then(parseTemplates)
    .catch((err: unknown) => {
      templatesPromise = null;
      throw err;
    });
  return templatesPromise;
}

/** Vẽ lại ô viết: ô chữ mễ (米字格) mờ để căn chữ như vở tập viết, rồi các nét đã viết theo màu chữ của giao diện. */
function drawPad(el: HTMLCanvasElement | null, strokes: Stroke[]) {
  const ctx = el?.getContext("2d");
  if (!el || !ctx) return;
  const css = getComputedStyle(el);
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = css.getPropertyValue("--border").trim() || "#e7e9ef";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(SIZE / 2, 0);
  ctx.lineTo(SIZE / 2, SIZE);
  ctx.moveTo(0, SIZE / 2);
  ctx.lineTo(SIZE, SIZE / 2);
  ctx.moveTo(0, 0);
  ctx.lineTo(SIZE, SIZE);
  ctx.moveTo(SIZE, 0);
  ctx.lineTo(0, SIZE);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = css.color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    ctx.beginPath();
    s.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (s.length === 1) ctx.lineTo(s[0][0] + 0.1, s[0][1]);
    ctx.stroke();
  }
}

/**
 * Ô viết tay để tra chữ Hán (2026-10-21) — như bút viết tay ở ô tra của Hanzii. Vẽ bằng ngón tay/chuột, sau mỗi nét
 * gợi ý 8 chữ giống nhất (`lib/handwriting.ts`, chạy ngay trong trình duyệt, không gửi nét đi đâu); bấm một chữ là
 * thêm vào ô tra và xoá ô viết để viết chữ tiếp theo.
 */
export function HandwritingPad({ onPick, onClose }: { onPick: (char: string) => void; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);

  useEffect(() => {
    loadTemplates().then(setTemplates, () => setFailed(true));
  }, []);

  // Viết xong nét đầu trước khi tệp mẫu tải xong thì nhận dạng ngay khi có mẫu.
  useEffect(() => {
    if (templates && strokes.current.length) setCandidates(recognize(templates, strokes.current));
  }, [templates]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = SIZE * dpr;
    el.height = SIZE * dpr;
    el.getContext("2d")?.scale(dpr, dpr);
    drawPad(el, strokes.current);
  }, []);

  function point(e: PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - rect.left) * SIZE) / rect.width, ((e.clientY - rect.top) * SIZE) / rect.height];
  }

  function redraw() {
    drawPad(canvas.current, current.current ? [...strokes.current, current.current] : strokes.current);
  }

  function update(next: Stroke[]) {
    strokes.current = next;
    setStrokeCount(next.length);
    setCandidates(templates && next.length ? recognize(templates, next) : []);
    redraw();
  }

  function pick(char: string) {
    onPick(char);
    update([]);
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Viết chữ Hán để tra</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng ô viết tay"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
        >
          <Icon name="close" size={17} />
        </button>
      </div>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <canvas
          ref={canvas}
          style={{ width: SIZE, height: SIZE }}
          className="shrink-0 touch-none rounded-xl border border-border bg-surface-2/40 text-foreground"
          aria-label="Ô viết: vẽ chữ Hán bằng ngón tay hoặc chuột, từng nét một"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            current.current = [point(e)];
            redraw();
          }}
          onPointerMove={(e) => {
            const s = current.current;
            if (!s) return;
            const p = point(e);
            const last = s[s.length - 1];
            if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
            s.push(p);
            redraw();
          }}
          onPointerUp={() => {
            const s = current.current;
            current.current = null;
            if (s) update([...strokes.current, s]);
          }}
          onPointerCancel={() => {
            current.current = null;
            redraw();
          }}
        />
        <div className="w-full min-w-0 space-y-3">
          <div role="group" aria-label="Chữ gợi ý" className="grid grid-cols-4 gap-2">
            {candidates.length
              ? candidates.map((c) => (
                  <button
                    key={c}
                    type="button"
                    lang="zh"
                    onClick={() => pick(c)}
                    className="hanzi flex h-14 items-center justify-center rounded-xl border border-border bg-surface text-3xl hover:border-primary/50 hover:bg-primary/5"
                  >
                    {c}
                  </button>
                ))
              : Array.from({ length: 8 }, (_, i) => (
                  <span key={i} aria-hidden="true" className="h-14 rounded-xl border border-dashed border-border" />
                ))}
          </div>
          <p className="text-xs leading-5 text-muted">
            {failed
              ? "Chưa tải được dữ liệu nhận dạng — kiểm tra mạng rồi mở lại."
              : !templates && strokeCount
                ? "Đang tải dữ liệu nhận dạng…"
                : "Viết từng nét theo thứ tự, mỗi lần một chữ. Bấm chữ đúng để thêm vào ô tra, rồi bấm nút tra."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!strokeCount}
              onClick={() => update(strokes.current.slice(0, -1))}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="refresh" size={15} /> Xoá nét cuối
            </button>
            <button
              type="button"
              disabled={!strokeCount}
              onClick={() => update([])}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
            >
              <Icon name="close" size={15} /> Viết lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
