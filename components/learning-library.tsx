import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./learning-library.module.css";

type LibrarySection = "vocabulary" | "grammar" | "exams";

const sections: { id: LibrarySection; label: string; icon: IconName }[] = [
  { id: "vocabulary", label: "Từ vựng", icon: "book" },
  { id: "grammar", label: "Ngữ pháp & mẫu câu", icon: "cards" },
  { id: "exams", label: "Kiểm tra HSK", icon: "target" },
];

export function LearningHeader({
  section,
  eyebrow,
  title,
  description,
  children,
}: {
  section: LibrarySection;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const artwork = {
    vocabulary: {
      word: "你好",
      pinyin: "nǐ hǎo",
      meaning: "Một lời chào, một khởi đầu.",
      stamp: "词",
    },
    grammar: {
      word: "我爱中文",
      pinyin: "wǒ ài Zhōngwén",
      meaning: "Tôi yêu tiếng Trung.",
      stamp: "句",
    },
    exams: {
      word: "加油",
      pinyin: "jiā yóu",
      meaning: "Cố lên, bạn làm được!",
      stamp: "试",
    },
  }[section];

  return (
    <>
      <nav className={styles.sectionNav} aria-label="Thư viện học tập">
        {sections.map((item) => (
          <Link
            key={item.id}
            href={`/${item.id}`}
            aria-current={item.id === section ? "page" : undefined}
          >
            <Icon name={item.icon} size={17} />
            {item.label}
          </Link>
        ))}
      </nav>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span />
            {eyebrow}
          </p>
          <h1>{title}</h1>
          <p className={styles.heroDescription}>{description}</p>
          {children && <div className={styles.heroActions}>{children}</div>}
        </div>
        <div className={styles.artwork} aria-hidden="true">
          <span className={styles.artworkRing} />
          <div className={styles.paperBack} />
          <div className={styles.paper}>
            <div className={styles.paperLabel}>
              HANNI <span>· 每天进步一点</span>
            </div>
            <span lang="zh" className={`hanzi ${styles.paperWord}`}>
              {artwork.word}
            </span>
            <span className={styles.paperPinyin}>{artwork.pinyin}</span>
            <span className={styles.paperMeaning}>{artwork.meaning}</span>
            <span lang="zh" className={`hanzi ${styles.seal}`}>
              {artwork.stamp}
            </span>
          </div>
          <span className={styles.artworkSpark}>
            <Icon name="spark" size={23} />
          </span>
        </div>
      </header>
    </>
  );
}

export function LevelFilter({
  options,
  value,
  onChange,
}: {
  options: { value: number | undefined; label: string; count?: number }[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className={styles.levels} role="group" aria-label="Lọc theo cấp HSK">
      {options.map((option) => (
        <button
          key={option.value ?? "all"}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function LearningTip({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.tip}>
      <span className={styles.tipIcon}>
        <Icon name="spark" size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <div className={styles.tipCopy}>{children}</div>
      </div>
    </div>
  );
}
