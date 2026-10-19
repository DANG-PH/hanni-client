"use client";

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
  Stat,
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
      '"Đang học" là vốn từ bạn đã chạm tới; "Đến hạn ôn" là việc cần làm hôm nay; "Ôn trong 24 giờ" là từ sắp tới lịch ôn; "Đã thuộc" chỉ tính từ đã ôn đúng khoảng 21 ngày nên tăng chậm nhất.',
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
        tone="good"
        eyebrow="Hành trình của bạn"
        title="Tiến độ học tập"
        description="Bạn đã học được gì và nên ôn gì tiếp."
      >
        <LinkButton href="/study">
          <Icon name="cards" size={17} />
          Tiếp tục ôn tập
        </LinkButton>
        {/* Huy hiệu không có mục riêng ở sidebar (xem lib/nav.ts) — cùng trả
         * lời "mình đang ở đâu" với trang này nên gom lối vào tại đây. */}
        <LinkButton href="/achievements" variant="secondary">
          <Icon name="trophy" size={17} />
          Huy hiệu
        </LinkButton>
        {/* Điện thoại: "Xếp hạng" đã có trong menu "Thêm" — 4 nút ở đầu trang tràn thành 2 hàng. */}
        <LinkButton href="/leaderboard" variant="secondary" className="max-sm:hidden">
          <Icon name="flame" size={17} />
          Bảng xếp hạng
        </LinkButton>
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
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <p className="eyebrow">Vốn từ của bạn</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-4xl font-extrabold tracking-tight">{touched.toLocaleString("vi-VN")}</span>
                  <span className="text-base font-semibold">từ đã học</span>
                  <span className="text-sm text-muted">· {data.totals.learned.toLocaleString("vi-VN")} từ đã thuộc</span>
                </p>
                {focus && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold">{focus.level >= 7 ? "HSK 7–9" : `HSK ${focus.level}`}</span>
                      <span className="text-muted">
                        {(focus.learned + focus.learning).toLocaleString("vi-VN")}/{focus.totalWords.toLocaleString("vi-VN")} từ
                      </span>
                    </div>
                    <div
                      role="img"
                      aria-label={`HSK ${focus.level}: ${focus.learned} từ đã thuộc, ${focus.learning} từ đang học, trên ${focus.totalWords} từ`}
                      className="flex h-3 overflow-hidden rounded-full bg-surface-2"
                    >
                      <span className="bg-good" style={{ width: `${(focus.learned / Math.max(1, focus.totalWords)) * 100}%` }} />
                      <span className="bg-primary/70" style={{ width: `${(focus.learning / Math.max(1, focus.totalWords)) * 100}%` }} />
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-good" /> Đã thuộc
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary/70" /> Đang học
                      </span>
                      <span>“Đã thuộc” = ôn đúng đủ khoảng 21 ngày</span>
                    </p>
                  </div>
                )}
              </Card>
              <Card className="border-primary/15 bg-primary/5!">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Icon name="spark" size={19} />
                  <h2 className="text-sm font-semibold">Gợi ý cho hôm nay</h2>
                </div>
                {/* Chỉ giục ôn khi có từ ĐẾN HẠN thật — từ ôn trong 24 giờ tới thì để mai, hôm nay học bài mới. */}
                <p className="text-base font-semibold">
                  {data.totals.due > 0
                    ? `Bạn có ${data.totals.due} từ đến lịch ôn`
                    : "Hôm nay học thêm một bài mới"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {data.totals.due > 0
                    ? "Ôn đúng lúc sắp quên là cách nhớ lâu nhất."
                    : data.totals.atRisk > 0
                      ? `${data.totals.atRisk} từ sẽ đến hạn ôn trong 24 giờ tới — Hanni sẽ nhắc.`
                      : "Chưa có từ nào đến hạn ôn."}
                </p>
                <Link
                  href={data.totals.due > 0 ? "/study?review=1" : "/learn"}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {data.totals.due > 0 ? "Mở buổi ôn tập" : "Học tiếp lộ trình"}
                  <Icon name="arrow" size={16} />
                </Link>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat
                label="Đã thuộc"
                value={data.totals.learned}
                icon="check"
                tone="text-good bg-good/8"
                hint="Vốn từ đã ghi nhớ"
              />
              <Stat
                label="Đang học"
                value={data.totals.learning}
                icon="book"
                hint="Từng bước làm quen"
              />
              <Stat
                label="Đến hạn ôn"
                value={data.totals.due}
                icon="clock"
                hint="Cần gặp lại hôm nay"
              />
              <Stat
                label="Ôn trong 24 giờ"
                value={data.totals.atRisk}
                icon="refresh"
                tone="text-warn bg-warn/8"
                hint="Sắp tới lịch ôn"
              />
            </div>
            <PeriodReport />
            <section>
              <SectionHeading
                icon="clock"
                tone="accent"
                title="Lịch hoạt động 30 ngày"
                description="Mỗi ô là 1 ngày — đậm dần theo mức độ ôn tập, xanh lá khi đạt mục tiêu ngày."
                className="mb-5"
              />
              <Card>
                <ActivityCalendar days={30} />
              </Card>
            </section>
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
            <section>
              <SectionHeading
                icon="chart"
                tone="good"
                title="Tiến độ theo cấp HSK"
                description="Mỗi từ bạn nhớ đều góp vào hành trình này."
                className="mb-5"
              />
              {data.levels.length ? (
                <div className="space-y-4">
                  {data.levels.map((l) => (
                    <Card key={l.level} className="hover-card">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="icon-tile text-base font-semibold">
                            {String(l.level).padStart(2, "0")}
                          </span>
                          <div>
                            <h3 className="font-semibold">
                              HSK {l.level} · {l.nameVi}
                            </h3>
                            <p className="mt-1 text-xs text-muted">
                              {BAND_VI[l.band] ?? l.band}
                            </p>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-xl font-semibold text-primary">
                            {Math.round(l.percentComplete)}%
                          </span>
                          <p className="mt-1 text-xs text-muted">
                            {l.learned} / {l.totalWords} từ đã thuộc
                          </p>
                        </div>
                      </div>
                      <ProgressBar
                        value={l.percentComplete}
                        label={`Tiến độ HSK ${l.level}`}
                      />
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-4">
                        {[
                          {
                            title: "Đã thuộc",
                            value: l.learned,
                            color: "bg-good",
                          },
                          {
                            title: "Đang học",
                            value: l.learning,
                            color: "bg-primary",
                          },
                          { title: "Đến hạn", value: l.due, color: "bg-warn" },
                          {
                            title: "Chưa bắt đầu",
                            value: l.notStarted,
                            color: "bg-muted/40",
                          },
                        ].map((s) => (
                          <span
                            key={s.title}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${s.color}`}
                            />
                            {s.title}:{" "}
                            <span className="font-medium text-foreground">
                              {s.value}
                            </span>
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
                        <span className="text-muted">
                          {l.atRisk > 0
                            ? `${l.atRisk} từ ôn trong 24 giờ tới`
                            : l.learned > 0
                              ? "Tiếp tục duy trì nhịp ôn tập của bạn"
                              : "Bắt đầu với những từ đầu tiên"}
                        </span>
                        <Link
                          href={`/tu-dien?level=${l.level}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-primary"
                        >
                          Khám phá từ vựng <Icon name="arrow" size={14} />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Một khởi đầu mới"
                  description="Tiến độ sẽ xuất hiện ở đây khi bạn bắt đầu học từ vựng."
                >
                  <LinkButton href="/learn">
                    Bắt đầu lộ trình <Icon name="arrow" size={16} />
                  </LinkButton>
                </EmptyState>
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
