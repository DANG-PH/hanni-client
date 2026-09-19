"use client";

import Link from "next/link";
import { ActivityCalendar } from "@/components/activity-calendar";
import { AudioButton } from "@/components/audio-button";
import {
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
import { useRequireAuth } from "@/lib/auth";
import { useLeeches, useProgress, useRecentQuizzes } from "@/lib/hooks";

const BAND_VI: Record<string, string> = {
  ELEMENTARY: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Cao cấp",
};

export default function ProgressPage() {
  const { user, loading } = useRequireAuth();
  const { data, isLoading, error, mutate } = useProgress();
  const quizzes = useRecentQuizzes();
  const leeches = useLeeches();
  if (loading || !user) return <Spinner />;
  const completion = data?.totals.totalWords
    ? Math.round((data.totals.learned / data.totals.totalWords) * 100)
    : 0;
  return (
    <div className="page-wrap space-y-8">
      <PageHeading
        icon="chart"
        tone="good"
        eyebrow="Hành trình của bạn"
        title="Tiến độ học tập"
        description="Nhìn lại những gì đã học và biết mình cần tập trung vào đâu."
      >
        <LinkButton href="/study">
          <Icon name="cards" size={17} />
          Tiếp tục ôn tập
        </LinkButton>
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
              <Card className="flex flex-wrap items-center gap-6">
                <div
                  role="img"
                  aria-label={`Đã thuộc ${completion}% từ vựng trong các cấp`}
                  className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--primary) ${Math.min(100, Math.max(0, completion))}%, var(--surface-2) 0)`,
                  }}
                >
                  <div className="absolute inset-2 rounded-full bg-surface" />
                  <div className="relative text-center">
                    <span className="text-2xl font-semibold">
                      {completion}%
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted">Đã ghi nhớ</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow mb-2">VỐN TỪ TÍCH LŨY</p>
                  <h2 className="text-xl font-semibold">
                    {data.totals.learned.toLocaleString("vi-VN")} từ đã thuộc
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Trong {data.totals.totalWords.toLocaleString("vi-VN")} từ
                    vựng thuộc các cấp học. Mỗi lần ôn là một lần nhớ vững hơn.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Một từ chỉ tính “đã thuộc” khi ôn đều và đạt chu kỳ ôn ≥ 21
                    ngày — cần vài tuần ôn đặn mới thấy % này tăng. Số từ
                    “Đang học” bên dưới tăng nhanh hơn nhiều.
                  </p>
                </div>
              </Card>
              <Card className="border-primary/15 bg-primary/5!">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Icon name="spark" size={19} />
                  <h2 className="text-sm font-semibold">Gợi ý cho hôm nay</h2>
                </div>
                <p className="text-base font-semibold">
                  {data.totals.atRisk > 0
                    ? `Củng cố ${data.totals.atRisk} từ sắp quên`
                    : data.totals.due > 0
                      ? `Bạn có ${data.totals.due} từ đến lịch ôn`
                      : "Sẵn sàng cho một bài học mới"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {data.totals.due > 0 || data.totals.atRisk > 0
                    ? "Mở buổi ôn tập để gặp lại các từ theo lịch học của bạn."
                    : "Khám phá bài tiếp theo trong lộ trình để mở rộng vốn từ."}
                </p>
                <Link
                  href={
                    data.totals.due > 0 || data.totals.atRisk > 0
                      ? "/study"
                      : "/learn"
                  }
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  {data.totals.due > 0 || data.totals.atRisk > 0
                    ? "Mở buổi ôn tập"
                    : "Đến lộ trình HSK"}
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
                label="Sắp quên"
                value={data.totals.atRisk}
                icon="refresh"
                tone="text-warn bg-warn/8"
                hint="Ưu tiên củng cố thêm"
              />
            </div>
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
                  description="Những từ bạn hay quên nhất — chú ý hơn khi gặp lại trong lượt ôn."
                  className="mb-5"
                />
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
                          ? new Date(q.completedAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
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
                            ? `${l.atRisk} từ cần củng cố thêm`
                            : l.learned > 0
                              ? "Tiếp tục duy trì nhịp ôn tập của bạn"
                              : "Bắt đầu với những từ đầu tiên"}
                        </span>
                        <Link
                          href={`/vocabulary?level=${l.level}`}
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
