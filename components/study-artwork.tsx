"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./icon";
import styles from "./study-artwork.module.css";

const words = [
  { hanzi: "世界", pinyin: "shì jiè", hanviet: "thế giới", meaning: "thế giới", note: "Âm Hán Việt và nghĩa của từ này giống nhau." },
  { hanzi: "学习", pinyin: "xué xí", hanviet: "học tập", meaning: "học tập", note: "Gắn cách đọc mới với một nghĩa quen thuộc." },
  { hanzi: "电脑", pinyin: "diàn nǎo", hanviet: "điện não", meaning: "máy tính", note: "Hình dung một bộ não chạy bằng điện để nhớ từ." },
];

/** Bản học thử độc lập với tiến độ của người học. */
export function StudyArtwork() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[index];

  function next() {
    setIndex((current) => (current + 1) % words.length);
    setFlipped(false);
  }

  return (
    <section className={styles.scene} aria-label="Thử một thẻ từ Hanni">
      <header className={styles.top}>
        <span><Icon name="cards" size={16} /> Thử một thẻ từ</span>
        <span aria-live="polite">{index + 1} / {words.length}</span>
      </header>
      <button
        type="button"
        className={styles.wordCard}
        aria-pressed={flipped}
        aria-label={flipped ? `Xem lại chữ ${word.hanzi}` : `Xem nghĩa của ${word.hanzi}`}
        onClick={() => setFlipped(!flipped)}
      >
        <span className={styles.cardLabel}>{flipped ? "NGHĨA TIẾNG VIỆT" : "BẠN CÓ NHẬN RA TỪ NÀY?"}</span>
        <span lang="zh" className={`${styles.word} hanzi`}>{word.hanzi}</span>
        <span className={styles.pinyin}>{word.pinyin}</span>
        <span className={styles.answer}>
          {flipped ? (
            <span className={styles.translation} aria-live="polite">
              <strong>{word.meaning}</strong>
              <span>Hán Việt · {word.hanviet}</span>
            </span>
          ) : (
            <span className={styles.tap}><Icon name="cards" size={15} /> Xem nghĩa</span>
          )}
        </span>
      </button>
      <footer className={styles.bottom}>
        <Image src="/illustrations/hanni/home-guide.webp" alt="" width={72} height={56} className={styles.fox} />
        <p>{flipped ? word.note : "Thử nối chữ Hán với một từ bạn đã biết."}</p>
        <button type="button" onClick={next} aria-label="Xem thẻ từ tiếp theo">
          <Icon name="arrow" size={20} />
        </button>
      </footer>
    </section>
  );
}
