"use client";

/**
 * BẢN ĐỒ TRANG — TIẾN ĐỘ (/progress) — vốn từ, báo cáo tuần/tháng/quý, Hanni Coach, từ khó nhớ, từ đã ẩn
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /insights/report               ← useInsightsReport() ở lib/insights.ts (←
 *                                        components/insights/period-report.tsx)
 *                                        → server: modules/insights/insights.controller.ts → InsightsService.report()
 *   POST /insights/report/coach        ← useCoach() ở lib/insights.ts (← components/insights/period-report.tsx)
 *                                        → server: modules/insights/insights.controller.ts → InsightsService.coach()
 *   GET /payments/configured           ← usePaymentsConfigured() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                        → server: modules/payments/payments.controller.ts →
 *                                          PaymentsService.providers()
 *   POST /payments/premium-checkout    ← createPremiumCheckout() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                        → server: modules/payments/payments.controller.ts →
 *                                          PaymentsService.createPremiumCheckout()
 *   GET /premium/status                ← usePremiumStatus() ở lib/premium.ts (←
 *                                        components/insights/period-report.tsx, components/premium-modal.tsx)
 *                                        → server: modules/premium/premium.controller.ts → PremiumService.getStatus()
 *   GET /progress/overview             ← useProgress() ở lib/hooks.ts (← chính trang này)
 *                                        → server: modules/progress/progress.controller.ts →
 *                                          ProgressService.overview()
 *   GET /quiz/recent                   ← useRecentQuizzes() ở lib/hooks.ts (← chính trang này)
 *                                        → server: modules/gamification/gamification.controller.ts →
 *                                          QuizService.recent()
 *   GET /streak/history                ← useStreakHistory() ở lib/hooks.ts (← components/activity-calendar.tsx)
 *                                        → server: modules/gamification/gamification.controller.ts →
 *                                          StreakService.history()
 *   GET /study/leeches                 ← useLeeches() ở lib/hooks.ts (← chính trang này)
 *                                        → server: modules/srs/srs.controller.ts → ReviewService.getLeeches()
 *   GET /study/suspended               ← useSuspendedWords() ở lib/hooks.ts (← chính trang này)
 *                                        → server: modules/srs/srs.controller.ts → ReviewService.getSuspended()
 *   POST /study/words/:wordId/suspend  ← suspendWord() ở lib/hooks.ts (← chính trang này)
 *                                        → server: modules/srs/srs.controller.ts → ReviewService.setSuspended()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import { useState } from "react";
import {
  FeatureTour,
  TourButton,
  type TourStep,
} from "@/components/feature-tour";
import Link from "next/link";
import { ActivityCalendar } from "@/components/activity-calendar";
import { AudioButton } from "@/components/audio-button";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { PeriodReport } from "@/components/insights/period-report";
import { useRequireAuth } from "@/lib/auth";
import {
  suspendWord,
  useLeeches,
  useProgress,
  useRecentQuizzes,
  useSuspendedWords,
} from "@/lib/hooks";

const BAND_VI: Record<string, string> = {
  ELEMENTARY: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Cao cấp",
};

const PROGRESS_TOUR_STEPS: TourStep[] = [
  {
    icon: "chart",
    title: "Bốn con số nói bốn chuyện khác nhau",
    description:
      '"Đang học" là từ bạn đang ghi nhớ; "Đến hạn ôn" là việc cần làm hôm nay; "Ôn trong 24 giờ" là từ sắp tới lịch ôn; "Đã thuộc" chỉ tính từ đã ôn đúng khoảng 21 ngày nên tăng chậm nhất.',
  },
  {
    icon: "spark",
    title: "Báo cáo tuần, tháng, quý",
    description:
      "Đổi giữa tuần/tháng/quý để so với cùng kỳ trước. Hanni Coach (Premium) đọc số liệu đó và viết nhận xét, mẹo nhớ từ hay quên theo âm Hán Việt và kế hoạch kỳ tới.",
  },
  {
    icon: "flame",
    title: "Lịch 30 ngày",
    description:
      "Mỗi ô là một ngày có học. Nhìn vào đây dễ thấy mình đang đều hay đang đứt quãng hơn là nhìn con số tổng.",
  },
  {
    icon: "target",
    title: "Từ khó nhớ",
    description:
      "Những từ bạn sai nhiều lần sẽ tự gom vào một mục riêng ở cuối trang. Khi bạn thật sự nhớ được, từ đó tự rời khỏi danh sách.",
  },
];

export default function ProgressPage() {
  const { user, loading } = useRequireAuth();
  const { data, isLoading, error, mutate } = useProgress();
  const quizzes = useRecentQuizzes();
  const leeches = useLeeches();
  const suspended = useSuspendedWords();
  const [unhiding, setUnhiding] = useState<string | null>(null);

  async function unhide(wordId: string) {
    if (unhiding) return;
    setUnhiding(wordId);
    try {
      await suspendWord(wordId, false);
      await Promise.all([suspended.mutate(), mutate()]);
    } finally {
      setUnhiding(null);
    }
  }
  if (loading || !user) return <Spinner />;
  // Cấp đang học: cấp thấp nhất còn từ chưa thuộc mà đã chạm tới (chưa học gì thì HSK 1) — thanh tiến độ
  // theo CẤP mới thấy nhích từ ngày đầu (10/300), tính trên cả 10.958 từ thì mãi là 0%.
  const focus =
    data?.levels.find((l) => l.learned + l.learning > 0 && l.learned < l.totalWords) ?? data?.levels[0];
  const touched = data ? data.totals.learned + data.totals.learning : 0;
  return (
    <div className="page-wrap space-y-8">
      <FeatureTour tourKey="progress" steps={PROGRESS_TOUR_STEPS} />
      <PageHeading
        icon="chart"
        title="Tiến độ học tập"
        description="Xem vốn từ, nhịp học và phần cần ôn tiếp."
      >
        <LinkButton href="/achievements" variant="secondary"><Icon name="trophy" size={16} /> Huy hiệu</LinkButton>
        <TourButton tourKey="progress" />
      </PageHeading>
      {error ? (
        <ErrorNote>
          Chưa tải được tiến độ.{" "}
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
        data && (
          <>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(270px,32%)]">
              <section className="panel min-w-0 overflow-hidden shadow-none" aria-labelledby="progress-vocab">
                <div className="space-y-4 p-4 sm:p-5">
                  <h2 id="progress-vocab" className="text-sm font-bold text-muted">Vốn từ của bạn</h2>
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <strong className="text-3xl tabular-nums tracking-tight">{touched.toLocaleString("vi-VN")}</strong>
                    <span className="text-sm font-semibold">từ đã học</span>
                  </p>
                  {focus && (
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-sm">
                        <span className="font-semibold">{focus.level >= 7 ? "HSK 7–9" : `HSK ${focus.level}`}</span>
                        <span className="text-muted">
                          {(focus.learned + focus.learning).toLocaleString("vi-VN")}/{focus.totalWords.toLocaleString("vi-VN")} từ đã học
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`Đã thuộc ${focus.learned}, đang học ${focus.learning}, tổng ${focus.totalWords} từ`}
                        className="flex h-2.5 overflow-hidden rounded-full bg-surface-2"
                      >
                        <span className="bg-good" style={{ width: `${(focus.learned / Math.max(1, focus.totalWords)) * 100}%` }} />
                        <span className="bg-primary/70" style={{ width: `${(focus.learning / Math.max(1, focus.totalWords)) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                  {[
                    { label: "Đã thuộc", value: data.totals.learned, color: "text-good" },
                    { label: "Đang học", value: data.totals.learning, color: "text-primary" },
                    { label: "Đến hạn ôn", value: data.totals.due, color: "text-foreground" },
                    { label: "Ôn trong 24 giờ", value: data.totals.atRisk, color: "text-foreground" },
                  ].map((stat) => (
                    <div key={stat.label} className="min-w-0 bg-surface px-3 py-3 sm:px-4">
                      <dt className="text-xs leading-5 text-muted">{stat.label}</dt>
                      <dd className={`mt-1 text-xl font-bold tabular-nums [overflow-wrap:anywhere] ${stat.color}`}>{stat.value.toLocaleString("vi-VN")}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="panel min-w-0 bg-[#fffbf8] p-4 shadow-none sm:p-5" aria-labelledby="progress-next">
                <p className="text-xs font-semibold text-primary">VIỆC TIẾP THEO</p>
                <h2 id="progress-next" className="mt-2 font-bold">
                  {data.totals.due > 0 ? `Ôn ${data.totals.due} từ đến hạn` : "Học tiếp lộ trình"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {data.totals.due > 0
                    ? "Ôn các từ đã tới lịch để nhớ lâu hơn."
                    : data.totals.atRisk > 0
                      ? `${data.totals.atRisk} từ sẽ đến hạn trong 24 giờ tới.`
                      : "Hôm nay bạn có thể bắt đầu một bài mới."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <LinkButton href={data.totals.due > 0 ? "/study?review=1" : "/learn"}>
                    <Icon name={data.totals.due > 0 ? "cards" : "play"} size={16} />
                    {data.totals.due > 0 ? "Bắt đầu ôn" : "Học tiếp"}
                  </LinkButton>
                  {data.totals.due === 0 && <LinkButton href="/study" variant="ghost">Ôn flashcard</LinkButton>}
                </div>
              </section>
            </div>
            <nav aria-label="Các phần tiến độ" className="flex flex-wrap gap-2">
              {[
                ["#theo-cap-hsk", "Theo cấp HSK"],
                ["#lich-hoc", "Lịch học"],
                ["#bao-cao", "Báo cáo"],
                ["/leaderboard", "Xếp hạng"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-muted hover:text-primary">{label}</Link>
              ))}
            </nav>
            <section id="theo-cap-hsk" className="scroll-mt-24" aria-labelledby="level-progress-title">
              <div className="mb-3">
                <h2 id="level-progress-title" className="font-bold">Tiến độ theo cấp HSK</h2>
                <p className="mt-1 text-sm text-muted">Mở từng cấp để xem số từ đã thuộc và cần ôn.</p>
              </div>
              {data.levels.length ? (
                <div className="panel divide-y divide-border overflow-hidden shadow-none">
                  {data.levels.map((level) => {
                    const label = level.level >= 7 ? "HSK 7–9" : `HSK ${level.level}`;
                    const band = BAND_VI[level.band] ?? level.band;
                    return (
                      <details key={level.level} open={level.level === focus?.level} className="group">
                        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden hover:bg-primary/5 sm:px-5">
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-bold">{label} · {level.nameVi}</span>
                            {band !== level.nameVi && <span className="mt-1 block text-xs text-muted">{band}</span>}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-right">
                              <span className="block text-sm font-bold tabular-nums text-primary">{Math.round(level.percentComplete)}%</span>
                              <span className="block text-xs text-muted">{level.learned}/{level.totalWords} từ</span>
                            </span>
                            <Icon name="chevron" size={16} className="shrink-0 text-muted group-open:rotate-90" />
                          </span>
                        </summary>
                        <div className="space-y-3 bg-[#fffbf8] px-4 py-4 sm:px-5">
                          <ProgressBar value={level.percentComplete} label={`Tiến độ ${label}`} />
                          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                            {[
                              ["Đã thuộc", level.learned],
                              ["Đang học", level.learning],
                              ["Đến hạn", level.due],
                              ["Chưa bắt đầu", level.notStarted],
                            ].map(([title, value]) => (
                              <div key={title}>
                                <dt className="text-muted">{title}</dt>
                                <dd className="mt-1 font-semibold">{value}</dd>
                              </div>
                            ))}
                          </dl>
                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                            {level.atRisk > 0 && <span className="text-xs text-muted">{level.atRisk} từ đến hạn trong 24 giờ</span>}
                            <Link href={`/tu-dien?level=${level.level}`} className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-primary hover:underline">
                              Xem từ vựng <Icon name="arrow" size={14} />
                            </Link>
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Chưa có tiến độ từ vựng" description="Bắt đầu một bài để xem tiến độ theo cấp HSK.">
                  <LinkButton href="/learn">Bắt đầu học <Icon name="arrow" size={16} /></LinkButton>
                </EmptyState>
              )}
            </section>
            <section id="lich-hoc" className="panel scroll-mt-24 p-4 shadow-none sm:p-5">
              <h2 className="mb-1 font-bold">Lịch học 30 ngày</h2>
              <p className="mb-4 text-sm text-muted">Mỗi ô là một ngày. Ô xanh lá đánh dấu ngày đạt mục tiêu.</p>
              <ActivityCalendar days={30} />
            </section>
            <div id="bao-cao" className="scroll-mt-24"><PeriodReport /></div>
            {!!leeches.data?.length && (
              <section>
                <SectionHeading
                  icon="target"
                  tone="accent"
                  title="Từ khó nhớ"
                  description="Những từ bạn hay quên nhất. Ôn riêng vài phút thường hiệu quả hơn là đợi tới lượt ôn thường."
                  className="mb-5"
                >
                  {/* Trước đó mục này chỉ LIỆT KÊ — xem xong không làm gì
                   * được, đúng kiểu ngõ cụt. */}
                  <LinkButton href="/study?leeches=1">
                    <Icon name="cards" size={16} /> Ôn riêng{" "}
                    {leeches.data.length} từ này
                  </LinkButton>
                </SectionHeading>
                <Card className="divide-y divide-border p-0!">
                  {leeches.data.map((l) => (
                    <div
                      key={l.word.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AudioButton src={l.word.audioUrl} size={16} />
                        <span className="hanzi text-lg shrink-0">
                          {l.word.simplified}
                        </span>
                        <span className="text-xs text-muted shrink-0">
                          {l.word.pinyin}
                        </span>
                        <span className="truncate text-sm text-muted">
                          {l.word.meaningVi}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">
                        Sai {l.lapses} lần
                      </span>
                    </div>
                  ))}
                </Card>
              </section>
            )}
            {/* Bỏ ẩn được thì người dùng mới dám ẩn. Chỉ hiện khi thật sự
             * có từ đang ẩn — không bày một mục rỗng khó hiểu. */}
            {!!suspended.data?.length && (
              <section>
                <SectionHeading
                  icon="eye"
                  tone="lavender"
                  title="Từ đã ẩn"
                  description="Những từ bạn đánh dấu là đã biết — không xuất hiện trong lượt ôn nữa. Đổi ý thì cho học lại bất cứ lúc nào."
                  className="mb-5"
                />
                <Card className="divide-y divide-border p-0!">
                  {suspended.data.map((item) => (
                    <div
                      key={item.word.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <AudioButton src={item.word.audioUrl} size={16} />
                        <span className="hanzi shrink-0 text-lg">
                          {item.word.simplified}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {item.word.pinyin}
                        </span>
                        <span className="truncate text-sm text-muted">
                          {item.word.meaningVi}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        disabled={unhiding === item.word.id}
                        onClick={() => void unhide(item.word.id)}
                      >
                        {unhiding === item.word.id ? "Đang mở…" : "Học lại"}
                      </Button>
                    </div>
                  ))}
                </Card>
              </section>
            )}
            {!!quizzes.data?.length && (
              <section>
                <SectionHeading
                  icon="check"
                  tone="lavender"
                  title="Quiz gần đây"
                  description="Kết quả các bài quiz cuối buổi ôn tập."
                  className="mb-5"
                />
                <Card className="divide-y divide-border p-0!">
                  {quizzes.data.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="text-sm text-muted">
                        {q.completedAt
                          ? new Date(q.completedAt).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </span>
                      <span className="text-sm">
                        {q.correctCount}/{q.totalQuestions} câu
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          q.scorePct >= 80
                            ? "text-good"
                            : q.scorePct >= 50
                              ? "text-warn"
                              : "text-danger"
                        }`}
                      >
                        {Math.round(q.scorePct)}%
                      </span>
                    </div>
                  ))}
                </Card>
              </section>
            )}
          </>
        )
      )}
    </div>
  );
}
