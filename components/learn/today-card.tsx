"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/ui";
import { useStreak, useStreakHistory, useStudyStats } from "@/lib/hooks";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function localIso(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Dải tuần T2–CN (như Hanbeego, Hanzii, Duolingo): ngày nào đã học trong tuần này. Hôm nay lấy
 * `activeToday` của server (đã tính giờ cắt ngày), các ngày trước lấy lịch sử hoạt động. */
function WeekStrip({ activeToday }: { activeToday: boolean }) {
  const history = useStreakHistory(7);
  const studied = new Set(
    (history.data ?? []).filter((d) => d.date && (d.wordsReviewed > 0 || d.minutesStudied > 0)).map((d) => d.date),
  );
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const todayIso = localIso(today);
  return (
    <ol aria-label="Tuần này" className="mt-4 grid grid-cols-7 gap-1 text-center">
      {WEEKDAYS.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = localIso(d);
        const isToday = iso === todayIso;
        const future = iso > todayIso;
        const done = isToday ? activeToday : studied.has(iso);
        return (
          <li key={label}>
            <span className={`block text-xs font-bold ${isToday ? "text-primary" : "text-muted"}`}>{label}</span>
            <span
              title={future ? "" : done ? "Đã học" : isToday ? "Hôm nay chưa học" : "Không học"}
              className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full ${
                done
                  ? "bg-danger/12 text-danger"
                  : isToday
                    ? "border-2 border-primary"
                    : future
                      ? "border border-dashed border-border"
                      : "bg-surface-2"
              }`}
            >
              {done && <Icon name="flame" size={14} />}
              <span className="sr-only">{future ? "" : done ? "đã học" : "chưa học"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Chuỗi ngày + mục tiêu hôm nay + từ cần ôn — gọn trong 1 thẻ vì đây là 3
 * câu hỏi người học nào cũng có khi mở app: "hôm nay học chưa, đủ chưa, có
 * gì cần ôn không". */
export function TodayCard() {
  const streak = useStreak();
  const stats = useStudyStats();
  const s = streak.data;
  const due = stats.data?.dueNow ?? 0;
  const goalPct = s ? Math.min(100, (s.goal.progress / Math.max(1, s.goal.value)) * 100) : 0;

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            s?.activeToday ? "bg-danger/12 text-danger" : "bg-surface-2 text-muted"
          }`}
        >
          <Icon name="flame" size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-extrabold leading-none">
            {s?.currentStreak ?? 0}
            <span className="ml-1 text-sm font-semibold text-muted">ngày liên tiếp</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {s?.activeToday
              ? "Hôm nay đã học — chuỗi được giữ."
              : "Học 1 bài hôm nay để giữ chuỗi."}
            {s && s.streakFreezeCount > 0 && ` · ${s.streakFreezeCount} lá chắn`}
          </p>
        </div>
      </div>
      {s && <WeekStrip activeToday={s.activeToday} />}
      {s && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold">Mục tiêu hôm nay</span>
            <span className={s.goal.met ? "font-semibold text-good" : "text-muted"}>
              {s.goal.met ? "Đã đạt" : `${Math.floor(s.goal.progress)}/${s.goal.value} ${s.goal.type === "MINUTES" ? "phút" : "từ"}`}
            </span>
          </div>
          <ProgressBar value={goalPct} label="Mục tiêu hôm nay" color={s.goal.met ? "bg-good" : "bg-primary"} />
        </div>
      )}
      <Link
        href={due > 0 ? "/study?review=1" : "/study"}
        className={`motion-button mt-4 flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
          due > 0 ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-surface-2"
        }`}
      >
        <Icon name="cards" size={20} className={due > 0 ? "text-primary" : "text-muted"} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {due > 0 ? `${due} từ cần ôn hôm nay` : "Chưa có từ cần ôn"}
          </span>
          <span className="block text-xs text-muted">
            {due > 0 ? "Ôn đúng lúc sắp quên để nhớ lâu" : "Hanni sẽ nhắc khi đến lúc ôn"}
          </span>
        </span>
        {due > 0 && <Icon name="arrow" size={16} className="text-primary" />}
      </Link>
    </section>
  );
}
