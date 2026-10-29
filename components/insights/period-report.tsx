"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Mascot } from "@/components/mascot";
import { PremiumModal } from "@/components/premium-modal";
import { Button, Card, ErrorNote, LinkButton, SectionHeading } from "@/components/ui";
import { useCoach, useInsightsReport } from "@/lib/insights";
import { partInfo, practiceHref, SECTION_SHORT } from "@/lib/mock-exam";
import { usePremiumStatus } from "@/lib/premium";
import type { InsightsPeriod, InsightsReport, PeriodStats } from "@/lib/types";
import { ActivityBars, dayMonth } from "./activity-bars";

const PERIODS: { key: InsightsPeriod; label: string; names: [string, string]; next: string }[] = [
  { key: "week", label: "Tuần", names: ["Tuần này", "Tuần trước"], next: "tuần tới" },
  { key: "month", label: "Tháng", names: ["Tháng này", "Tháng trước"], next: "tháng tới" },
  { key: "quarter", label: "Quý", names: ["Quý này", "Quý trước"], next: "quý tới" },
];

const hasActivity = (s: PeriodStats) => s.daysStudied > 0 || s.reviews > 0 || s.lessons > 0 || s.mockExams.count > 0;
const dayCount = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000) + 1;

/**
 * Báo cáo tuần/tháng/quý ở `/progress`: số liệu + biểu đồ cho mọi người (dữ
 * liệu của chính mình, không khoá), "Hanni Coach" — nhận xét bằng AI, mẹo nhớ
 * từ hay quên theo âm Hán Việt, kế hoạch kỳ tới — là tiện ích Premium. Việc
 * nên làm ngay tính từ số liệu (không qua AI) nên ai cũng có.
 */
