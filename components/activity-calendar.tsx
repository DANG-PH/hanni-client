import { useStreakHistory } from "@/lib/hooks";
import type { DayActivity } from "@/lib/types";

function toLocalIso(d: Date): string {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 10);
}

/** Ô màu theo mức hoạt động — đậm dần theo số từ ôn, xanh lá khi đạt mục
 * tiêu ngày hôm đó (goalMet), xám khi hoàn toàn không học. */
function cellTone(day: DayActivity | undefined): string {
  if (!day || (day.wordsReviewed === 0 && day.minutesStudied === 0)) {
    return "bg-surface-2";
  }
  if (day.goalMet) return "bg-good";
  if (day.wordsReviewed >= 10 || day.minutesStudied >= 10) return "bg-primary/60";
  return "bg-primary/25";
}

/**
 * Lịch hoạt động 30 ngày gần nhất — dùng GET /streak/history (đã có sẵn ở
 * backend từ lâu nhưng chưa trang nào gọi tới). API chỉ trả về NGÀY CÓ hoạt
 * động (không có bản ghi cho ngày nghỉ), nên phải tự dựng đủ chuỗi 30 ngày
 * rồi khớp theo ISO date để ô ngày nghỉ hiện đúng màu xám.
 */
export function ActivityCalendar({ days = 30 }: { days?: number }) {
  const { data, isLoading } = useStreakHistory(days);
  const byDate = new Map((data ?? []).map((d) => [d.date, d]));

  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const iso = toLocalIso(d);
    return { iso, day: byDate.get(iso) };
  });

  if (isLoading) {
    return <p className="text-sm text-muted">Đang tải lịch hoạt động…</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {cells.map(({ iso, day }) => (
          <span
            key={iso}
            title={`${new Date(iso).toLocaleDateString("vi-VN")}${
              day
                ? ` — ${day.wordsReviewed} từ ôn, ${day.minutesStudied} phút${day.goalMet ? " · Đạt mục tiêu" : ""}`
                : " — Không học"
            }`}
            className={`aspect-square rounded-sm ${cellTone(day)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-surface-2" /> Không học
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/25" /> Có học
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-good" /> Đạt mục tiêu
        </span>
      </div>
    </div>
  );
}
