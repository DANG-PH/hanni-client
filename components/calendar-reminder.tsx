"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Card } from "@/components/ui";

const pad = (n: number) => String(n).padStart(2, "0");
/** Giờ "trôi" (không múi giờ, không Z): lịch hiểu là giờ địa phương của máy — đúng ý "8 giờ tối mỗi ngày". */
const floating = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function nextStart(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/**
 * Lịch học hằng ngày trên Google Calendar / lịch iPhone, Outlook (.ics) — 2026-10-19. Trên iPhone,
 * thông báo đẩy chỉ chạy khi đã thêm Hanni vào màn hình chính; nhắc bằng lịch của máy thì luôn chạy.
 */
export function CalendarReminder({ defaultHour, minutes }: { defaultHour: number | null; minutes: number }) {
  const [hour, setHour] = useState(defaultHour ?? 20);
  const site = typeof window !== "undefined" ? window.location.origin : "https://hanni.dangpham.id.vn";
  const title = `Học tiếng Trung với Hanni (${minutes} phút)`;
  const details = `Mở Hanni và bấm Học tiếp: ${site}/learn`;

  function google() {
    const start = nextStart(hour);
    const end = new Date(start.getTime() + minutes * 60_000);
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", title);
    url.searchParams.set("details", details);
    url.searchParams.set("dates", `${floating(start)}/${floating(end)}`);
    url.searchParams.set("recur", "RRULE:FREQ=DAILY");
    window.open(url.toString(), "_blank", "noopener");
  }

  function ics() {
    const start = nextStart(hour);
    const end = new Date(start.getTime() + minutes * 60_000);
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hanni//Lich hoc hang ngay//VI",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:hanni-daily-${now.getTime()}@hanni`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${floating(start)}`,
      `DTEND:${floating(end)}`,
      "RRULE:FREQ=DAILY",
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(details)}`,
      `URL:${site}/learn`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs("Đến giờ học tiếng Trung rồi!")}`,
      "TRIGGER:-PT0M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const href = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = "hanni-lich-hoc.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
          <Icon name="calendar" size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">Thêm lịch học vào lịch của bạn</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Một lời nhắc lặp lại mỗi ngày trong Google Calendar, lịch iPhone hay Outlook — vẫn nhắc kể cả khi chưa bật thông báo của
            Hanni.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="text-xs font-medium text-muted">
          Giờ học mỗi ngày
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground sm:w-36"
          >
            {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
              <option key={h} value={h}>
                {pad(h)}:00
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={google}
            className="motion-button inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold shadow-[0_3px_0_0_var(--border)] hover:bg-surface-2"
          >
            <Icon name="calendar" size={16} /> Google Calendar
          </button>
          <button
            type="button"
            onClick={ics}
            className="motion-button inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold shadow-[0_3px_0_0_var(--border)] hover:bg-surface-2"
          >
            <Icon name="download" size={16} /> Lịch iPhone / Outlook (.ics)
          </button>
        </div>
      </div>
    </Card>
  );
}
