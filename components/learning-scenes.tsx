import Image from "next/image";
import styles from "./learning-scenes.module.css";

export type SceneKind = "learn" | "listening" | "pronunciation" | "speaking" | "writing" | "dictionary" | "exam" | "review" | "pinyin" | "grammar" | "video" | "game" | "scan" | "hanviet";

/** Foregrounds sit in an original generated studio, never inside another outlined card. */
export function SceneArt({ kind, compact = false, className = "", cover = false }: { kind: SceneKind; compact?: boolean; className?: string; cover?: boolean }) {
  const studio = ["listening", "pronunciation", "speaking", "video"].includes(kind) ? "audio-studio" : "paper-studio";
  return <div aria-hidden="true" className={`${styles.art} ${compact ? styles.compact : ""} ${cover ? styles.cover : ""} ${className}`}>
    {cover && <Image src={`/illustrations/hanni/backgrounds/${studio}.webp`} alt="" fill sizes="(max-width: 640px) 45vw, 300px" className={styles.stage}/>}
    <div className={styles.imageBox}><Image src={`/illustrations/hanni/${kind}.webp`} alt="" fill sizes={cover ? "(max-width: 640px) 45vw, 300px" : className.includes("cultural-intro-art") ? "(max-width: 640px) 85vw, 280px" : "(max-width: 767px) 88px, 160px"} className={styles.image}/></div>
  </div>;
}
export function SceneCover({ kind, className }: { kind: SceneKind; className?: string }) { return <SceneArt kind={kind} cover className={className}/>; }
