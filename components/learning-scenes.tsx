import Image from "next/image";
import styles from "./learning-scenes.module.css";

const scenes = {
  learn: { cue: "HSK · Từng bài một" },
  listening: { cue: "nǐ hǎo" },
  pronunciation: { cue: "Nghe · đọc · chỉnh thanh" },
  speaking: { cue: "你好 · Cùng trò chuyện" },
  writing: { cue: "永 · yǒng" },
  dictionary: { cue: "电脑 · diàn nǎo" },
  exam: { cue: "HSK · Luyện đề" },
  review: { cue: "你好 ↔ xin chào" },
  pinyin: { cue: "mā · má · mǎ · mà" },
  grammar: { cue: "我 + 学 + 中文" },
  video: { cue: "听 · 看 · 跟读" },
  game: { cue: "中 ↔ zhōng" },
  scan: { cue: "茶 · chá · trà" },
  hanviet: { cue: "学生 ↔ học sinh" },
} as const;
export type SceneKind = keyof typeof scenes;

/** Original generated assets, paired with real text so Chinese and pinyin stay accurate. */
export function SceneArt({ kind, compact = false, className = "", cover = false }: { kind: SceneKind; compact?: boolean; className?: string; cover?: boolean }) {
  return <div aria-hidden="true" className={`${styles.art} ${compact ? styles.compact : ""} ${cover ? styles.cover : ""} ${className}`}>
    <div className={styles.imageBox}><Image src={`/illustrations/hanni/${kind}.webp`} alt="" fill sizes={cover ? "(max-width: 640px) 45vw, 300px" : "(max-width: 640px) 90px, 260px"} className={styles.image}/></div>
    <span className={styles.cue}>{scenes[kind].cue}</span>
  </div>;
}
export function SceneCover({ kind, className }: { kind: SceneKind; className?: string }) { return <SceneArt kind={kind} cover className={className}/>; }