export function PeriodReport() {
  const [period, setPeriod] = useState<InsightsPeriod>("week");
  const [offset, setOffset] = useState<0 | 1>(0);
  const { data, error, isLoading, mutate } = useInsightsReport(period, offset);
  const meta = PERIODS.find((p) => p.key === period)!;
  const name = meta.names[offset];

  return (
    <section aria-labelledby="period-report" className="space-y-4">
      <SectionHeading
        id="period-report"
        icon="chart"
        title="Báo cáo học tập"
        description="Nhìn lại một tuần, tháng hoặc quý — so với cùng kỳ trước, kèm việc nên làm tiếp."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Kỳ báo cáo"
          value={period}
          options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
          onChange={(v) => setPeriod(v)}
        />
        <Segmented
          label="Kỳ này hay kỳ trước"
          value={String(offset)}
          options={[
            { value: "0", label: meta.names[0] },
            { value: "1", label: meta.names[1] },
          ]}
          onChange={(v) => setOffset(v === "1" ? 1 : 0)}
        />
        {data && (
          <p className="text-xs text-muted">
            {dayMonth(data.startIso)} – {dayMonth(data.endIso)} · so với {dayMonth(data.prevStartIso)} –{" "}
            {dayMonth(data.prevEndIso)}
          </p>
        )}
      </div>

      {error && !data ? (
        <ErrorNote>
          Chưa tải được báo cáo.{" "}
          <button type="button" onClick={() => void mutate()} className="font-semibold underline">
            Thử lại
          </button>
        </ErrorNote>
      ) : !data ? (
        isLoading && <div className="panel h-72 animate-pulse" />
      ) : (
        <div className={`space-y-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
          <StatsCard report={data} name={name} />
          <CoachCard report={data} name={name} next={meta.next} />
        </div>
      )}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`motion-button min-h-9 rounded-lg px-3.5 text-xs font-semibold ${
            value === o.value ? "bg-surface text-primary shadow-2xs" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, unit, before, hint }: { label: string; value: number; unit?: string; before: number; hint?: ReactNode }) {
  const diff = value - before;
  return (
    <div className="rounded-2xl border border-border bg-surface-2/40 p-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {value.toLocaleString("vi-VN")}
        {unit && <span className="ml-1 text-sm font-semibold text-muted">{unit}</span>}
      </p>
      <p className={`mt-0.5 text-xs font-semibold ${diff > 0 ? "text-good" : diff < 0 ? "text-warn" : "text-muted"}`}>
        {diff === 0 ? "= cùng kỳ trước" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toLocaleString("vi-VN")} so với cùng kỳ`}
      </p>
      {hint && <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

function StatsCard({ report, name }: { report: InsightsReport; name: string }) {
  const c = report.current;
  const p = report.previous;
  const extras = [
    `${c.lessons} bài học xong`,
    c.listening.total > 0 && `Luyện nghe ${c.listening.correct}/${c.listening.total} câu đúng`,
    c.speaking > 0 && `${c.speaking} lượt luyện phát âm`,
    c.mockExams.count > 0 && `${c.mockExams.count} đề thi thử · cao nhất ${c.mockExams.bestPercent}%`,
    `Chuỗi ${report.streak.current} ngày (dài nhất ${report.streak.longest})`,
  ].filter(Boolean) as string[];

  return (
    <Card className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Ngày có học"
          value={c.daysStudied}
          unit="ngày"
          before={p.daysStudied}
          hint={`Trên ${dayCount(report.startIso, report.endIso)} ngày của ${name.toLowerCase()}`}
        />
        <Kpi label="Thời gian học" value={c.minutes} unit="phút" before={p.minutes} />
        <Kpi
          label="Lượt chấm thẻ"
          value={c.reviews}
          before={p.reviews}
          hint={c.retention !== null ? `Nhớ được ${c.retention}% lượt ôn` : undefined}
        />
        <Kpi
          label="Từ mới"
          value={c.newWords}
          before={p.newWords}
          hint={report.familiar.count > 0 ? `${report.familiar.count} từ quen nhờ âm Hán Việt` : undefined}
        />
      </div>
      <ul className="flex flex-wrap gap-2 text-xs">
        {extras.map((x) => (
          <li key={x} className="rounded-full bg-surface-2 px-3 py-1.5 text-muted">
            {x}
          </li>
        ))}
      </ul>
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          Phút học mỗi {report.period === "quarter" ? "tuần" : "ngày"}
        </h3>
        <ActivityBars series={report.series} period={report.period} endIso={report.endIso} />
      </div>
    </Card>
  );
}

/** Việc nên làm tiếp — tính thẳng từ số liệu, không cần AI nên ai cũng có. */
function nextSteps(r: InsightsReport): { href: string; label: string; icon: IconName }[] {
  const steps: { href: string; label: string; icon: IconName }[] = r.weakParts.map((w) => ({
    href: practiceHref(w.level, w.section, w.part),
    label: `Luyện HSK ${w.level} · ${SECTION_SHORT[w.section]} ${w.part}: ${partInfo(w.section, w.type).label}`,
    icon: "target",
  }));
  if (r.dueNow > 0) steps.push({ href: "/study?review=1", label: `Ôn ${r.dueNow} từ đến hạn`, icon: "cards" });
  if (r.leechCount > 0) steps.push({ href: "/study?leeches=1", label: `Ôn riêng ${r.leechCount} từ khó nhớ`, icon: "refresh" });
  steps.push({ href: "/learn", label: "Học bài tiếp theo trong lộ trình", icon: "route" });
  return steps.slice(0, 4);
}

function CoachCard({ report, name, next }: { report: InsightsReport; name: string; next: string }) {
  const active = hasActivity(report.current);
  const canCoach = report.ai.premium && report.ai.enabled && active;
  const coach = useCoach(report.period, report.offset, canCoach);
  const premium = usePremiumStatus();
  const [upgrade, setUpgrade] = useState(false);
  const summary = coach.data?.summary ?? null;
  const tipFor = (zh: string) => summary?.mnemonics.find((t) => t.zh === zh)?.tip;
  const hasTips = report.hardWords.some((w) => tipFor(w.simplified));

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="icon-tile bg-accent/10 text-accent">
          <Icon name="spark" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold">
            Hanni Coach
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">PREMIUM</span>
          </h3>
          <p className="text-xs text-muted">Nhận xét {name.toLowerCase()} bằng AI, dựa trên đúng số liệu của bạn</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="min-w-0">
          {!report.ai.premium ? (
            <div className="rounded-2xl border border-accent/25 bg-accent/5 p-4">
              <p className="text-sm leading-6">
                Hanni Coach đọc số liệu {name.toLowerCase()} rồi viết riêng cho bạn: điều làm tốt, điều cần chú ý, mẹo
                nhớ những từ bạn hay quên theo <strong>âm Hán Việt</strong> và kế hoạch {next} có con số cụ thể.
              </p>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">Ví dụ</p>
              <div aria-hidden className="mt-1 select-none space-y-1.5 rounded-xl bg-surface p-3 text-sm blur-[2.5px]">
                <p>Tuần này bạn học 4/7 ngày, nhiều hơn 2 ngày so với tuần trước, thêm 32 từ mới.</p>
                <p>便宜 (tiện nghi): đồ “tiện nghi” mà giá lại “rẻ” — nhớ ngay nghĩa rẻ.</p>
                <p>Tuần tới: luyện 10 câu nghe ghép tranh, ôn 30 thẻ mỗi ngày.</p>
              </div>
              <Button className="mt-4" onClick={() => setUpgrade(true)} disabled={!premium.data}>
                <Icon name="crown" size={17} /> Mở Hanni Coach với Premium
              </Button>
            </div>
          ) : !report.ai.enabled ? (
            <p className="text-sm text-muted">Hanni Coach đang tạm tắt — số liệu bên trên vẫn đầy đủ.</p>
          ) : !active ? (
            <div className="rounded-2xl bg-surface-2/60 p-4 text-sm leading-6">
              {name} chưa có buổi học nào nên Hanni Coach chưa có gì để nhận xét. Học 1 bài là có ngay số liệu đầu
              tiên.
            </div>
          ) : coach.error ? (
            <ErrorNote>
              Hanni Coach đang bận, chưa viết được nhận xét.{" "}
              <button type="button" onClick={() => void coach.mutate()} className="font-semibold underline">
                Thử lại
              </button>
            </ErrorNote>
          ) : !summary ? (
            <div role="status" className="space-y-3">
              <p className="flex items-center gap-2 text-sm text-muted">
                <Mascot emote="e39-ghi-chu" size={56} priority className="-my-2" />
                Hanni Coach đang đọc số liệu và ghi nhận xét… (khoảng 10–15 giây)
              </p>
              {[92, 80, 86, 60].map((w) => (
                <div key={w} className="h-3 animate-pulse rounded bg-surface-2" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm leading-7">{summary.overview}</p>
              <CoachList title="Làm tốt" icon="check" tone="text-good" items={summary.wins} />
              <CoachList title="Cần chú ý" icon="info" tone="text-warn" items={summary.watch} />
              <div>
                <h4 className="mb-2 text-sm font-semibold">Kế hoạch {next}</h4>
                <ol className="space-y-2">
                  {summary.plan.map((x, i) => (
                    <li key={x} className="flex gap-2.5 text-sm leading-6">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {coach.data?.generatedAt && (
                <p className="text-xs text-muted">
                  Viết lúc{" "}
                  {new Date(coach.data.generatedAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  · AI có thể nhầm — số liệu chính xác ở thẻ bên trên.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-5">
          {report.hardWords.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold">
                {hasTips ? "Mẹo nhớ từ bạn hay quên" : `Từ bạn hay quên ${name.toLowerCase()}`}
              </h4>
              <div className="space-y-2">
                {report.hardWords.map((w) => {
                  const tip = tipFor(w.simplified);
                  return (
                    <Link
                      key={w.id}
                      href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                      className="block rounded-2xl border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="hanzi text-xl">{w.simplified}</span>
                        <span className="text-xs text-muted">{w.pinyin}</span>
                        {w.hanViet && <span className="text-xs font-semibold text-hanviet">{w.hanViet}</span>}
                        <span className="ml-auto text-xs text-muted">quên {w.forgot} lần</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{w.meaningVi}</span>
                      {tip && <span className="mt-1.5 block text-sm leading-6">{tip}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Việc nên làm ngay</h4>
            <div className="grid gap-2">
              {nextSteps(report).map((s) => (
                <LinkButton key={s.href} href={s.href} variant="secondary" className="justify-start! text-left">
                  <Icon name={s.icon} size={16} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">{s.label}</span>
                </LinkButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      {upgrade && premium.data && <PremiumModal plans={premium.data.plans} onClose={() => setUpgrade(false)} />}
    </Card>
  );
}

function CoachList({ title, icon, tone, items }: { title: string; icon: IconName; tone: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x} className="flex gap-2 text-sm leading-6">
            <Icon name={icon} size={16} className={`mt-1 shrink-0 ${tone}`} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
