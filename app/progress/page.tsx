"use client";

import {
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  Spinner,
  Stat,
} from "@/components/ui";
import { Icon } from "@/components/icon";
import { useRequireAuth } from "@/lib/auth";
import { useProgress } from "@/lib/hooks";

const BAND_VI: Record<string, string> = {
  ELEMENTARY: "Sơ cấp",
  INTERMEDIATE: "Trung cấp",
  ADVANCED: "Cao cấp",
};

export default function ProgressPage() {
  const { user, loading } = useRequireAuth();
  const { data, isLoading, error, mutate } = useProgress();
  if (loading || !user) return <Spinner />;
  return (
    <div className="page-wrap space-y-8">
      <PageHeading
        eyebrow="MỖI BƯỚC ĐỀU ĐÁNG NHỚ"
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
                tone="text-lavender bg-lavender/8"
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
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Tiến độ theo cấp HSK</h2>
                <p className="mt-1 text-sm text-muted">
                  Mỗi từ bạn nhớ đều góp vào hành trình này.
                </p>
              </div>
              {data.levels.length ? (
                <div className="space-y-4">
                  {data.levels.map((l) => (
                    <Card key={l.level}>
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
                            {l.percentComplete}%
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
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Một khởi đầu mới"
                  description="Tiến độ sẽ xuất hiện ở đây khi bạn bắt đầu học từ vựng."
                />
              )}
            </section>
          </>
        )
      )}
    </div>
  );
}
