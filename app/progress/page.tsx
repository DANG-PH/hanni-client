"use client";

import { ProgressBar, Spinner, Stat } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useProgress } from "@/lib/hooks";

const BAND_VI: Record<string, string> = {
  ELEMENTARY: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Cao cấp",
};

export default function ProgressPage() {
  const { user, loading } = useRequireAuth();
  const { data, isLoading } = useProgress();

  if (loading || !user || isLoading || !data) return <Spinner />;

  const t = data.totals;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">Tiến độ học</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Đã thuộc" value={t.learned} />
        <Stat label="Đang học" value={t.learning} />
        <Stat label="Đến hạn" value={t.due} />
        <Stat label="Sắp quên" value={t.atRisk} />
      </div>

      <div className="space-y-4">
        {data.levels.map((l) => (
          <div
            key={l.level}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="font-semibold">HSK {l.level}</span>{" "}
                <span className="text-sm text-muted">
                  · {BAND_VI[l.band] ?? l.band} · {l.nameVi}
                </span>
              </div>
              <span className="text-sm text-muted">
                {l.learned}/{l.totalWords} ({l.percentComplete}%)
              </span>
            </div>
            <ProgressBar value={l.percentComplete} />
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-4">
              <span>đã thuộc: {l.learned}</span>
              <span>đang học: {l.learning}</span>
              <span>đến hạn: {l.due}</span>
              <span>chưa bắt đầu: {l.notStarted}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
