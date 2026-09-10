"use client";

import {
  EmptyState,
  ErrorNote,
  PageHeading,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
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
  const { data, isLoading, error, mutate } = useAchievements();
  if (loading || !user) return <Spinner />;
  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;
  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="NHỮNG CỘT MỐC CỦA BẠN"
        title="Bộ sưu tập huy hiệu"
        description="Ghi dấu sự kiên trì và những tiến bộ trên hành trình học tiếng Trung."
      />
      {error ? (
        <ErrorNote>
          Chưa tải được huy hiệu.{" "}
          <button
            onClick={() => void mutate()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-primary/15 bg-primary/5 p-6">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-primary">
              <Icon name="trophy" size={32} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">
                {unlocked
                  ? "Nỗ lực của bạn đang đơm hoa"
                  : "Huy hiệu đầu tiên đang chờ bạn"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Đã mở khóa {unlocked} / {data?.length ?? 0} huy hiệu
              </p>
              <div className="mt-4 max-w-md">
                <ProgressBar
                  value={data?.length ? (unlocked / data.length) * 100 : 0}
                  label="Huy hiệu đã mở khóa"
                />
              </div>
            </div>
          </div>
          {data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((a) => (
                <div
                  key={a.id}
                  className={`panel p-6 ${a.unlocked ? "border-primary/25" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.unlocked ? "bg-primary/8 text-primary" : "bg-surface-2 text-muted"}`}
                    >
                      <Icon name={a.unlocked ? "trophy" : "lock"} size={27} />
                    </span>
                    <span className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-muted">
                      {CAT_VI[a.category] ?? a.category}
                    </span>
                  </div>
                  <h2 className="mt-5 font-semibold">{a.nameVi}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {a.descriptionVi}
                  </p>
                  <div
                    className={`mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-xs ${a.unlocked ? "text-good" : "text-muted"}`}
                  >
                    <Icon name={a.unlocked ? "check" : "lock"} size={14} />
                    {a.unlocked ? "Đã mở khóa" : "Chưa mở khóa"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Bộ sưu tập đang được chuẩn bị"
              description="Các huy hiệu sẽ xuất hiện ở đây khi có dữ liệu. Hãy tiếp tục giữ nhịp học của bạn nhé."
            />
          )}
        </>
      )}
    </div>
  );
}
