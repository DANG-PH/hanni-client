"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Button, Card, EmptyState, ErrorNote } from "@/components/ui";
import {
  PracticeLibrary,
  PracticeTips,
} from "@/components/practice/practice-library";
import { useWordAudio } from "@/components/practice/use-word-audio";
import type { Word, WordExample } from "@/lib/types";

export default function GrammarPage() {
  return (
    <PracticeLibrary
      skill="grammar"
      title="Hiểu cách dùng, đặt câu tự nhiên"
      description="Khám phá ngữ pháp qua câu ví dụ trong thư viện từ vựng. Quan sát vị trí của từ, đọc thành tiếng và đối chiếu bản dịch."
    >
      {(words) => <GrammarExamples words={words} />}
    </PracticeLibrary>
  );
}

function GrammarExamples({ words }: { words: Word[] }) {
  const examples = words.flatMap((word) =>
    (word.examples ?? [])
      .filter((example) => example.zh.trim())
      .map((example) => ({ word, example })),
  );
  const [showPinyin, setShowPinyin] = useState(true);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <Card className="border-primary/15 bg-primary/3">
          <div className="flex items-start gap-4">
            <span className="icon-tile shrink-0">
              <Icon name="book" size={23} />
            </span>
            <div>
              <p className="eyebrow">NGỮ PHÁP QUA NGỮ CẢNH</p>
              <h2 className="mt-1 text-lg font-semibold">
                Bắt đầu từ một câu hoàn chỉnh
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Từ vựng trở nên dễ nhớ hơn khi có ngữ cảnh. Những câu bên dưới
                là ví dụ đi kèm từ trong thư viện của Hanni.
              </p>
            </div>
          </div>
        </Card>

        {examples.length ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                {examples.length} câu ví dụ trong nhóm này
              </h2>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={showPinyin}
                  onChange={(event) => setShowPinyin(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Hiện pinyin
              </label>
            </div>
            {examples.map(({ word, example }, i) => (
              <ExampleCard
                key={`${word.id}-${example.id}`}
                word={word}
                example={example}
                index={i + 1}
                showPinyin={showPinyin}
              />
            ))}
          </>
        ) : (
          <EmptyState
            title="Nhóm từ này chưa có câu ví dụ"
            description="Bạn vẫn có thể luyện nghe và ôn từ vựng ở cấp này. Hãy thử nhóm từ kế tiếp hoặc một cấp HSK khác để tìm câu ví dụ."
          >
            <Link
              href="/vocabulary"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Khám phá từ vựng
              <Icon name="arrow" size={16} />
            </Link>
          </EmptyState>
        )}
      </div>

      <PracticeTips
        title="Học từ câu, nhớ cách dùng"
        tips={[
          "Đọc cả câu, thử đoán ý nghĩa trước khi mở bản dịch.",
          "Chú ý từ đang học nằm ở đâu và đi cùng những từ nào.",
          "Đọc thành tiếng rồi thử tự đặt một câu có cách dùng tương tự.",
        ]}
      >
        <Card>
          <h2 className="text-sm font-semibold">Nội dung bạn đang học</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-2xl font-semibold">{words.length}</p>
              <p className="mt-1 text-[11px] text-muted">Từ trong nhóm</p>
            </div>
            <div className="rounded-xl bg-primary/6 p-3">
              <p className="text-2xl font-semibold text-primary">
                {examples.length}
              </p>
              <p className="mt-1 text-[11px] text-muted">Câu ví dụ</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Phần này tập trung vào cách dùng từ trong câu. Hiện mục này chưa có
            bài giảng quy tắc ngữ pháp riêng.
          </p>
        </Card>
      </PracticeTips>
    </div>
  );
}

function ExampleCard({
  word,
  example,
  index,
  showPinyin,
}: {
  word: Word;
  example: WordExample;
  index: number;
  showPinyin: boolean;
}) {
  const [translationVisible, setTranslationVisible] = useState(false);
  const audio = useWordAudio(example.zh);
  const translation = example.vi ?? example.en;
  const pieces = example.zh.split(word.simplified);

  return (
    <Card className="hover-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-xs font-semibold text-muted">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium">
            Cách dùng{" "}
            <span lang="zh" className="text-primary">
              {word.simplified}
            </span>
          </span>
        </div>
        <span className="rounded-md bg-primary/7 px-2 py-1 text-[10px] font-semibold text-primary">
          HSK {word.hskLevel}
        </span>
      </div>
      <p lang="zh" className="hanzi mt-6 text-2xl leading-relaxed sm:text-3xl">
        {pieces.map((piece, i) => (
          <span key={i}>
            {i > 0 && (
              <mark className="rounded bg-primary/10 px-0.5 text-primary">
                {word.simplified}
              </mark>
            )}
            {piece}
          </span>
        ))}
      </p>
      {showPinyin && example.pinyin && (
        <p className="mt-3 text-sm leading-6 text-muted">{example.pinyin}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button variant="secondary" onClick={() => audio.play(0.9)}>
          <Icon name="sound" size={16} />
          Nghe câu
        </Button>
        {translation && (
          <Button
            variant="ghost"
            onClick={() => setTranslationVisible(!translationVisible)}
            aria-expanded={translationVisible}
            aria-controls={`translation-${word.id}-${example.id}`}
          >
            {translationVisible ? "Ẩn bản dịch" : "Xem bản dịch"}
          </Button>
        )}
      </div>
      <p className="mt-2 text-[10px] text-muted">
        Âm thanh sử dụng giọng đọc tiếng Trung của thiết bị.
      </p>
      {translationVisible && translation && (
        <div
          id={`translation-${word.id}-${example.id}`}
          className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm leading-6"
        >
          <p>{translation}</p>
          {!example.vi && example.en && (
            <p className="mt-1 text-[11px] text-muted">Bản dịch tiếng Anh</p>
          )}
        </div>
      )}
      {!translation && (
        <p className="mt-3 text-xs text-muted">
          Bản dịch của câu đang được cập nhật.
        </p>
      )}
      {audio.error && (
        <div className="mt-4">
          <ErrorNote>{audio.error}</ErrorNote>
        </div>
      )}
    </Card>
  );
}
