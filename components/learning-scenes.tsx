import Image from "next/image";
import styles from "./learning-scenes.module.css";

export type SceneKind = "learn" | "listening" | "pronunciation" | "speaking" | "writing" | "dictionary" | "exam" | "review" | "pinyin" | "grammar" | "video" | "game" | "scan" | "hanviet"
  | "ranking" | "classroom" | "progress" | "account" | "awards" | "library" | "practice" | "archives";

/** Foregrounds sit in an original generated studio, with the same framing for each tool. */
export function SceneArt({ kind, compact = false, className = "", cover = false, sizes }: { kind: SceneKind; compact?: boolean; className?: string; cover?: boolean; sizes?: string }) {
  return <div aria-hidden="true" className={`${styles.art} ${compact ? styles.compact : ""} ${cover ? styles.cover : ""} ${className}`}>
    {cover && <Image src="/illustrations/hanni/backgrounds/paper-studio.webp" alt="" fill sizes="(max-width: 640px) 45vw, 300px" className={styles.stage}/>}
    <div className={styles.imageBox}><Image src={`/illustrations/hanni/${kind}.webp`} alt="" fill sizes={sizes ?? (cover ? "(max-width: 640px) 45vw, 300px" : "(max-width: 767px) 88px, 160px")} className={styles.image}/></div>
  </div>;
}
export function SceneCover({ kind, className }: { kind: SceneKind; className?: string }) { return <SceneArt kind={kind} cover className={className}/>; }
