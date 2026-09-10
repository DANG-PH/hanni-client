"use client";

import { Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useAchievements } from "@/lib/hooks";

const CAT_VI: Record<string, string> = {
  STREAK: "Chuỗi ngày",
  LEVEL: "Cấp độ",
  VOLUME: "Số lượng",
  ACCURACY: "Độ chính xác",
  MILESTONE: "Cột mốc",
};

export default function AchievementsPage() {
  const { user, loading } = useRequireAuth();
  const { data, isLoading } = useAchievements();

  if (loading || !user || isLoading || !data) return <Spinner />;

  const unlocked = data.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Huy hiệu</h1>
        <p className="text-muted">
          Đã mở khoá {unlocked}/{data.length}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl border p-4 ${
              a.unlocked
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-surface opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{a.unlocked ? "🏅" : "🔒"}</span>
              <span className="text-xs text-muted">
                {CAT_VI[a.category] ?? a.category}
              </span>
            </div>
            <div className="mt-2 font-medium">{a.nameVi}</div>
            <div className="text-sm text-muted">{a.descriptionVi}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
