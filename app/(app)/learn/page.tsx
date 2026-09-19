"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FeatureTour, type TourStep } from "@/components/feature-tour";
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
  ProgressBar,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useLearnPath } from "@/lib/hooks";
import styles from "./learn.module.css";

const LEARN_TOUR_STEPS: TourStep[] = [
  {
    icon: "route",
    title: "Chọn cấp độ HSK",
    description:
      "Chuyển giữa các cấp HSK để xem lộ trình bài học riêng của từng cấp — cấp đề xuất dựa trên khảo sát ban đầu của bạn đã được chọn sẵn.",
  },
  {
    icon: "spark",
    title: "Sáu chặng học tiếng Trung",
    description:
      "拼声字词语听 — Pinyin, thanh điệu, chữ Hán, từ vựng, ngữ pháp, rồi nghe & nói. Bấm vào từng chặng để xem tổng quan cách Hanni dẫn dắt bạn.",
  },
  {
    icon: "cards",
    title: "Bài học theo chủ đề",
    description:
      "Mỗi cấp chia thành nhiều bài theo chủ đề thực tế. Hoàn thành bài này để mở bài tiếp theo, hoặc bấm Ôn tập hôm nay để ôn flashcard.",
  },
];

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
      <FeatureTour tourKey="learn" steps={LEARN_TOUR_STEPS} />

      <section className={styles.pageIntro} aria-labelledby="learn-page-title">
        <div className={styles.introCopy}>
          <p className={styles.introEyebrow}>
            <span className={styles.introDot} aria-hidden="true" />
            LỘ TRÌNH HỌC TIẾNG TRUNG
          </p>
          <h1 id="learn-page-title">Mỗi ngày một bước, bạn sẽ tiến xa hơn</h1>
          <p>
            Đi theo đúng thứ tự: chọn cấp HSK, học bài đang mở, rồi ôn lại để
            nhớ lâu hơn. Bạn không cần học hết mọi thứ trong một lần.
          </p>
        </div>
        <div className={styles.introActions}>
          <div className={styles.introPromise}>
            <span className={styles.promiseIcon}>
              <Icon name="clock" size={16} />
            </span>
            <span>
              <strong>15 phút mỗi ngày</strong>
              <small>đều đặn là đủ để bắt đầu</small>
            </span>
          </div>
          <LinkButton href="/study" variant="secondary">
            <Icon name="cards" size={17} /> Ôn tập hôm nay
          </LinkButton>
        </div>
      </section>

      {data && data.lessons.length > 0 && !error && (
        <section
          className={styles.nextCard}
          aria-labelledby="next-lesson-heading"
          aria-busy={switchingLevel}
          inert={switchingLevel}
        >
          <div className={styles.nextTopline}>
            <span className={styles.nextLabel}>
              <span aria-hidden="true" /> BƯỚC TIẾP THEO CỦA BẠN
            </span>
            <span className={styles.nextLevel}>
              HSK {data.level === 7 ? "7–9" : data.level} · {data.levelName}
            </span>
          </div>
          <div className={styles.nextLayout}>
            <div className={styles.nextCopy}>
              <span className={styles.nextNumber} aria-hidden="true">
                {currentLesson?.orderIndex ?? "✓"}
              </span>
              <div>
                <h2 id="next-lesson-heading">
                  {currentLesson?.title ?? `Bạn đã hoàn thành ${data.levelName}`}
                </h2>
                <p>
                  {currentLesson
                    ? `${currentLesson.wordCount} từ vựng mới đang chờ bạn. Mình học tiếp từ nơi đã dừng lại nhé.`
                    : "Ôn lại những từ đã học hoặc chọn một cấp độ mới để tiếp tục khám phá."}
                </p>
              </div>
            </div>
            <LinkButton
              href={currentLesson ? `/learn/${currentLesson.id}` : "/study"}
              className={styles.nextAction}
            >
              {currentLesson
                ? currentLesson.status === "IN_PROGRESS"
                  ? "Tiếp tục bài học"
                  : "Bắt đầu bài học"
                : "Ôn lại từ đã học"}
              <Icon name="arrow" size={16} />
            </LinkButton>
          </div>
          <div className={styles.nextFooter}>
            <span lang="zh" className={`hanzi ${styles.previewWords}`}>
              {currentLesson?.previewWords.slice(0, 4).join(" · ") ??
                "学 · 习 · 进 · 步"}
            </span>
            <div className={styles.nextProgress}>
              <div className={styles.nextProgressMeta}>
                <span>Tiến độ HSK {data.level === 7 ? "7–9" : data.level}</span>
                <strong>{Math.round(pct)}%</strong>
              </div>
              <ProgressBar value={pct} label="Tiến độ cấp HSK" />
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="hsk-lessons-heading" className={styles.pathBoard}>
        <div className={styles.pathHeader}>
          <div>
            <p className={styles.pathEyebrow}>
              <Icon name="route" size={14} /> LỘ TRÌNH CỦA BẠN
            </p>
            <h2 id="hsk-lessons-heading">
              {activeLevel
                ? `HSK ${activeLevel === 7 ? "7–9" : activeLevel}`
                : "Chọn cấp độ để bắt đầu"}
            </h2>
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

        <div className={styles.flowSteps} aria-label="Cách học với Hanni">
          <div className={styles.flowStep} data-active="true">
            <span>01</span>
            <div>
              <strong>Chọn cấp HSK</strong>
              <small>Bắt đầu vừa sức</small>
            </div>
          </div>
          <span className={styles.flowConnector} aria-hidden="true" />
          <div className={styles.flowStep}>
            <span>02</span>
            <div>
              <strong>Học từng bài</strong>
              <small>Học từ mới theo chủ đề</small>
            </div>
          </div>
          <span className={styles.flowConnector} aria-hidden="true" />
          <div className={styles.flowStep}>
            <span>03</span>
            <div>
              <strong>Ôn để nhớ lâu</strong>
              <small>Ôn lại đúng lúc</small>
            </div>
          </div>
        </div>

        <LearningJourney embedded />
        <div className={styles.boardDivider} />

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
              <div className={styles.lessonColumn}>
                <div className={styles.lessonHeading}>
                  <div>
                    <p>CHẶNG HIỆN TẠI</p>
                    <h3>
                      <Icon name="book" size={16} /> {data.levelName}
                    </h3>
                  </div>
                  <span>{data.totalLessons} bài học</span>
                </div>
                <LessonPath
                  lessons={data.lessons}
                  currentLessonId={data.currentLessonId}
                />
              </div>
              <aside className={styles.sidebar}>
                <div className={styles.progressCard}>
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
                    className={styles.progressLink}
                  >
                    Xem tiến độ <Icon name="arrow" size={15} />
                  </LinkButton>
                </div>
                <div className={styles.tip}>
                  <span className="icon-tile shrink-0">
                    <Icon name="spark" size={20} />
                  </span>
                  <div>
                    <h3>Mẹo cho người mới</h3>
                    <p>
                      Học xong một bài, nghe lại vài từ và ôn khi Hanni nhắc.
                      Không cần học thật nhanh — chỉ cần giữ nhịp.
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
