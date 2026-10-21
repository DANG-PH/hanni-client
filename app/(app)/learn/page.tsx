"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { mutate } from "swr";
import Link from "next/link";
import { ClassAssignmentsCard } from "@/components/classrooms/class-assignments-card";
import { DailyQuestCard } from "@/components/daily-quest-card";
import { Icon, type IconName } from "@/components/icon";
import { GettingStarted } from "@/components/learn/getting-started";
import { TodayCard } from "@/components/learn/today-card";
import { TopicExplorer } from "@/components/learn/topic-explorer";
import { NotificationNudge } from "@/components/pwa/notification-nudge";
import { Button, ErrorNote, LinkButton, Spinner } from "@/components/ui";
import { VideoShelf } from "@/components/video-shelf";
import { WeeklyLeagueCard } from "@/components/weekly-league-card";
import { WordOfTheDayCard } from "@/components/word-of-the-day";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLearnPath, useLevels, useStreak } from "@/lib/hooks";
import { pendingLessonIds } from "@/lib/pending-lessons";
import type { LearnPath } from "@/lib/types";
import { lessonMinutes, toUnits } from "@/lib/units";

/**
 * Trang chủ sau đăng nhập — MỘT lộ trình, MỘT nút "Học tiếp" (cách Duolingo
 * làm lại màn chính 2022), bố cục theo Hanbeego (user chỉ đích danh làm mẫu):
 * thẻ bài tiếp theo + vòng tiến độ, thẻ chuỗi ngày; tab cấp HSK để xem; chủ
 * đề hai cột (danh sách chủ đề | các bài); nhiệm vụ, giải đấu, từ vựng hôm
 * nay và video ở cuối (Hanbeego cũng đặt các thẻ này ngay trang chủ).
 */
export default function LearnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LearnHome />
    </Suspense>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" aria-hidden="true">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-surface-2" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-700"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" className="fill-foreground text-[15px] font-extrabold">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

/** Các bước của phiên học bài (`buildLessonSession` ở server) — nói trước bấm "Học tiếp" sẽ làm gì. Chỉ màn
 * ≥1536px: ở 1920 nửa phải thẻ Học tiếp từng trống trơn, màn nhỏ hơn thì không có chỗ. */
const LESSON_STEPS: [IconName, string, string][] = [
  ["book", "Làm quen từ mới", "Pinyin, âm Hán Việt, mẹo đoán thanh điệu"],
  ["headphones", "Luyện ngay", "Chọn nghĩa, nghe chọn từ, nhận mặt chữ"],
  ["cards", "Ghép cặp", "Nối chữ Hán với nghĩa"],
  ["refresh", "Ôn trộn cuối bài", "Hỏi lại bằng dạng khác, làm lại câu sai"],
];

