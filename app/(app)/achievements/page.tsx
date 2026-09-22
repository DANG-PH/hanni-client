"use client";

import { useState } from "react";
import {
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { SendToFriendButton } from "@/components/send-to-friend";
import { ShareButton } from "@/components/share-button";
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
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  if (loading || !user) return <Spinner />;
  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;
  // Xếp huy hiệu GẦN ĐẠT NHẤT lên trước (trong nhóm chưa mở khoá): "còn 2
  // lượt ôn nữa là xong" thúc đẩy mạnh hơn hẳn một danh sách theo thứ tự
  // catalog, nơi mốc xa nhất có thể nằm ngay đầu trang và trông vô vọng.
  // Huy hiệu ĐÃ mở khoá xuống dưới — chúng là phần thưởng để ngắm, không
  // phải việc cần làm.
  const ratio = (a: { progressCurrent: number; progressTarget: number }) =>
    a.progressTarget > 0
      ? Math.min(a.progressCurrent, a.progressTarget) / a.progressTarget
      : 0;
  const visible = (
    data?.filter(
      (achievement) =>
        filter === "all" ||
        (filter === "unlocked" ? achievement.unlocked : !achievement.unlocked),
    ) ?? []
  )
    .slice()
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? 1 : -1;
      if (a.unlocked) return 0;
      return ratio(b) - ratio(a);
    });
  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        icon="trophy"
        tone="accent"
        eyebrow="Những cột mốc của bạn"
        title="Bộ sưu tập huy hiệu"
        description="Ghi dấu sự kiên trì và những tiến bộ trên hành trình học tiếng Trung."
      >
        <LinkButton href="/learn" variant="secondary">
          Tiếp tục học <Icon name="arrow" size={16} />
        </LinkButton>
      </PageHeading>
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
          {!!data?.length && (
            <div className="reveal flex flex-wrap items-center gap-5 rounded-2xl border border-primary/15 bg-primary/5 p-6">
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
          )}
          {data?.length ? (
            <>
              <div className="flex flex-wrap gap-2.5" aria-label="Lọc huy hiệu">
                {(
                  [
                    { value: "all", label: "Tất cả", count: data.length },
                    { value: "unlocked", label: "Đã mở khóa", count: unlocked },
                    {
                      value: "locked",
                      label: "Đang chinh phục",
                      count: data.length - unlocked,
                    },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filter === option.value}
                    onClick={() => setFilter(option.value)}
                    className={`motion-button inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      filter === option.value
                        ? "border-primary/30 bg-primary/10 text-primary shadow-xs"
                        : "border-border/80 bg-surface text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    <span className="rounded-md bg-surface-2/90 px-1.5 py-0.5 text-[11px] font-bold">
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
              {visible.length ? (
                <div className="reveal-group grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((a) => (
                    <div
                      key={a.id}
                      className={`reveal hover-card panel relative overflow-hidden p-6 transition-all duration-300 ${
                        a.unlocked
                          ? "border-accent/30 bg-gradient-to-b from-accent/5 via-surface to-surface shadow-md shadow-accent/5"
                          : "opacity-80"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-2xs transition-transform hover:scale-105 ${
                            a.unlocked
                              ? "border-accent/30 bg-accent/12 text-accent"
                              : "border-border/60 bg-surface-2 text-muted"
                          }`}
                        >
                          <Icon
                            name={a.unlocked ? "trophy" : "lock"}
                            size={27}
                          />
                        </span>
                        <span className="rounded-lg border border-border/60 bg-surface-2/80 px-2.5 py-1 text-[11px] font-medium text-muted">
                          {CAT_VI[a.category] ?? a.category}
                        </span>
                      </div>
                      <h2 className="mt-5 text-base font-bold text-foreground">
                        {a.nameVi}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {a.descriptionVi}
                      </p>
                      {!a.unlocked && a.progressTarget > 0 && (
                        <div className="mt-4 space-y-1.5">
                          <ProgressBar
                            value={
                              (Math.min(a.progressCurrent, a.progressTarget) /
                                a.progressTarget) *
                              100
                            }
                            label={a.nameVi}
                          />
                          <p className="text-xs text-muted font-medium text-right">
                            {Math.min(a.progressCurrent, a.progressTarget)} /{" "}
                            {a.progressTarget}
                          </p>
                        </div>
                      )}
                      <div
                        className={`mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs font-medium ${
                          a.unlocked ? "text-good" : "text-muted"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 font-bold">
                          <Icon
                            name={a.unlocked ? "check" : "lock"}
                            size={14}
                          />
                          {a.unlocked ? "Đã mở khóa" : "Đang chinh phục"}
                        </span>
                        {a.unlockedAt &&
                          Number.isFinite(Date.parse(a.unlockedAt)) && (
                            <time
                              dateTime={a.unlockedAt}
                              className="text-muted text-[11px]"
                            >
                              {new Date(a.unlockedAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </time>
                          )}
                      </div>
                      {a.unlocked && (
                        <div className="mt-3 flex justify-end gap-2">
                          <SendToFriendButton
                            compact
                            text={`🏆 Mình vừa mở khóa huy hiệu "${a.nameVi}" trên Hanni!`}
                          />
                          <ShareButton
                            compact
                            title="Huy hiệu Hanni"
                            text={`Mình vừa mở khóa huy hiệu "${a.nameVi}" trên Hanni — app học tiếng Trung theo chuẩn HSK 3.0!`}
                            path={`/u/${user.id}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={
                    filter === "unlocked"
                      ? "Huy hiệu đầu tiên đang chờ bạn"
                      : "Bạn đã mở khóa tất cả huy hiệu"
                  }
                  description={
                    filter === "unlocked"
                      ? "Bắt đầu một bài học và giữ thói quen mỗi ngày để chinh phục các cột mốc."
                      : "Hãy tiếp tục luyện tập để giữ vững những gì đã học."
                  }
                >
                  <LinkButton href="/learn">
                    Đến lộ trình học <Icon name="arrow" size={16} />
                  </LinkButton>
                </EmptyState>
              )}
            </>
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
