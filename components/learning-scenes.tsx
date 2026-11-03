import Image from "next/image";
import { Icon, type IconName } from "./icon";
import styles from "./learning-scenes.module.css";

const pictures = {
  learn: "study-journey",
  listening: "listening-practice",
  pronunciation: "pronunciation-practice",
  speaking: "cafe-conversation",
  writing: "handwriting-practice",
  dictionary: "dictionary-reference",
  exam: "exam-preparation",
} as const;
const graphics = {
  review: { icon: "cards", items: ["你好", "xin chào"], label: "Gặp từ · nhớ nghĩa" },
  pinyin: { icon: "sound", items: ["mā", "má", "mǎ", "mà"], label: "Bốn thanh điệu" },
  grammar: { icon: "book", items: ["我", "学", "中文"], label: "Chủ ngữ · động từ · tân ngữ" },
  video: { icon: "play", items: ["听", "看", "跟读"], label: "Nghe · xem · đọc theo" },
  game: { icon: "trophy", items: ["中", "zhōng"], label: "Ghép chữ với cách đọc" },
  scan: { icon: "camera", items: ["茶", "chá"], label: "Chụp chữ · tra từ" },
  hanviet: { icon: "heart", items: ["学生", "học sinh"], label: "Kết nối âm Hán Việt" },
} satisfies Record<string, { icon: IconName; items: string[]; label: string }>;
export type SceneKind = keyof typeof pictures | keyof typeof graphics;

/** These previews illustrate the specific learning action, never an unrelated scenic fallback. */
export function SceneArt({ kind, compact = false, className = "", cover = false }: { kind: SceneKind; compact?: boolean; className?: string; cover?: boolean }) {
  const picture = kind in pictures ? pictures[kind as keyof typeof pictures] : null;
  const graphic = kind in graphics ? graphics[kind as keyof typeof graphics] : null;
  return (
    <div aria-hidden="true" className={`${styles.art} ${compact ? styles.compact : ""} ${cover ? styles.cover : ""} ${className}`}>
      {picture ? <Image src={`/illustrations/${picture}.webp`} alt="" fill sizes={cover ? "(max-width: 640px) 45vw, 300px" : "(max-width: 640px) 90vw, 360px"} className={styles.image} /> : graphic && (
        <div className={`${styles.graphic} ${styles[kind] ?? ""}`}>
          <span className={styles.graphicIcon}><Icon name={graphic.icon} size={20} /></span>
          <div className={styles.examples}>{graphic.items.map(item => <span key={item} className="hanzi">{item}</span>)}</div>
          <span className={styles.graphicLabel}>{graphic.label}</span>
        </div>
      )}
    </div>
  );
}

export function SceneCover({ kind, className }: { kind: SceneKind; className?: string }) {
  return <SceneArt kind={kind} cover className={className} />;
}
