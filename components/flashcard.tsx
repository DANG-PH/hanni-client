"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioButton } from "./audio-button";
import { Icon } from "./icon";
import { mediaUrl } from "@/lib/api";
import type { Rating, Word } from "@/lib/types";
import styles from "./flashcard.module.css";

/** Nhãn nói KẾT QUẢ của lựa chọn, không chỉ mô tả cảm giác.
 *
 * Trước đây hint là "Cần học lại" / "Cần gợi ý" / "Nhớ được từ" / "Nhớ chắc
 * chắn" — người học không biết chọn cái nào dẫn tới điều gì, nên phân vân
 * giữa "Hơi khó" và "Đã nhớ" mà không có cơ sở nào để quyết. Nói thẳng "gặp
 * lại khi nào" thì lựa chọn trở nên rõ ràng: đây chính là thứ người dùng
 * đang thật sự quyết định. */
const RATINGS: { key: Rating; label: string; hint: string; cls: string }[] = [
  {
    key: "AGAIN",
    label: "Chưa nhớ",
    hint: "Gặp lại ngay",
    cls: styles.again,
  },
  {
    key: "HARD",
    label: "Hơi khó",
    hint: "Gặp lại sớm",
    cls: styles.hard,
  },
  {
    key: "GOOD",
    label: "Đã nhớ",
    hint: "Gặp lại sau vài ngày",
    cls: styles.good,
  },
  {
    key: "EASY",
    label: "Rất dễ",
    hint: "Gặp lại lâu hơn nữa",
    cls: styles.easy,
  },
];

export function Flashcard({
  word,
  isNew,
  onRate,
  busy = false,
}: {
  word: Word;
  isNew: boolean;
  onRate: (rating: Rating, durationMs: number) => void;
  busy?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [start] = useState(() => Date.now());
  const revealButton = useRef<HTMLButtonElement>(null);
  const flipBackButton = useRef<HTMLButtonElement>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const example = word.examples?.[0];

  const reveal = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    const u = mediaUrl(word.audioUrl);
    if (u) {
      try {
        player.current = new Audio(u);
        void player.current.play().catch(() => undefined);
      } catch {
        /* Vẫn cho phép học tiếp khi trình duyệt chưa phát được âm thanh. */
      }
    }
  }, [revealed, word.audioUrl]);

  useEffect(() => {
    return () => player.current?.pause();
  }, []);

  useEffect(() => {
    if (revealed) {
      flipBackButton.current?.focus({ preventScroll: true });
    } else {
      revealButton.current?.focus({ preventScroll: true });
    }
  }, [revealed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target.closest(
          "input, textarea, select, button, a, [contenteditable], [role='textbox']",
        )
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (revealed) {
          setRevealed(false);
        } else {
          reveal();
        }
      }
      const rating = RATINGS[Number(e.key) - 1];
      if (revealed && !busy && rating) {
        e.preventDefault();
        onRate(rating.key, Date.now() - start);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, busy, onRate, start, reveal]);

  return (
    <div className={styles.session} aria-busy={busy}>
      <div className={styles.metadata}>
        <span className={styles.level}>
          <Icon name="cards" size={16} />
          HSK {word.hskLevel}
        </span>
        <span className={`${styles.state} ${isNew ? styles.newWord : ""}`}>
          {isNew ? "Từ mới" : "Ôn lại"}
        </span>
      </div>

      <div className={styles.deck} data-flipped={revealed}>
        <div className={styles.inner}>
          {/* Hai mặt dùng chung một ô lưới để ví dụ dài không bị cắt. */}
          <div
            className={`${styles.face} ${styles.front}`}
            inert={revealed}
            aria-hidden={revealed}
          >
            <button
              ref={revealButton}
              type="button"
              onClick={reveal}
              aria-label={`Xem nghĩa của ${word.simplified}`}
              className={styles.revealButton}
              tabIndex={revealed ? -1 : 0}
            />
            <span className={styles.cardCorner} aria-hidden="true">
              <Icon name="spark" size={19} />
            </span>
            <p className={styles.prompt}>Bạn còn nhớ từ này chứ?</p>
            <div lang="zh" className={`hanzi ${styles.character}`}>
              {word.simplified}
            </div>
            <div className={styles.pronunciation}>
              {word.pinyin}
              <span className={styles.audio}>
                <AudioButton src={word.audioUrl} />
              </span>
            </div>
            <div className={styles.revealHint}>
              <Icon name="refresh" size={15} />
              Chạm để lật{" "}
              <span>
                hoặc <kbd>Space</kbd>
              </span>
            </div>
          </div>

          <div
            className={`${styles.face} ${styles.back}`}
            inert={!revealed}
            aria-hidden={!revealed}
            aria-label={`Đáp án: ${word.meaningVi ?? word.meaningEn ?? "Nghĩa đang được cập nhật"}`}
          >
            <button
              ref={flipBackButton}
              type="button"
              onClick={() => setRevealed(false)}
              aria-label="Lật về mặt trước"
              className={styles.flipBackButton}
              tabIndex={revealed ? 0 : -1}
            />
            <div className={styles.answerWord}>
              <span lang="zh" className="hanzi">
                {word.simplified}
              </span>
              <span className={styles.answerPinyin}>{word.pinyin}</span>
              <span className={styles.audio}>
                <AudioButton src={word.audioUrl} />
              </span>
            </div>
            <div className={styles.meaning}>
              <p>
                {word.meaningVi ?? word.meaningEn ?? "Nghĩa đang được cập nhật"}
              </p>
              {word.pos.length > 0 && (
                <span className={styles.partOfSpeech}>
                  {word.pos.join(" · ")}
                </span>
              )}
              {word.hanViet && (
                <span className={styles.hanViet}>Hán Việt: {word.hanViet}</span>
              )}
            </div>
            {example && (
              <div className={styles.example}>
                <span className={styles.exampleLabel}>Trong một câu</span>
                <p lang="zh" className={`hanzi ${styles.exampleHanzi}`}>
                  {example.zh}
                </p>
                {example.pinyin && (
                  <p className={styles.examplePinyin}>{example.pinyin}</p>
                )}
                {(example.vi || example.en) && (
                  <p>{example.vi ?? example.en}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.ratingPanel}>
        <p className={styles.ratingPrompt} aria-live="polite">
          {revealed
            ? "Bạn nhớ từ này đến đâu? Hanni dựa vào đây để xếp lịch ôn."
            : "Thử nhớ nghĩa, rồi lật thẻ để tự đánh giá"}
        </p>
        {/* Chưa lật thì ẩn hẳn 4 nút: trước đó chúng hiện ra dạng xám mờ,
         * người mới nhìn vào không biết là gì và có bấm được không. */}
        <div className={styles.ratings} hidden={!revealed}>
          {RATINGS.map((r, i) => (
            <button
              key={r.key}
              disabled={busy || !revealed}
              onClick={() => onRate(r.key, Date.now() - start)}
              type="button"
              className={`${styles.rating} ${r.cls}`}
            >
              <span className={styles.ratingLabel}>{r.label}</span>
              <span className={styles.ratingHint}>{r.hint}</span>
              <kbd className={styles.ratingKey}>{i + 1}</kbd>
            </button>
          ))}
        </div>
      </div>
      <p role="status" className={styles.saveStatus}>
        {busy ? "Đang lưu kết quả…" : ""}
      </p>
    </div>
  );
}
