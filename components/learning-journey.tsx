"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./icon";
import styles from "./learning-journey.module.css";

type Stage = {
  hanzi: string;
  pinyin: string;
  label: string;
  title: string;
  desc: string;
  href: string;
  action: string;
  accent: "red" | "amber";
};

const STAGES: Stage[] = [
  {
    hanzi: "拼",
    pinyin: "pīn",
    label: "Pinyin",
    title: "Làm quen với phiên âm",
    desc: "Bắt đầu từ thanh mẫu, vận mẫu và cách ghép âm. Một nền tảng nhỏ để bạn tự tin đọc những chữ Hán đầu tiên.",
    href: "/vocabulary",
    action: "Khám phá phiên âm",
    accent: "red",
  },
  {
    hanzi: "声",
    pinyin: "shēng",
    label: "Thanh điệu",
    title: "Cùng một âm, bốn thanh điệu",
    desc: "Nghe và phân biệt mā, má, mǎ, mà cùng thanh nhẹ. Luyện từng âm ngắn để phát âm rõ ngay từ đầu.",
    href: "/pronunciation",
    action: "Luyện thanh điệu",
    accent: "amber",
  },
  {
    hanzi: "字",
    pinyin: "zì",
    label: "Chữ Hán",
    title: "Nhận ra những mặt chữ quen thuộc",
    desc: "Làm quen với bộ thủ và các chữ thường gặp. Kết nối hình dáng, âm đọc và nghĩa để nhớ mặt chữ dễ hơn.",
    href: "/vocabulary",
    action: "Khám phá chữ Hán",
    accent: "amber",
  },
  {
    hanzi: "词",
    pinyin: "cí",
    label: "Từ vựng",
    title: "Tích lũy những từ đầu tiên",
    desc: "Bắt đầu với chào hỏi, con số và từ dùng hằng ngày. Lật flashcard, nghe phát âm rồi ôn lại đúng lúc.",
    href: "/study",
    action: "Ôn tập từ vựng",
    accent: "red",
  },
  {
    hanzi: "语",
    pinyin: "yǔ",
    label: "Ngữ pháp",
    title: "Ghép từ thành câu của riêng bạn",
    desc: "Nắm trật tự câu và cách dùng 了, 的, 吗. Từ các mẫu câu đơn giản, tập diễn đạt những điều quen thuộc.",
    href: "/grammar",
    action: "Khám phá mẫu câu",
    accent: "red",
  },
  {
    hanzi: "听",
    pinyin: "tīng",
    label: "Nghe & nói",
    title: "Nghe hiểu, rồi tự tin cất lời",
    desc: "Nghe từng đoạn ngắn và nhắc lại theo giọng mẫu. Quen với nhịp điệu tiếng Trung qua một chút luyện tập mỗi ngày.",
    href: "/listening",
    action: "Bắt đầu luyện nghe",
    accent: "amber",
  },
];

export function LearningJourney() {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = STAGES[active];

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % STAGES.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + STAGES.length) % STAGES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = STAGES.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section aria-labelledby={`${id}-heading`} className={styles.journey}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>
            <Icon name="route" size={14} /> NỀN TẢNG TIẾNG TRUNG
          </p>
          <h2 id={`${id}-heading`}>Sáu chặng, một khởi đầu vững vàng</h2>
        </div>
        <span className={styles.hint}>Chọn một chặng để khám phá</span>
      </div>

      <div
        role="tablist"
        aria-label="Sáu chặng học tiếng Trung"
        className={styles.stages}
      >
        {STAGES.map((item, index) => (
          <button
            key={item.hanzi}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            className={styles.stage}
            data-accent={item.accent}
            onClick={() => setActive(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className={styles.number}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span lang="zh" className={`hanzi ${styles.character}`}>
              {item.hanzi}
            </span>
            <span className={styles.stageLabel}>{item.label}</span>
            <span className={styles.pinyin}>{item.pinyin}</span>
          </button>
        ))}
      </div>

      {STAGES.map((item, index) => (
        <div
          key={item.hanzi}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={active !== index}
          tabIndex={0}
          className={styles.detail}
        >
          <div className={styles.detailCopy}>
            <span className={styles.detailStep}>
              CHẶNG {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
          <Link href={item.href} className={styles.action}>
            {item.action}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      ))}
      <span className="sr-only" aria-live="polite">
        Chặng {active + 1}: {stage.label}
      </span>
    </section>
  );
}
