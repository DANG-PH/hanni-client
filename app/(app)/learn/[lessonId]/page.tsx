"use client";

import Link from "next/link";
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
  SectionHeading,
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

  const { lesson, words, relatedGrammar } = data;
  const examples = words.flatMap((word) =>
    (word.examples ?? []).map((example) => ({
      ...example,
      word: word.simplified,
    })),
  );
  // Bỏ khoá bài (2026-09-22) nghĩa là người học nhảy vào bài bất kỳ, nên
  // trang bài học phải tự nói được "mình đang ở đâu trong bài này" — trước
  // đó nút luôn ghi "Bắt đầu học" kể cả khi đã học dở nửa bài.
  const startedWords = words.filter(
    (word) => word.progressState && word.progressState !== "NEW",
  ).length;
  const startLabel = startedWords > 0 ? "Học tiếp" : "Bắt đầu học";

  return (
    <div className="page-wrap space-y-6">
      <LinkButton href="/learn" variant="ghost" className="-ml-4">
        <Icon name="back" size={16} /> Lộ trình HSK{" "}
        <span className="px-1 text-border">/</span> HSK{" "}
        {lesson.hskLevel === 7 ? "7–9" : lesson.hskLevel}
      </LinkButton>
      <PageHeading
        icon="book"
        eyebrow={`Bài ${String(lesson.orderIndex).padStart(2, "0")} · HSK ${lesson.hskLevel === 7 ? "7–9" : lesson.hskLevel}`}
        title={lesson.title}
        description="Làm quen với từ mới, lắng nghe cách đọc và khám phá cách dùng trong từng ví dụ."
      >
        {words.length > 0 && (
          <LinkButton href={`/study?lesson=${lesson.id}`}>
            <Icon name="play" size={16} /> {startLabel}
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
              {examples.length > 0 && (
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
              )}
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
                      {/* Ảnh minh hoạ nếu có — bài theo chủ đề cụ thể (Đồ ăn,
                       * Gia đình, Đồ vật) phủ gần kín, biến trang bài học từ
                       * một bức tường chữ thành thứ nhìn được. */}
                      {word.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={word.imageUrl}
                          alt=""
                          loading="lazy"
                          className="mt-0.5 h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                        />
                      )}
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
              examples.length > 0 &&
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
              ))}
          </div>
        </section>
        <aside className="space-y-5 lg:sticky lg:top-24">
          <Card>
            <span className="icon-tile mb-4 h-12! w-12!">
              <Icon name="book" size={23} />
            </span>
            {/* Thẻ này TRƯỚC ĐÂY lặp lại đúng nút "Bắt đầu học" đã có ở tiêu
             * đề trang — 2 nút giống hệt nhau cùng hiện trên một màn hình.
             * Giữ nút chính ở tiêu đề, thẻ này chỉ còn phần KHÁC: luyện nghe
             * và luyện phát âm đúng từ vựng của bài. */}
            <h2 className="text-lg font-semibold">Luyện thêm với bài này</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Học xong từ vựng thì nghe lại và đọc to — cùng bộ từ của bài,
              không phải từ ngẫu nhiên.
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
              {examples.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Ví dụ</dt>
                  <dd className="font-semibold">{examples.length} câu</dd>
                </div>
              )}
              {words.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Đã học</dt>
                  <dd className="font-semibold">
                    {startedWords}/{words.length} từ
                  </dd>
                </div>
              )}
              {relatedGrammar.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Ngữ pháp liên quan</dt>
                  <dd className="font-semibold">{relatedGrammar.length}</dd>
                </div>
              )}
            </dl>
            {words.length > 0 && (
              <div className="mt-5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <LinkButton
                    href={`/listening?lesson=${lesson.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    <Icon name="headphones" size={16} /> Luyện nghe
                  </LinkButton>
                  <LinkButton
                    href={`/pronunciation?lesson=${lesson.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    <Icon name="mic" size={16} /> Luyện phát âm
                  </LinkButton>
                </div>
              </div>
            )}
          </Card>
          {relatedGrammar.length > 0 && (
            <Card>
              <SectionHeading
                icon="cards"
                eyebrow="Dùng ngay trong bài này"
                title="Ngữ pháp liên quan"
                tone="lavender"
              />
              <ul className="mt-4 space-y-2">
                {relatedGrammar.map((point) => (
                  <li key={point.slug}>
                    <Link
                      href={`/ngu-phap/${point.slug}`}
                      className="motion-button flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-surface-2"
                    >
                      <span lang="zh" className="hanzi text-lg text-primary">
                        {point.titleZh}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {point.titleVi}
                      </span>
                      <Icon
                        name="arrow"
                        size={14}
                        className="shrink-0 text-muted"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
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
