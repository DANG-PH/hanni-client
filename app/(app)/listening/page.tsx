"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, ErrorNote, ProgressBar } from "@/components/ui";
import {
  PracticeLibrary,
  PracticeTips,
} from "@/components/practice/practice-library";
import { useWordAudio } from "@/components/practice/use-word-audio";
import type { Word } from "@/lib/types";

export default function ListeningPage() {
  return (
    <PracticeLibrary
      skill="listening"
      title="Nghe mỗi ngày, hiểu thêm một chút"
      description="Lắng nghe, viết lại từ bạn nghe được và đối chiếu với đáp án. Bắt đầu từ cấp HSK phù hợp với bạn."
    >
      {(words) => <ListeningSession words={words} />}
    </PracticeLibrary>
  );
}

function ListeningSession({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { value: string; correct: boolean }>
  >({});
  const completed = Object.keys(answers).length;
  const correct = Object.values(answers).filter(
    (answer) => answer.correct,
  ).length;
  const word = words[index];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <Card>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">NGHE & VIẾT</p>
              <h2 className="mt-1 font-semibold">Bạn vừa nghe từ gì?</h2>
            </div>
            <span className="rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              {index + 1} / {words.length}
            </span>
          </div>
          <ListeningWord
            key={word.id}
            word={word}
            saved={answers[word.id]}
            onCheck={(value, isCorrect) =>
              setAnswers((current) => ({
                ...current,
                [word.id]: { value, correct: isCorrect },
              }))
            }
          />
        </Card>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <Icon name="back" size={16} />
            Từ trước
          </Button>
          <Button
            disabled={index === words.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            Từ tiếp theo
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>

      <PracticeTips
        title="Nghe hiệu quả hơn"
        tips={[
          "Nghe lần đầu ở tốc độ thường, tập trung vào âm đầu và thanh điệu.",
          "Thử nghe chậm hơn nếu cần, sau đó nhập Hán tự bạn nhận ra.",
          "Đối chiếu đáp án rồi đọc lại thành tiếng để ghi nhớ từ.",
        ]}
      >
        <Card>
          <h2 className="text-sm font-semibold">Tiến độ nhóm từ này</h2>
          <p className="mb-3 mt-5 text-3xl font-semibold">
            {completed}
            <span className="ml-1 text-sm font-normal text-muted">
              / {words.length} từ
            </span>
          </p>
          <ProgressBar
            value={(completed / words.length) * 100}
            label="Từ đã luyện nghe trong nhóm này"
          />
          <div className="mt-5 flex justify-between text-sm">
            <span className="text-muted">Trả lời đúng</span>
            <span className="font-semibold text-good">{correct}</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Kết quả luyện nghe được giữ trong nhóm từ đang mở.
          </p>
        </Card>
      </PracticeTips>
    </div>
  );
}

function ListeningWord({
  word,
  saved,
  onCheck,
}: {
  word: Word;
  saved?: { value: string; correct: boolean };
  onCheck: (value: string, correct: boolean) => void;
}) {
  const [value, setValue] = useState(saved?.value ?? "");
  const [rate, setRate] = useState(1);
  const [hint, setHint] = useState(false);
  const audio = useWordAudio(word.simplified, word.audioUrl);
  const checked = saved !== undefined;
  const normalize = (input: string) =>
    input.normalize("NFKC").replace(/[\s。！？.!?,，、]/g, "");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-[#161d2c] p-6 text-center text-white sm:p-8">
        <div
          aria-hidden="true"
          className="mb-4 flex h-10 items-center justify-center gap-1.5 text-white/40"
        >
          {[12, 23, 16, 32, 24, 38, 17, 27, 36, 18, 29, 13, 24].map(
            (height, i) => (
              <span
                key={i}
                className={`w-1 rounded-full ${audio.playing ? "bg-[#ff8679] motion-safe:animate-pulse" : "bg-white/25"}`}
                style={{ height, animationDelay: `${i * 60}ms` }}
              />
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (audio.playing) audio.stop();
            else audio.play(rate);
          }}
          aria-label={audio.playing ? "Dừng âm thanh" : "Nghe từ cần luyện"}
          className="motion-button mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg shadow-black/10 transition-transform hover:scale-105"
        >
          <Icon name={audio.playing ? "close" : "play"} size={27} />
        </button>
        <p aria-live="polite" className="mt-4 text-sm font-medium">
          {audio.playing ? "Đang phát âm thanh…" : "Nhấn để nghe từ vựng"}
        </p>
        <p className="mt-2 text-xs text-white/55">
          {audio.synthetic
            ? "Giọng đọc tiếng Trung của thiết bị"
            : "Bản thu phát âm từ thư viện"}
        </p>
      </div>
      {audio.error && <ErrorNote>{audio.error}</ErrorNote>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Tốc độ phát"
          className="flex items-center gap-2"
        >
          <span className="mr-1 text-xs text-muted">Tốc độ</span>
          {[0.75, 1, 1.25].map((speed) => (
            <button
              key={speed}
              type="button"
              aria-pressed={rate === speed}
              onClick={() => {
                audio.stop();
                setRate(speed);
              }}
              className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors ${rate === speed ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted hover:text-primary"}`}
            >
              {speed}×
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setHint(!hint)}
          aria-expanded={hint}
          aria-controls="listening-hint"
          className="min-h-9 text-xs font-medium text-muted hover:text-primary"
        >
          {hint ? "Ẩn gợi ý" : "Xem gợi ý pinyin"}
        </button>
      </div>
      {hint && (
        <p
          id="listening-hint"
          className="rounded-xl bg-primary/5 px-4 py-3 text-center text-lg font-medium text-primary"
        >
          {word.pinyin}
        </p>
      )}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.trim() || checked || !audio.hasPlayed) return;
          const answer = normalize(value);
          onCheck(
            value,
            answer === normalize(word.simplified) ||
              Boolean(
                word.traditional && answer === normalize(word.traditional),
              ),
          );
        }}
      >
        <label
          htmlFor="listening-answer"
          className="block text-sm font-semibold"
        >
          Viết Hán tự bạn nghe được
        </label>
        <input
          id="listening-answer"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={checked}
          placeholder="Nhập câu trả lời của bạn…"
          autoComplete="off"
          className="field"
          required
        />
        {!audio.hasPlayed && !checked && (
          <p className="text-xs text-muted">
            Nhấn nghe trước khi kiểm tra đáp án.
          </p>
        )}
        {!checked && (
          <Button type="submit" disabled={!value.trim() || !audio.hasPlayed}>
            <Icon name="check" size={16} />
            Kiểm tra đáp án
          </Button>
        )}
      </form>

      {checked && (
        <div
          role="status"
          className={`rounded-xl border p-5 ${saved.correct ? "border-good/20 bg-good/5" : "border-primary/20 bg-primary/5"}`}
        >
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${saved.correct ? "text-good" : "text-primary"}`}
          >
            <Icon name={saved.correct ? "check" : "info"} size={18} />
            {saved.correct
              ? "Chính xác, bạn nghe rất tốt!"
              : "Cùng nghe lại và ghi nhớ từ này"}
          </p>
          <p lang="zh" className="hanzi mt-4 text-3xl">
            {word.simplified}
          </p>
          <p className="mt-2 text-sm text-primary">{word.pinyin}</p>
          <p className="mt-2 text-sm text-muted">
            {word.meaningVi ??
              word.meaningEn ??
              "Nghĩa của từ đang được cập nhật."}
          </p>
        </div>
      )}
    </div>
  );
}
