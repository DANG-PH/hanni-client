"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { DailyQuestCard } from "@/components/daily-quest-card";
import { FeatureTour, type TourStep } from "@/components/feature-tour";
import { FriendsLeaderboard } from "@/components/friends-leaderboard";
import { HeroBanner } from "@/components/hero-banner";
import { Icon, type IconName } from "@/components/icon";
import { LessonPath } from "@/components/lesson-path";
import { VideoShelf } from "@/components/video-shelf";
import { WeeklyLeagueCard } from "@/components/weekly-league-card";
import { WordOfTheDayCard } from "@/components/word-of-the-day";
import {
  Card,
  EmptyState,
  ErrorNote,
  ProgressBar,
  SectionHeading,
  Spinner,
  Stat,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath, useOnboarding, useStreak, useStudyStats } from "@/lib/hooks";
import type { OnboardingGoal } from "@/lib/types";
import styles from "./dashboard.module.css";

/** Dựa theo mục tiêu đã khảo sát (`OnboardingProfile.goal`) để đổi lời chào +
 * ưu tiên thứ tự các mảng luyện tập cho phù hợp từng đối tượng — không dựng
 * dashboard riêng cho từng mục tiêu (quá nặng), chỉ retext + sắp lại thứ tự
 * card sẵn có. */
const GOAL_PERSONA: Record<
  OnboardingGoal,
  { subtitle: (name: string) => string; order: string[] }
> = {
  EXAM: {
    subtitle: (name) =>
      `Chào ${name}! Giữ nhịp ôn luyện đều đặn để tự tin bước vào kỳ thi HSK.`,
    order: ["/vocabulary", "/grammar", "/listening", "/pronunciation"],
  },
  TRAVEL: {
    subtitle: (name) =>
      `Chào ${name}! Luyện nghe và phản xạ giao tiếp để tự tin hơn khi đi du lịch.`,
    order: ["/listening", "/pronunciation", "/vocabulary", "/grammar"],
  },
  WORK: {
    subtitle: (name) =>
      `Chào ${name}! Mở rộng vốn từ và ngữ pháp để dùng tiếng Trung tự tin hơn trong công việc.`,
    order: ["/vocabulary", "/listening", "/grammar", "/pronunciation"],
  },
  ACADEMIC: {
    subtitle: (name) =>
      `Chào ${name}! Nắm chắc ngữ pháp và luyện viết để chuẩn bị tốt cho hành trình du học.`,
    order: ["/grammar", "/vocabulary", "/pronunciation", "/listening"],
  },
  INTEREST: {
    subtitle: (name) =>
      `Chào ${name}! Khám phá tiếng Trung mỗi ngày qua từ vựng, video và câu chuyện thú vị.`,
    order: ["/vocabulary", "/listening", "/grammar", "/pronunciation"],
  },
  OTHER: {
    subtitle: (name) =>
      `Chào ${name}! Tiếp tục hành trình tiếng Trung của bạn, từ những từ vựng đầu tiên đến từng cột mốc HSK.`,
    order: ["/vocabulary", "/grammar", "/listening", "/pronunciation"],
  },
};

const PRACTICE_AREAS: {
  href: string;
  title: string;
  description: string;
  icon: IconName;
  character: string;
  tile: string;
  hanzi: string;
}[] = [
  {
    href: "/vocabulary",
    title: "Từ vựng",
    description: "Ghi nhớ từ mới, ôn đúng lúc",
    icon: "cards",
    character: "词",
    tile: "bg-primary/10 text-primary",
    hanzi: "text-primary/12",
  },
  {
    href: "/grammar",
    title: "Ngữ pháp",
    description: "Hiểu cấu trúc qua ví dụ",
    icon: "book",
    character: "句",
    tile: "bg-lavender/12 text-lavender",
    hanzi: "text-lavender/15",
  },
  {
    href: "/listening",
    title: "Luyện nghe",
    description: "Làm quen với âm thanh",
    icon: "sound",
    character: "听",
    tile: "bg-accent/12 text-accent",
    hanzi: "text-accent/15",
  },
  {
    href: "/pronunciation",
    title: "Phát âm",
    description: "Luyện nói rõ từng âm",
    icon: "play",
    character: "说",
    tile: "bg-good/12 text-good",
    hanzi: "text-good/15",
  },
];

