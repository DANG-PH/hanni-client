"use client";

import { useState } from "react";
import { Icon } from "./icon";
import Image from "next/image";
import { SceneBackground } from "./scene-background";
import styles from "./study-artwork.module.css";

const words = [
  { hanzi: "世界", pinyin: "shì jiè", hanviet: "thế giới", meaning: "thế giới", note: "Một từ tiếng Trung bạn đã biết qua âm Hán Việt." },
  { hanzi: "学习", pinyin: "xué xí", hanviet: "học tập", meaning: "học tập", note: "Gắn cách đọc mới với một nghĩa thật quen." },
  { hanzi: "电脑", pinyin: "diàn nǎo", hanviet: "điện não", meaning: "máy tính", note: "“Bộ não chạy bằng điện” — một cách liên tưởng để nhớ từ." },
];

/** A working vocabulary preview, explicitly separate from saved learning progress. */
export function StudyArtwork() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[index];
  function next() { setIndex((index + 1) % words.length); setFlipped(false); }
  return (
    <section className={styles.scene} aria-label="Thử một thẻ từ Hanni">
      <SceneBackground kind="home-study-room" eager />
      <div className={styles.top}><span><i/>THỬ MỘT THẺ TỪ</span><span>Ví dụ {index + 1}/{words.length}</span></div>
      <button type="button" className={`${styles.wordCard} ${flipped ? styles.flipped : ""}`} aria-pressed={flipped} aria-label={flipped ? `Xem lại chữ ${word.hanzi}` : `Xem nghĩa của ${word.hanzi}`} onClick={() => setFlipped(!flipped)}>
        <span className={styles.cardLabel}>{flipped ? "KẾT NỐI VỚI TIẾNG VIỆT" : "BẠN CÓ NHẬN RA TỪ NÀY?"}</span>
        <span lang="zh" className={`${styles.word} hanzi`}>{word.hanzi}</span>
        <span className={styles.pinyin}>{word.pinyin}</span>
        {flipped ? <span className={styles.translation} aria-live="polite"><span>Hán Việt: <b>{word.hanviet}</b></span><strong>{word.meaning}</strong></span> : <span className={styles.tap}><Icon name="cards" size={15}/>Chạm để xem nghĩa</span>}
      </button>
      <div className={styles.bottom}><p>{flipped ? word.note : "Từ một chữ quen, mở ra một ngôn ngữ mới."}</p><button type="button" onClick={next} aria-label="Xem thẻ từ tiếp theo"><Icon name="arrow" size={19}/></button></div>
      <div className={styles.fox} aria-hidden="true"><Image src="/illustrations/hanni/home-guide.webp" alt="" width={154} height={154} priority className={styles.foxImage}/></div>
    </section>
  );
}
