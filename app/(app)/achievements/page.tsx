"use client";

/**
 * BẢN ĐỒ TRANG — HUY HIỆU (/achievements) — lưới huy chương + danh hiệu
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /achievements        ← useAchievements() ở lib/hooks.ts (← chính trang này)
 *                              → server: modules/gamification/gamification.controller.ts → AchievementsService.list()
 *   GET /shop/titles         ← useTitleShop() ở lib/shop.ts (← components/title-shop.tsx)
 *                              → server: modules/shop/shop.controller.ts → TitleService.getCatalog()
 *   POST /shop/titles/equip  ← equipTitle() ở lib/shop.ts (← components/title-shop.tsx)
 *                              → server: modules/shop/shop.controller.ts → TitleService.equip()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import { useState } from "react";
import {
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { TitlePicker } from "@/components/title-shop";
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

/** Màu + biểu tượng từng nhóm huy hiệu — mỗi nhóm một màu để bộ sưu tập nhìn ra được như huy chương. */
const MEDAL: Record<string, { icon: IconName; color: string; unit: string }> = {
  STREAK: { icon: "flame", color: "var(--danger)", unit: "ngày" },
  MILESTONE: { icon: "cards", color: "var(--lavender)", unit: "lượt" },
  VOLUME: { icon: "book", color: "var(--good)", unit: "từ" },
  LEVEL: { icon: "route", color: "var(--accent)", unit: "" },
  ACCURACY: { icon: "target", color: "var(--warn)", unit: "" },
};

/** Huy chương tròn (như huy hiệu Duolingo, vòng Apple Fitness): mốc ở giữa, chưa mở thì xám + vòng tiến độ. */
function Medal({ code, category, unlocked, pct }: { code: string; category: string; unlocked: boolean; pct: number }) {
  const m = MEDAL[category] ?? MEDAL.MILESTONE;
  const level = /^HSK(\d)_/.exec(code)?.[1];
  const n = /_(\d+)$/.exec(code)?.[1];
  const label = level ? `HSK ${level === "7" ? "7–9" : level}` : n;
  return (
    <span
      aria-hidden="true"
      className="relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full"
      style={{
        background: unlocked
          ? m.color
          : `conic-gradient(${m.color} ${Math.round(pct * 100)}%, var(--border) 0)`,
      }}
    >
      <span
        className="grid h-[62px] w-[62px] place-items-center rounded-full"
        style={{
          background: unlocked ? `color-mix(in srgb, ${m.color} 14%, var(--surface))` : "var(--surface-2)",
          color: unlocked ? m.color : "var(--muted)",
        }}
      >
        <span className="flex flex-col items-center leading-none">
          <Icon name={m.icon} size={level ? 18 : 20} />
          {label && <span className="mt-1 text-sm font-extrabold tabular-nums">{label}</span>}
        </span>
      </span>
      {!unlocked && (
        <span className="absolute -right-0.5 -bottom-0.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-muted">
          <Icon name="lock" size={12} />
        </span>
      )}
    </span>
  );
}

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
        description="Đạt mốc là mở huy hiệu — mỗi huy hiệu mở thêm một danh hiệu."
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
            <div className="panel reveal flex flex-wrap items-center gap-5 p-5">
              <span className="icon-tile h-14! w-14! text-accent!">
                <Icon name="trophy" size={28} />
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
                        ? "chip-on shadow-xs"
                        : "border-border/80 bg-surface text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${filter === option.value ? "bg-background/20" : "bg-surface-2/90"}`}
                    >
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
              {visible.length ? (
                <div className="reveal-group grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visible.map((a) => (
                    <div
                      key={a.id}
                      className={`reveal panel flex flex-col items-center p-4 text-center ${a.unlocked ? "" : "bg-surface/70"}`}
                    >
                      <Medal code={a.code} category={a.category} unlocked={a.unlocked} pct={ratio(a)} />
                      <h2 className="mt-3 text-sm font-bold text-foreground">{a.nameVi}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{a.descriptionVi}</p>
                      <p className={`mt-auto pt-2 text-xs font-semibold ${a.unlocked ? "text-good" : "text-muted"}`}>
                        {a.unlocked ? (
                          <>
                            <Icon name="check" size={12} className="mr-1 inline" />
                            {a.unlockedAt && Number.isFinite(Date.parse(a.unlockedAt))
                              ? new Date(a.unlockedAt).toLocaleDateString("vi-VN")
                              : "Đã mở"}
                          </>
                        ) : a.progressTarget > 0 ? (
                          `${Math.min(a.progressCurrent, a.progressTarget).toLocaleString("vi-VN")} / ${a.progressTarget.toLocaleString("vi-VN")} ${MEDAL[a.category]?.unit ?? ""}`
                        ) : (
                          CAT_VI[a.category] ?? a.category
                        )}
                      </p>
                      {a.unlocked && (
                        <div className="mt-2">
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
              {/* Danh hiệu xuống dưới lưới huy chương — trước đó 9 dòng danh hiệu đẩy huy chương khỏi màn đầu. */}
              <section className="space-y-4">
                <SectionHeading
                  icon="trophy"
                  tone="accent"
                  title="Danh hiệu"
                  description="Mỗi danh hiệu mở khi bạn đạt một huy hiệu ở trên — học thật mới có, không mua bằng xu."
                />
                <TitlePicker />
              </section>
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