/** Giới thiệu nhanh 5 tính năng chính khi vào dashboard lần đầu — chỉ hiện
 * 1 lần (xem feature-tour.tsx), giúp người dùng mới hiểu tác dụng của từng
 * khu vực thay vì phải tự mò. */
const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    icon: "flame",
    title: "Giữ chuỗi ngày học",
    description:
      "Học đều mỗi ngày để tăng chuỗi streak — thẻ \"Mục tiêu hôm nay\" theo dõi tiến độ và nhắc bạn hoàn thành.",
  },
  {
    icon: "route",
    title: "Lộ trình dành riêng cho bạn",
    description:
      "Dựa trên khảo sát ban đầu, Hanni gợi ý cấp HSK và thứ tự luyện tập phù hợp mục tiêu của bạn — bấm \"Tiếp tục học\" để vào đúng bài đang dở.",
  },
  {
    icon: "play",
    title: "Học qua video",
    description:
      "Xem video tiếng Trung có bản chép song ngữ chạy đồng bộ, vừa nghe vừa đọc để phản xạ nhanh hơn.",
  },
  {
    icon: "flame",
    title: "So với bạn bè",
    description:
      "Theo dõi người khác ở bảng xếp hạng để so chuỗi ngày học ngay tại đây, cùng nhắc nhau giữ nhịp mỗi ngày.",
  },
  {
    icon: "message",
    title: "Trợ lý AI Hanni",
    description:
      "Bấm vào bong bóng chat ở góc phải màn hình bất cứ lúc nào để hỏi về từ vựng, ngữ pháp, hay nhờ mở lộ trình/video phù hợp.",
  },
];

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const streak = useStreak();
  const stats = useStudyStats();
  const path = useLearnPath();
  const onboarding = useOnboarding();
  // Lấy 1 lần lúc mount thay vì gọi Date.now() thẳng trong render (không thuần).
  const [now] = useState(() => Date.now());

  if (loading || !user) return <Spinner />;

  const goal = streak.data?.goal;
  const goalPct =
    goal && goal.value > 0 ? (goal.progress / goal.value) * 100 : 0;
  const current = path.data?.lessons.find(
    (l) => l.id === path.data?.currentLessonId,
  );

  const persona = onboarding.data
    ? GOAL_PERSONA[onboarding.data.goal]
    : null;
  const examDaysLeft =
    onboarding.data?.plansToTakeExam && onboarding.data.targetDate
      ? Math.ceil(
          (new Date(onboarding.data.targetDate).getTime() - now) /
            86_400_000,
        )
      : null;
  const heroSubtitle = persona
    ? persona.subtitle(user.displayName) +
      (examDaysLeft !== null && examDaysLeft > 0
        ? ` Còn ${examDaysLeft} ngày tới hạn thi HSK ${onboarding.data!.targetLevel} bạn đặt mục tiêu.`
        : "")
    : `Chào ${user.displayName}! Tiếp tục hành trình tiếng Trung của bạn, từ những từ vựng đầu tiên đến từng cột mốc HSK.`;
  const orderedPracticeAreas = persona
    ? [...PRACTICE_AREAS].sort(
        (a, b) => persona.order.indexOf(a.href) - persona.order.indexOf(b.href),
      )
    : PRACTICE_AREAS;

  return (
    <div className={`page-wrap ${styles.dashboard}`}>
      <FeatureTour tourKey="dashboard" steps={DASHBOARD_TOUR_STEPS} />
      <div className="reveal flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Góc học tập <span className="mx-2 text-border">/</span>{" "}
          <span className="font-medium text-foreground">Tổng quan</span>
        </p>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Avatar user={user} size={24} />
          {user.displayName}
          <Icon name="arrow" size={13} />
        </Link>
      </div>
      <div className={styles.welcome}>
        <HeroBanner
          title="Học mỗi ngày,"
          highlight="tiến bộ không ngừng!"
          subtitle={heroSubtitle}
          ctaLabel={
            current?.startedWords ? "Tiếp tục bài học" : "Bắt đầu học ngay"
          }
          ctaHref={
            current
              ? current.startedWords
                ? `/study?lesson=${current.id}`
                : `/learn/${current.id}`
              : "/learn"
          }
        />

        {onboarding.data === null ? (
          <Card className={`flex flex-wrap items-center justify-between gap-4 border-primary/15 bg-primary/5! ${styles.planCard}`}>
            <div className="flex items-center gap-3">
              <span className="icon-tile text-primary">
                <Icon name="route" size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">
                  Chưa có lộ trình cá nhân
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Làm khảo sát 1 phút để Hanni gợi ý cấp HSK và nhịp học phù hợp mục tiêu của bạn.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="motion-button inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg hover:bg-primary/90"
            >
              Làm khảo sát <Icon name="arrow" size={16} />
            </Link>
          </Card>
        ) : (
          onboarding.data && (
            <Card className={`flex flex-wrap items-center justify-between gap-4 border-primary/15 bg-primary/5! ${styles.planCard}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="icon-tile text-primary">
                  <Icon name="route" size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold">
                    Lộ trình của bạn: HSK {onboarding.data.recommendedLevel}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {onboarding.data.recommendationVi}
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Xem lại <Icon name="arrow" size={16} />
              </Link>
            </Card>
          )
        )}
      </div>

      {(stats.error || streak.error || path.error) && (
        <ErrorNote>
          Chưa tải được một số dữ liệu học tập.{" "}
          <button
            className="font-semibold underline"
            onClick={() =>
              void Promise.allSettled([
                stats.mutate(),
                streak.mutate(),
                path.mutate(),
              ])
            }
          >
            Thử lại
          </button>
        </ErrorNote>
      )}

      <div className={styles.sessionGrid}>
        {/* Tiếp tục học */}
        <Card className={`flex flex-col justify-between ${styles.continueCard}`}>
          <div className="flex items-center gap-2.5 text-primary">
            <span className={styles.sectionIcon}><Icon name="play" size={17} /></span>
            <span className="text-sm font-semibold">Tiếp tục học</span>
          </div>
          {path.isLoading ? (
            <p className="my-6 text-sm text-muted">Đang tải lộ trình…</p>
          ) : path.error && !path.data ? (
            <p className="my-6 text-sm text-muted">
              Lộ trình tạm thời chưa tải được. Bạn có thể thử lại ở thông báo
              phía trên.
            </p>
          ) : current ? (
            <>
              <div className="my-4">
                <p className="text-xl font-semibold tracking-tight">
                  {current.title}
                  <span className="ml-2 text-sm font-normal text-muted">
                    {path.data?.levelName}
                  </span>
                </p>
                <p className={`hanzi ${styles.wordPreview}`}>
                  {current.previewWords.join("  ")}…
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar
                    value={
                      current.wordCount
                        ? (current.learnedWords / current.wordCount) * 100
                        : 0
                    }
                    label="Tiến độ bài hiện tại"
                  />
                  <span className="shrink-0 text-xs text-muted">
                    {current.learnedWords}/{current.wordCount}
                  </span>
                </div>
              </div>
              <Link
                href={
                  current.startedWords > 0
                    ? `/study?lesson=${current.id}`
                    : `/learn/${current.id}`
                }
                className="motion-button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-fg"
              >
                {current.startedWords > 0 ? "Học tiếp bài này" : "Vào bài"}
                <Icon name="arrow" size={16} />
              </Link>
            </>
          ) : (
            <div className="my-4">
              <p className="text-sm text-muted">
                {path.data?.totalLessons &&
                path.data.completedLessons === path.data.totalLessons
                  ? "Bạn đã hoàn thành các bài trong cấp này. Cùng khám phá bước tiếp theo nhé."
                  : "Chọn một cấp HSK và bắt đầu bài học đầu tiên của bạn."}
              </p>
              <Link
                href="/learn"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Mở lộ trình <Icon name="arrow" size={16} />
              </Link>
            </div>
          )}
        </Card>

        {/* Mục tiêu hôm nay */}
        <Card className={`flex flex-col justify-between ${styles.goalCard}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Mục tiêu hôm nay</span>
            <Link
              href="/settings"
              aria-label="Điều chỉnh mục tiêu học tập"
              className="rounded-lg p-2 text-muted hover:bg-surface-2"
            >
              <Icon name="settings" size={16} />
            </Link>
          </div>
          {goal ? (
            <>
              <div className="my-4 flex items-center gap-4">
                <span className={styles.goalIcon}>
                  <Icon name={goal.met ? "check" : "target"} size={26} />
                </span>
                <div>
                  <span className="text-3xl font-semibold">
                    {Math.round(goal.progress)}
                  </span>
                  <span className="text-sm text-muted">
                    {" "}
                    / {goal.value} {goal.type === "MINUTES" ? "phút" : "từ ôn"}
                  </span>
                </div>
              </div>
              <ProgressBar value={goalPct} label="Mục tiêu hôm nay" />
            </>
          ) : (
            <p className="my-6 text-sm text-muted">
              {streak.isLoading
                ? "Đang tải mục tiêu…"
                : "Chưa tải được mục tiêu hôm nay."}
            </p>
          )}
          {goal && (
            <p className="mt-4 text-xs text-muted">
              {goal.met
                ? "Bạn đã đạt mục tiêu hôm nay. Hãy giữ nhịp nhé!"
                : "Một buổi học ngắn cũng giúp bạn tiến xa hơn."}
            </p>
          )}
        </Card>
      </div>

      <VideoShelf />

      <div className={styles.statsGrid}>
        <Stat
          label="Chuỗi ngày học"
          value={streak.data ? `${streak.data.currentStreak}` : "—"}
          hint={
            streak.data
              ? `Kỷ lục ${streak.data.longestStreak} ngày${
                  streak.data.streakFreezeCount > 0
                    ? ` · 🧊 ${streak.data.streakFreezeCount} lá chắn`
                    : ""
                }`
              : ""
          }
          icon="flame"
          tone="text-warn bg-warn/10"
        />
        <Stat
          label="Cần ôn tập"
          value={stats.data?.dueNow ?? "—"}
          hint="Từ đã đến lịch ôn"
          icon="cards"
          tone="text-primary bg-primary/10"
        />
        <Stat
          label="Bài đã xong"
          value={
            path.data
              ? `${path.data.completedLessons}/${path.data.totalLessons}`
              : "—"
          }
          hint={path.data?.levelName ?? ""}
          icon="route"
          tone="text-lavender bg-lavender/12"
        />
        <Stat
          label="Từ đã thuộc"
          value={stats.data?.learnedTotal ?? "—"}
          hint="Vốn từ của bạn"
          icon="book"
          tone="text-good bg-good/10"
        />
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <DailyQuestCard />
        <WeeklyLeagueCard />
      </div>

      <div className={styles.dailyGrid}>
        <WordOfTheDayCard />
        <FriendsLeaderboard />
      </div>

      <section className={styles.skillsSection}>
        <SectionHeading
          icon="spark"
          eyebrow="Học theo cách của bạn"
          title="Rèn từng kỹ năng"
          className={styles.skillsHeading}
        >
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Kiểm tra kiến thức <Icon name="arrow" size={16} />
          </Link>
        </SectionHeading>
        <div className={`reveal-group ${styles.skillsGrid}`}>
          {orderedPracticeAreas.map((area, index) => (
            <Link
              key={area.href}
              href={area.href}
              className={`reveal panel group ${styles.practiceCard}`}
              data-depth
            >
              <div className={styles.practiceTopline}>
                <span className={styles.practiceNumber}>0{index + 1}</span>
                <span className={styles.practiceArrow}><Icon name="arrow" size={15} /></span>
              </div>
              <span
                aria-hidden="true"
                className={`hanzi ${styles.practiceCharacter} ${area.hanzi}`}
              >
                {area.character}
              </span>
              <span
                className={`${styles.practiceIcon} ${area.tile}`}
              >
                <Icon name={area.icon} size={21} />
              </span>
              <h3 className={styles.practiceTitle}>
                {area.title}
              </h3>
              <p className={styles.practiceDescription}>
                {area.description}
              </p>
              <span className={styles.practiceFooter}>
                <span className={styles.practiceDot} /> Bắt đầu luyện
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          icon="route"
          title={`Lộ trình ${path.data?.levelName ?? ""}`}
          tone="lavender"
          className="mb-4"
        >
          <Link
            href="/learn"
            className="flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            Xem đầy đủ <Icon name="arrow" size={16} />
          </Link>
        </SectionHeading>
        {path.isLoading ? (
          <Spinner />
        ) : path.data?.lessons.length ? (
          <LessonPath lessons={path.data.lessons} limit={5} />
        ) : !path.error ? (
          <EmptyState
            title="Sẵn sàng cho bài học đầu tiên"
            description="Mở lộ trình HSK để khám phá các bài học dành cho bạn."
          >
            <Link href="/learn" className="text-sm font-semibold text-primary">
              Khám phá lộ trình →
            </Link>
          </EmptyState>
        ) : null}
      </section>
    </div>
  );
}
