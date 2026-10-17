"use client";

import { useState, type KeyboardEvent } from "react";
import type { InsightsPeriod, InsightsReport } from "@/lib/types";

type Point = InsightsReport["series"][number];

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WEEKDAY_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const dateOf = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const dayMonth = (iso: string) => {
  const d = dateOf(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

/** Đỉnh trục y là số tròn để đọc nhanh (0 · nửa · đỉnh). */
function niceTop(max: number) {
  const steps = [10, 20, 30, 40, 60, 90, 120, 180, 240, 300, 420, 600, 900];
  return steps.find((s) => s >= max) ?? Math.ceil(max / 300) * 300;
}

/**
 * Cột "phút học" của 1 kỳ (tuần/tháng: mỗi ngày 1 cột, quý: mỗi 7 ngày).
 * Một chuỗi số liệu nên không có chú thích màu — tiêu đề đã nói cột là gì.
 * Màu `--chart-bar` đã qua bộ kiểm màu cho cả nền sáng lẫn tối. Chú giải hiện
 * khi rê chuột/chạm cột hoặc dùng phím mũi tên khi biểu đồ được focus; số
 * liệu từng cột có ở bảng bên dưới (không phải rê chuột mới đọc được).
 */
export function ActivityBars({
  series,
  period,
  endIso,
}: {
  series: Point[];
  period: InsightsPeriod;
  /** Ngày cuối đã tính (hôm nay với kỳ hiện tại) — cột sau đó là ngày chưa tới. */
  endIso: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceTop(Math.max(0, ...series.map((p) => p.minutes)));
  const peak = series.reduce((best, p, i) => (p.minutes > (series[best]?.minutes ?? 0) ? i : best), -1);
  const lastPast = series.reduce((last, p, i) => (p.startIso <= endIso ? i : last), 0);

  const describe = (p: Point) =>
    period === "quarter"
      ? `${dayMonth(p.startIso)} – ${dayMonth(p.endIso)}`
      : `${WEEKDAY_LONG[dateOf(p.startIso).getUTCDay()]} ${dayMonth(p.startIso)}`;
  const tick = (p: Point, i: number) => {
    if (period === "week") return WEEKDAY[dateOf(p.startIso).getUTCDay()];
    if (period === "month") {
      const d = dateOf(p.startIso).getUTCDate();
      return d === 1 || d % 5 === 0 ? String(d) : "";
    }
    return i % 3 === 0 ? dayMonth(p.startIso) : "";
  };
  const summary = (p: Point) =>
    p.startIso > endIso ? `${describe(p)}: chưa tới` : `${describe(p)}: ${p.minutes} phút, ${p.reviews} lượt chấm thẻ`;

  function onKey(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? -1 : 1;
    setActive((a) => Math.min(series.length - 1, Math.max(0, (a ?? lastPast) + step)));
  }

  const point = active === null ? null : series[active];
  const left = active === null ? 0 : ((active + 0.5) / series.length) * 100;

  return (
    <figure className="space-y-2">
      <div className="flex">
        <div aria-hidden className="relative h-40 w-9 shrink-0 text-[10px] tabular-nums text-muted">
          <span className="absolute right-2 top-0 -translate-y-1/2">{top}</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{top / 2}</span>
          <span className="absolute right-2 bottom-0 translate-y-1/2">0</span>
        </div>
        <div
          role="group"
          tabIndex={0}
          aria-label="Biểu đồ phút học — dùng phím mũi tên trái/phải để xem từng cột"
          onKeyDown={onKey}
          onFocus={() => setActive((a) => a ?? lastPast)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
          className="relative h-40 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div aria-hidden className="absolute inset-x-0 top-0 border-t border-border" />
          <div aria-hidden className="absolute inset-x-0 top-1/2 border-t border-border" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 border-t border-border" />
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {series.map((p, i) => {
              const h = (p.minutes / top) * 100;
              return (
                <div
                  key={p.startIso}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                  className="relative flex h-full flex-1 items-end justify-center"
                >
                  {p.minutes > 0 && (
                    <span
                      className={`w-full max-w-6 rounded-t-[4px] bg-(--chart-bar) transition-opacity ${
                        active !== null && active !== i ? "opacity-55" : ""
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  )}
                  {i === peak && p.minutes > 0 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute text-[10px] font-semibold tabular-nums text-foreground"
                      style={{ bottom: `calc(${h}% + 2px)` }}
                    >
                      {p.minutes}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {point && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-1 z-10 w-max max-w-44 rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg"
              style={{
                left: `${left}%`,
                transform: `translateX(${left < 18 ? "0" : left > 82 ? "-100%" : "-50%"})`,
              }}
            >
              {point.startIso > endIso ? (
                <p className="font-semibold text-muted">Chưa tới</p>
              ) : (
                <>
                  <p className="text-sm font-bold">{point.minutes} phút</p>
                  <p className="text-muted">{point.reviews} lượt chấm thẻ</p>
                </>
              )}
              <p className="text-muted">{describe(point)}</p>
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="ml-9 flex gap-[2px] text-[10px] text-muted">
        {series.map((p, i) => (
          <span
            key={p.startIso}
            className={`flex-1 overflow-visible whitespace-nowrap text-center ${
              i === lastPast && period !== "quarter" ? "font-bold text-foreground" : ""
            }`}
          >
            {tick(p, i)}
          </span>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {point ? summary(point) : ""}
      </p>
      <details className="ml-9 text-xs">
        <summary className="cursor-pointer font-semibold text-muted hover:text-foreground">Xem bảng số liệu</summary>
        <table className="mt-2 w-full max-w-sm text-left tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">{period === "quarter" ? "Tuần" : "Ngày"}</th>
              <th className="py-1 text-right font-medium">Phút học</th>
              <th className="py-1 text-right font-medium">Lượt chấm thẻ</th>
            </tr>
          </thead>
          <tbody>
            {series
              .filter((p) => p.startIso <= endIso)
              .map((p) => (
                <tr key={p.startIso} className="border-t border-border">
                  <td className="py-1">{describe(p)}</td>
                  <td className="py-1 text-right">{p.minutes}</td>
                  <td className="py-1 text-right">{p.reviews}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
