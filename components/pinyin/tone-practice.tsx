"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { playWord } from "@/components/lesson-session/steps";
import { TONE_CLASS } from "@/components/tone-pinyin";
import { Button, LinkButton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { PinyinOverview, SyllableSound } from "@/lib/types";
import { usePinyinOverview } from "./use-pinyin";

const ROUNDS = 10;
const TONES = ["1", "2", "3", "4"] as const;

interface Question {
  base: string;
  answer: (typeof TONES)[number];
  options: { tone: (typeof TONES)[number]; sound: SyllableSound }[];
}

function makeQuiz(data: PinyinOverview): Question[] {
  // Chỉ lấy âm tiết có ≥ 3 thanh có ghi âm — 2 lựa chọn thì đoán bừa cũng đúng 50%.
  const pool = data.syllables.filter((s) => TONES.filter((t) => s.tones[t]).length >= 3);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, ROUNDS);
  return picked.map((s) => {
    const options = TONES.filter((t) => s.tones[t]).map((t) => ({ tone: t, sound: s.tones[t]! }));
    return { base: s.base, answer: options[Math.floor(Math.random() * options.length)].tone, options };
  });
}

/** Luyện tai: nghe 1 âm tiết, chọn đúng thanh. Kỹ năng người mới hay hổng
 * nhất (nghe được âm nhưng không phân biệt thanh 2 với thanh 3). */
export function TonePractice({ initial }: { initial: PinyinOverview | null }) {
  const data = usePinyinOverview(initial);
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = quiz[i];
  const done = quiz.length > 0 && i >= quiz.length;
  const sound = q?.options.find((o) => o.tone === q.answer)?.sound;

  /** Dựng đề + phát câu đầu ngay trong lượt bấm (trình duyệt chỉ cho tự phát
   * âm thanh trong sự kiện do người dùng gây ra). */
  function start() {
    if (!data) return;
    const qz = makeQuiz(data);
    setQuiz(qz);
    setI(0);
    setPicked(null);
    setScore(0);
    playWord(qz[0]?.options.find((o) => o.tone === qz[0].answer)?.sound.url);
  }
  function choose(t: string) {
    if (picked || !q) return;
    setPicked(t);
    if (t === q.answer) setScore((s) => s + 1);
  }
  function next() {
    const n = i + 1;
    setI(n);
    setPicked(null);
    const nq = quiz[n];
    if (nq) playWord(nq.options.find((o) => o.tone === nq.answer)?.sound.url);
  }

  if (quiz.length === 0)
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted">
          {ROUNDS} câu: nghe 1 âm tiết rồi chọn đúng thanh điệu. Bật loa hoặc tai nghe nhé.
        </p>
        <Button onClick={start} disabled={!data}>
          <Icon name="play" size={16} /> Bắt đầu luyện
        </Button>
      </div>
    );

  if (done)
    return (
      <div className="text-center">
        <p className="text-4xl font-extrabold">
          {score}
          <span className="text-xl text-muted">/{ROUNDS}</span>
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {score >= 8
            ? "Tai bạn bắt thanh rất tốt — sẵn sàng học từ vựng rồi!"
            : score >= 5
              ? "Khá ổn. Thanh 2 và thanh 3 dễ nhầm nhất — nghe lại bảng ở trên rồi luyện thêm lượt nữa."
              : "Bình thường thôi — ai mới học cũng vậy. Nghe kỹ 4 thanh ở đầu trang rồi thử lại nhé."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={start}>
            <Icon name="refresh" size={16} /> Luyện lượt khác
          </Button>
          <LinkButton href={user ? "/learn" : "/bat-dau?level=1"}>
            {user ? "Về lộ trình học" : "Học bài 1 HSK 1"}
            <Icon name="arrow" size={16} />
          </LinkButton>
        </div>
      </div>
    );

  if (!q || !sound) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Câu {i + 1}/{quiz.length}
        </span>
        <span>Đúng {score}</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => playWord(sound.url)}
          aria-label="Nghe lại"
          className="motion-button flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/15"
        >
          <Icon name="sound" size={34} />
        </button>
        <p className="text-sm text-muted">
          Âm tiết <strong className="text-foreground">{q.base}</strong> — thanh mấy?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.options.map((o) => {
          const state = !picked ? "idle" : o.tone === q.answer ? "right" : o.tone === picked ? "wrong" : "dim";
          return (
            <button
              key={o.tone}
              type="button"
              disabled={!!picked}
              onClick={() => choose(o.tone)}
              className={`rounded-2xl border-2 px-3 py-3 text-center transition-colors ${
                state === "idle"
                  ? "border-border bg-surface hover:border-foreground/40"
                  : state === "right"
                    ? "border-good bg-good/10"
                    : state === "wrong"
                      ? "border-danger bg-danger/10"
                      : "border-border opacity-50"
              }`}
            >
              <span className={`block text-xl font-extrabold ${TONE_CLASS[o.tone]}`}>{o.sound.mark}</span>
              <span className="text-xs text-muted">Thanh {o.tone}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <p className="text-sm">
            {picked === q.answer ? "Chính xác! " : "Chưa đúng — "}
            <span lang="zh" className="hanzi text-base">
              {sound.char}
            </span>{" "}
            đọc là <strong className={TONE_CLASS[q.answer]}>{sound.mark}</strong> (thanh {q.answer}).
          </p>
          <Button onClick={next} className="h-9 px-4!">
            {i + 1 < quiz.length ? "Câu tiếp" : "Xem kết quả"}
            <Icon name="arrow" size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
