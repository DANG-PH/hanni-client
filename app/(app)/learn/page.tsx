"use client";

import { Suspense, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import { LearningJourney } from "@/components/learning-journey";
import { LessonPath } from "@/components/lesson-path";
import { SelectionGroup } from "@/components/selection-group";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath } from "@/lib/hooks";
import styles from "./learn.module.css";

function LearnContent({ initialLevel }: { initialLevel?: number }) {
  const { user, loading } = useRequireAuth();
  const [level, setLevel] = useState<number | undefined>(initialLevel);
  const { data, isLoading, error, mutate } = useLearnPath(level);

  if (loading || !user) return <Spinner />;

  const activeLevel = level ?? data?.level;
  const pct = data?.totalLessons
    ? Math.min(
        100,
        Math.max(0, (data.completedLessons / data.totalLessons) * 100),
      )
    : 0;
  const currentLesson =
    data?.lessons.find(
      (lesson) =>
        lesson.id === data.currentLessonId && lesson.status !== "LOCKED",
    ) ??
    data?.lessons.find(
      (lesson) =>
        lesson.status === "IN_PROGRESS" || lesson.status === "AVAILABLE",
    );
  const totalWords =
    data?.lessons.reduce((total, lesson) => total + lesson.wordCount, 0) ?? 0;
  // Giữ bố cục khi đổi cấp, chặn bài cũ đến khi dữ liệu mới tải xong.
  const switchingLevel = isLoading && !!data;

  return (
    <div className={`page-wrap ${styles.page}`}>
      <PageHeading
        icon="route"
        eyebrow="LỘ TRÌNH HSK"
        title="Từng bước nhỏ, tiến bộ mỗi ngày"
        description="Chọn cấp độ của bạn. Học một bài mới, ôn một chút và tiến thêm một bước."
      >
        <LinkButton href="/study" variant="secondary">
          <Icon name="cards" size={17} /> Ôn tập hôm nay
        </LinkButton>
      </PageHeading>

      {data && data.lessons.length > 0 && !error && (
        <section
          className={styles.continueCard}
          aria-label="Tiếp tục hành trình"
          aria-busy={switchingLevel}
          inert={switchingLevel}
        >
          <div className={styles.continueCopy}>
            <span className={styles.continueLabel}>
              <span />{" "}
              {currentLesson
                ? "BƯỚC TIẾP THEO CỦA BẠN"
                : "MỘT CHẶNG ĐƯỜNG ĐÁNG NHỚ"}
            </span>
            <h2>
              {currentLesson?.title ?? `Bạn đã hoàn thành ${data.levelName}`}
            </h2>
            <p>
              {currentLesson
                ? `${currentLesson.wordCount} từ vựng mới đang chờ bạn. Tiếp tục từ nơi bạn đã dừng lại.`
                : "Ôn lại những từ đã học hoặc chọn một cấp độ mới để tiếp tục khám phá."}
            </p>
            <div className={styles.continueActions}>
              <LinkButton
                href={currentLesson ? `/learn/${currentLesson.id}` : "/study"}
              >
                {currentLesson
                  ? currentLesson.status === "IN_PROGRESS"
                    ? "Tiếp tục bài học"
                    : "Bắt đầu bài học"
                  : "Ôn lại từ đã học"}
                <Icon name="arrow" size={16} />
              </LinkButton>
              {currentLesson && (
                <span lang="zh" className={`hanzi ${styles.previewWords}`}>
                  {currentLesson.previewWords.slice(0, 4).join(" · ")}
                </span>
              )}
            </div>
          </div>
          <div className={styles.progressTile}>
            <div
              className={styles.progressRing}
              style={{ "--progress": `${pct}%` } as CSSProperties}
              aria-hidden="true"
            >
              <span lang="zh" className="hanzi">
                学
              </span>
            </div>
            <div>
              <p className={styles.progressLevel}>
                HSK {data.level === 7 ? "7–9" : data.level}
              </p>
              <p className={styles.progressValue}>
                {Math.round(pct)}% <span>hoàn thành</span>
              </p>
              <p className={styles.progressCount}>
                {data.completedLessons}/{data.totalLessons} bài học
              </p>
            </div>
          </div>
        </section>
      )}

      <LearningJourney />

      <section aria-labelledby="hsk-lessons-heading" className={styles.course}>
        <div className={styles.courseHeading}>
          <div>
            <h2 id="hsk-lessons-heading">Lộ trình theo cấp độ</h2>
            <p>Hoàn thành từng bài để mở bước tiếp theo.</p>
          </div>
          {!!data?.levels.length && (
            <SelectionGroup
              label="Chọn cấp độ HSK"
              value={activeLevel}
              className={styles.levels}
            >
              {data.levels.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLevel(item)}
                  aria-pressed={activeLevel === item}
                  className={styles.level}
                >
                  {item === 7 ? "HSK 7–9" : `HSK ${item}`}
                </button>
              ))}
            </SelectionGroup>
          )}
        </div>

        {error ? (
          <Card className="space-y-4">
            <ErrorNote>Chưa tải được lộ trình học. Vui lòng thử lại.</ErrorNote>
            <Button variant="secondary" onClick={() => void mutate()}>
              <Icon name="refresh" size={16} /> Tải lại lộ trình
            </Button>
          </Card>
        ) : !data ? (
          <div role="status" className={styles.skeleton}>
            <span className="sr-only">Đang tải lộ trình học…</span>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : !data.lessons.length ? (
          <EmptyState
            title="Bài học đang được chuẩn bị"
            description="Cấp độ này chưa có bài học. Bạn có thể chọn cấp độ khác hoặc khám phá thư viện từ vựng."
          >
            <LinkButton href="/vocabulary">
              Khám phá từ vựng <Icon name="arrow" size={16} />
            </LinkButton>
          </EmptyState>
        ) : (
          <div className={styles.courseBody} aria-busy={isLoading}>
            {switchingLevel && (
              <span role="status" className={styles.loadingNote}>
                Đang tải HSK {activeLevel === 7 ? "7–9" : activeLevel}…
              </span>
            )}
            <div
              className={styles.courseGrid}
              data-loading={switchingLevel || undefined}
              inert={switchingLevel}
            >
              <div className="min-w-0 space-y-4">
                <div className={styles.lessonHeading}>
                  <span>
                    <Icon name="book" size={16} /> {data.levelName}
                  </span>
                  <span>{data.totalLessons} bài học</span>
                </div>
                <LessonPath lessons={data.lessons} />
              </div>
              <aside className={styles.sidebar}>
                <Card>
                  <p className={styles.asideLabel}>
                    <Icon name="chart" size={16} /> TIẾN ĐỘ CỦA BẠN
                  </p>
                  <div className={styles.stats}>
                    <div>
                      <strong>
                        {data.completedLessons}
                        <span>/{data.totalLessons}</span>
                      </strong>
                      <p>Bài đã hoàn thành</p>
                    </div>
                    <div>
                      <strong>{totalWords.toLocaleString("vi-VN")}</strong>
                      <p>Từ trong lộ trình</p>
                    </div>
                  </div>
                  <ProgressBar value={pct} label="Tiến độ cấp HSK" />
                  <LinkButton
                    href="/progress"
                    variant="ghost"
                    className="mt-3 -ml-4"
                  >
                    Xem tiến độ <Icon name="arrow" size={15} />
                  </LinkButton>
                </Card>
                <div className={styles.tip}>
                  <span className="icon-tile shrink-0">
                    <Icon name="spark" size={20} />
                  </span>
                  <div>
                    <h3>Một chút mỗi ngày</h3>
                    <p>
                      Nghe phát âm, đọc ví dụ rồi thử nhớ nghĩa. Ôn lại các từ
                      đến hạn để nhớ lâu hơn.
                    </p>
                  </div>
                </div>
                <LinkButton
                  href="/exams"
                  variant="secondary"
                  className="w-full"
                >
                  <Icon name="target" size={16} /> Thử sức với bài kiểm tra
                </LinkButton>
              </aside>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function LearnRoute() {
  const value = Number(useSearchParams().get("level"));
  const level =
    Number.isInteger(value) && value >= 1 && value <= 9 ? value : undefined;
  return <LearnContent key={level ?? "default"} initialLevel={level} />;
}

export default function LearnPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LearnRoute />
    </Suspense>
  );
}