function LessonSteps() {
  return (
    <div className="hidden w-80 shrink-0 self-stretch border-l border-primary/15 pl-6 2xl:block">
      <p className="text-xs font-bold tracking-wider text-muted">MỘT BÀI GỒM</p>
      <ol className="mt-3 space-y-3">
        {LESSON_STEPS.map(([icon, title, desc]) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground/75">
              <Icon name={icon} size={16} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted">{desc}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Khách (chưa đăng nhập) — tài khoản chỉ để LƯU, mời ở cột phải. */
function GuestSaveCard({ learned }: { learned: number }) {
  return (
    <section className="panel flex flex-col p-5">
      <span className="icon-tile">
        <Icon name="flame" size={22} />
      </span>
      <h2 className="mt-3 text-base font-bold">
        {learned > 0 ? `Bạn đã học ${learned} bài — lưu lại nhé` : "Học thử thoải mái, lưu khi bạn muốn"}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-muted">
        Tạo tài khoản miễn phí để giữ chuỗi ngày học, ôn lại từ đúng lúc sắp quên và học tiếp trên mọi thiết bị.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 lg:mt-auto">
        <LinkButton href="/register?next=/learn">Tạo tài khoản</LinkButton>
        <LinkButton href="/login?next=/learn" variant="secondary">
          Đăng nhập
        </LinkButton>
      </div>
    </section>
  );
}

const GUEST_TRY: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/minigame", label: "Trò chơi từ vựng", hint: "60 giây, dịch nhanh, ghép cặp", icon: "trophy" },
  { href: "/watch", label: "Học qua video", hint: "Phụ đề song ngữ, bấm từ để tra", icon: "play" },
  { href: "/thi-thu-hsk", label: "Đề thi thử HSK", hint: "Đúng cấu trúc đề thật, chấm ngay", icon: "target" },
  { href: "/writing", label: "Luyện viết chữ Hán", hint: "Xem thứ tự nét rồi tự tô", icon: "pencil" },
];

/** Thay thẻ nhiệm vụ + giải đấu (cần dữ liệu cá nhân) khi khách xem. */
function GuestTryCard() {
  return (
    <section className="panel p-5">
      <h2 className="text-base font-bold">Thử ngay, chưa cần tài khoản</h2>
      <ul className="mt-3 space-y-1.5">
        {GUEST_TRY.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Icon name={t.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block text-xs text-muted">{t.hint}</span>
              </span>
              <Icon name="arrow" size={15} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Khách: bài đã học trong phiên (lưu tạm, chưa có tài khoản) tính là xong. */
function withGuestProgress(path: LearnPath, done: Set<string>): LearnPath {
  if (done.size === 0) return path;
  const lessons = path.lessons.map((l) =>
    done.has(l.id) ? { ...l, status: "COMPLETED" as const } : l,
  );
  return {
    ...path,
    lessons,
    completedLessons: lessons.filter((l) => l.status === "COMPLETED").length,
    currentLessonId: lessons.find((l) => l.status !== "COMPLETED")?.id ?? null,
  };
}

function LearnHome() {
  // Khách xem được (2026-10-18) — như Hanzii/Hanbeego; chỉ lưu tiến độ mới cần tài khoản.
  const { user, loading } = useAuth();
  const params = useSearchParams();
  const wanted = Number(params.get("level"));
  const [viewLevel, setViewLevel] = useState<number | undefined>(() =>
    !user && Number.isInteger(wanted) && wanted >= 1 ? Math.min(wanted, 7) : undefined,
  );
  const { data: rawData, error, mutate: reload } = useLearnPath(viewLevel);
  const course = useLearnPath();
  const levels = useLevels();
  const streak = useStreak();
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const [guestDone] = useState(
    () => new Set(typeof window === "undefined" || user ? [] : pendingLessonIds()),
  );
  const data = rawData && !user ? withGuestProgress(rawData, guestDone) : rawData;

  async function chooseLevel(lvl: number) {
    setSwitching(true);
    try {
      await api.patch("/users/me/settings", { courseLevel: lvl });
      setViewLevel(undefined);
      await mutate((key) => typeof key === "string" && key.startsWith("/learn"));
    } finally {
      setSwitching(false);
    }
  }

  // `/learn?level=N` (thẻ cấp HSK ở trang chủ) = người dùng CHỌN cấp đó: lưu
  // làm cấp lộ trình rồi bỏ tham số khỏi URL.
  useEffect(() => {
    if (!user || !course.data || !Number.isInteger(wanted) || wanted < 1) return;
    const lvl = Math.min(wanted, 7);
    if (lvl !== course.data.level && course.data.levels.includes(lvl)) {
      void api
        .patch("/users/me/settings", { courseLevel: lvl })
        .then(() => mutate((key) => typeof key === "string" && key.startsWith("/learn")));
    }
    router.replace("/learn");
  }, [user, course.data, wanted, router]);

  if (loading) return <Spinner />;

  // Khách không có "cấp đang học" — xem cấp nào là cấp đó.
  const courseLevel = user ? course.data?.level : undefined;
  const viewing = data?.level;
  const isCourse = viewing === courseLevel;
  const current = data?.lessons.find((l) => l.id === data.currentLessonId) ?? null;
  const pct = data?.totalLessons ? (data.completedLessons / data.totalLessons) * 100 : 0;
  const units = data ? toUnits(data.lessons) : [];
  const unitsDone = units.filter((u) => u.lessons.every((l) => l.lesson.status === "COMPLETED")).length;
  const levelName = (lvl: number) =>
    lvl === 7 ? "Cao cấp" : (levels.data?.find((l) => l.level === lvl)?.nameVi ?? "");
  const nextLevel = data ? data.levels.find((l) => l > data.level) : undefined;

  return (
    <div className="page-wrap space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="panel tint-primary relative flex flex-col gap-5 overflow-hidden p-5 sm:flex-row sm:items-center sm:p-6" aria-labelledby="next-lesson">
          {error ? (
            <div className="space-y-3">
              <ErrorNote>Chưa tải được lộ trình. Vui lòng thử lại.</ErrorNote>
              <Button variant="secondary" onClick={() => void reload()}>
                <Icon name="refresh" size={16} /> Tải lại
              </Button>
            </div>
          ) : !data ? (
            // Khung chờ cùng bố cục với nội dung thật (vòng 96px + khối chữ + nút). Khung 144px cũ thấp hơn ~200px trên
            // điện thoại nên tải xong là đẩy thẻ bên dưới xuống — Lighthouse đo bố cục nhảy (CLS) 0,34 ở trang này.
            <>
              <div className="skeleton h-24 w-24 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2" aria-hidden="true">
                <div className="skeleton h-4 w-44 rounded" />
                <div className="skeleton h-14 w-72 max-w-full rounded sm:h-8" />
                <div className="skeleton h-5 w-56 max-w-full rounded" />
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton mt-4! h-12 w-52 rounded-xl" />
                {!user && <div className="skeleton mt-2.5! h-12 w-52 rounded-xl sm:hidden" />}
              </div>
            </>
          ) : (
            <>
              <ProgressRing value={pct} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wider text-primary">
                  LỘ TRÌNH HSK {data.level === 7 ? "7–9" : data.level} · {levelName(data.level).toUpperCase()}
                </p>
                {current ? (
                  <>
                    <h1 id="next-lesson" className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
                      Bài {current.orderIndex}: {current.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                      <span lang="zh" className="hanzi text-base text-primary">
                        {current.previewWords.join(" · ")}
                      </span>{" "}
                      · {current.wordCount} từ · ~{lessonMinutes(current.wordCount)} phút
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Đã xong {data.completedLessons}/{data.totalLessons} bài · {unitsDone}/{units.length} chủ đề
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <LinkButton href={`/bai-hoc/${current.id}`} className="min-w-52 uppercase tracking-wide">
                        <Icon name="play" size={16} />
                        {data.completedLessons === 0 ? "Bắt đầu học" : "Học tiếp"}
                      </LinkButton>
                      {data.level === 1 && data.completedLessons === 0 && (
                        <LinkButton href="/phien-am" variant="secondary">
                          <Icon name="sound" size={16} />
                          Học phát âm trước (10 phút)
                        </LinkButton>
                      )}
                      {user && !isCourse && (
                        <Button variant="secondary" disabled={switching} onClick={() => void chooseLevel(data.level)}>
                          Chọn học HSK {data.level === 7 ? "7–9" : data.level}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h1 id="next-lesson" className="mt-1.5 text-xl font-extrabold tracking-tight">
                      Bạn đã học hết {data.totalLessons} bài!
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                      Từ đã học vẫn quay lại ở phần Ôn tập để bạn nhớ lâu.
                    </p>
                    {nextLevel && (
                      <Button
                        className="mt-4"
                        disabled={switching}
                        onClick={() => (user ? void chooseLevel(nextLevel) : setViewLevel(nextLevel))}
                      >
                        Lên HSK {nextLevel === 7 ? "7–9" : nextLevel}
                        <Icon name="arrow" size={16} />
                      </Button>
                    )}
                  </>
                )}
              </div>
              {current && <LessonSteps />}
            </>
          )}
        </section>
        {user ? <TodayCard /> : <GuestSaveCard learned={guestDone.size} />}
      </div>

      {/* Mời bật thông báo SAU khi đã học hôm nay (như Duolingo hỏi sau bài đầu) — trước đó dải này chen lên trên nút
       * Học tiếp ngay lúc vừa đăng ký, khi người mới còn chưa biết sẽ được nhắc học cái gì. */}
      {user && streak.data?.activeToday && <NotificationNudge />}

      {user && <GettingStarted lessonHref={current ? `/bai-hoc/${current.id}` : "/learn"} />}

      {user && <ClassAssignmentsCard />}

      {data && (
        <section aria-labelledby="path-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="path-title" className="text-lg font-extrabold tracking-tight">
                Lộ trình bài học HSK {data.level === 7 ? "7–9" : data.level}
              </h2>
              <p className="text-sm text-muted">
                Học theo chủ đề — bài nào cũng mở, Hanni đánh dấu sẵn bài nên học tiếp.
              </p>
            </div>
            <Link
              href="/kiem-tra-trinh-do"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Không chắc nên học cấp nào? Kiểm tra trình độ
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Cấp HSK">
            {data.levels.map((l) => {
              const selected = l === viewing;
              return (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setViewLevel(user && l === courseLevel ? undefined : l)}
                  className={`motion-button flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold ${
                    selected
                      ? "chip-on shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  HSK {l === 7 ? "7–9" : l}
                  {l === courseLevel && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        selected ? "bg-primary text-primary-fg" : "bg-primary/10 text-primary"
                      }`}
                    >
                      ĐANG HỌC
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <TopicExplorer key={data.level} lessons={data.lessons} currentLessonId={data.currentLessonId} />
        </section>
      )}

      {/* Kéo 3 thẻ cao bằng nhau — để `items-start` thì đáy lệch nhau, thẻ ngắn
       * chừa mảng trống bên dưới. */}
      {user ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DailyQuestCard lessonHref={current ? `/bai-hoc/${current.id}` : "/learn"} />
          <WeeklyLeagueCard />
          <WordOfTheDayCard level={courseLevel} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <GuestTryCard />
          <WordOfTheDayCard level={viewing} />
        </div>
      )}

      <VideoShelf limit={8} maxLevel={(courseLevel ?? viewing ?? 1) + 1} />
    </div>
  );
}
