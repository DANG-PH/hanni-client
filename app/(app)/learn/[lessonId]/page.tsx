"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { useLesson } from "@/lib/hooks";

export default function LessonDetailPage() {
  const { user, loading } = useRequireAuth();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data, isLoading, error, mutate } = useLesson(lessonId);
  const [tab, setTab] = useState<"words" | "examples">("words");
  const [showMeanings, setShowMeanings] = useState(true);

  if (loading || !user) return <Spinner />;
  if (error)
    return (
      <div className="page-wrap space-y-5">
        <LinkButton href="/learn" variant="ghost">
          <Icon name="back" size={16} /> Lộ trình HSK
        </LinkButton>
        <ErrorNote>
          {error instanceof ApiError && error.status === 404
            ? "Không tìm thấy bài học này. Hãy chọn một bài khác trong lộ trình."
            : "Chưa tải được bài học. Vui lòng thử lại."}
        </ErrorNote>
        <Button variant="secondary" onClick={() => void mutate()}>
          Tải lại bài học
        </Button>
      </div>
    );
  if (isLoading || !data) return <Spinner />;

  const { lesson, words } = data;
  const examples = words.flatMap((word) =>
    (word.examples ?? []).map((example) => ({
      ...example,
      word: word.simplified,
    })),
  );

  return (
    <div className="page-wrap space-y-6">
      <LinkButton href="/learn" variant="ghost" className="-ml-4">
        <Icon name="back" size={16} /> Lộ trình HSK{" "}
        <span className="px-1 text-border">/</span> HSK{" "}
        {lesson.hskLevel === 7 ? "7–9" : lesson.hskLevel}
      </LinkButton>
      <PageHeading
        eyebrow={`BÀI ${String(lesson.orderIndex).padStart(2, "0")} · HSK ${lesson.hskLevel === 7 ? "7–9" : lesson.hskLevel}`}
        title={lesson.title}
        description="Làm quen với từ mới, lắng nghe cách đọc và khám phá cách dùng trong từng ví dụ."
      >
        {words.length > 0 && (
          <LinkButton href={`/study?lesson=${lesson.id}`}>
            <Icon name="play" size={16} /> Bắt đầu học
          </LinkButton>
        )}
      </PageHeading>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-2">
            <div
              className="flex gap-1"
              role="tablist"
              aria-label="Nội dung bài học"
            >
              <button
                id="lesson-words-tab"
                role="tab"
                aria-selected={tab === "words"}
                aria-controls="lesson-content"
                onClick={() => setTab("words")}
                className={`motion-button rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "words" ? "bg-primary/8 text-primary" : "text-muted hover:bg-surface-2"}`}
              >
                Từ vựng{" "}
                <span className="ml-1 text-xs opacity-70">{words.length}</span>
              </button>
              <button
                id="lesson-examples-tab"
                role="tab"
                aria-selected={tab === "examples"}
                aria-controls="lesson-content"
                onClick={() => setTab("examples")}
                className={`motion-button rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "examples" ? "bg-primary/8 text-primary" : "text-muted hover:bg-surface-2"}`}
              >
                Ví dụ{" "}
                <span className="ml-1 text-xs opacity-70">
                  {examples.length}
                </span>
              </button>
            </div>
            <Button
              variant="ghost"
              className="min-h-9! px-3! text-xs!"
              aria-pressed={!showMeanings}
              onClick={() => setShowMeanings(!showMeanings)}
            >
              {showMeanings ? "Ẩn nghĩa để tự ôn" : "Hiện nghĩa"}
            </Button>
          </div>
          <div
            id="lesson-content"
            role="tabpanel"
            aria-labelledby={
              tab === "words" ? "lesson-words-tab" : "lesson-examples-tab"
            }
            className="space-y-3"
          >
            {tab === "words" &&
              (words.length ? (
                words.map((word, index) => (
                  <article
                    key={word.id}
                    className="reveal hover-card panel p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 lang="zh" className="hanzi break-all text-3xl">
                            {word.simplified}
                          </h2>
                          <AudioButton
                            src={word.audioUrl}
                            className="bg-primary/6 text-primary!"
                          />
                          {word.pos.length > 0 && (
                            <span className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-muted">
                              {word.pos.join(" · ")}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-primary">
                          {word.pinyin}
                        </p>
                        {showMeanings ? (
                          <p className="mt-2 text-sm font-medium leading-6">
                            {word.meaningVi ??
                              word.meaningEn ??
                              "Nghĩa đang được cập nhật"}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm italic text-muted">
                            Thử nhớ nghĩa của từ này
                          </p>
                        )}
                        {word.examples?.[0] && (
                          <div className="mt-4 border-l-2 border-primary/20 pl-4">
                            <p lang="zh" className="hanzi text-lg leading-7">
                              {word.examples[0].zh}
                            </p>
                            {showMeanings &&
                              (word.examples[0].vi || word.examples[0].en) && (
                                <p className="mt-1 text-xs leading-5 text-muted">
                                  {word.examples[0].vi ?? word.examples[0].en}
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Chưa có từ vựng"
                  description="Nội dung bài học này đang được bổ sung. Hãy chọn bài khác trong lộ trình."
                />
              ))}
            {tab === "examples" &&
              (examples.length ? (
                examples.map((example) => (
                  <Card key={example.id} className="space-y-3">
                    <span
                      lang="zh"
                      className="hanzi inline-flex rounded-lg bg-primary/8 px-2.5 py-1 text-sm text-primary"
                    >
                      {example.word}
                    </span>
                    <p lang="zh" className="hanzi text-2xl leading-relaxed">
                      {example.zh}
                    </p>
                    {example.pinyin && (
                      <p className="text-sm text-primary">{example.pinyin}</p>
                    )}
                    {showMeanings && (example.vi || example.en) && (
                      <p className="text-sm leading-6 text-muted">
                        {example.vi ?? example.en}
                      </p>
                    )}
                  </Card>
                ))
              ) : (
                <EmptyState
                  title="Ví dụ đang được bổ sung"
                  description="Bạn vẫn có thể nghe phát âm và học các từ vựng có sẵn trong bài."
                />
              ))}
          </div>
        </section>
        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <span className="icon-tile mb-4 h-12! w-12!">
              <Icon name="book" size={23} />
            </span>
            <h2 className="text-lg font-semibold">Sẵn sàng vào bài?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Đọc trước từ vựng rồi luyện ghi nhớ bằng flashcard theo nhịp độ
              của bạn.
            </p>
            <dl className="mt-5 space-y-3 border-y border-border py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Cấp độ</dt>
                <dd className="font-semibold">
                  HSK {lesson.hskLevel === 7 ? "7–9" : lesson.hskLevel}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Từ vựng</dt>
                <dd className="font-semibold">{words.length} từ</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Ví dụ</dt>
                <dd className="font-semibold">{examples.length} câu</dd>
              </div>
            </dl>
            {words.length > 0 && (
              <LinkButton
                href={`/study?lesson=${lesson.id}`}
                className="mt-5 w-full"
              >
                <Icon name="cards" size={17} /> Học với flashcard
              </LinkButton>
            )}
          </Card>
          <div className="rounded-2xl border border-primary/15 bg-primary/4 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Icon name="sound" size={18} /> Nghe, đọc, ghi nhớ
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Nhấn biểu tượng loa bên cạnh từ để nghe bản phát âm có sẵn. Thử
              đọc theo và dùng tính năng ẩn nghĩa để tự kiểm tra.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
