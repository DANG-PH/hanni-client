import Image from "next/image";
import styles from "./scene-background.module.css";

export type BackgroundKind = "lesson-journey" | "review-desk" | "dictionary-room" | "home-study-room";

/** Places original study environments behind the content without cropping the subject. */
export function SceneBackground({ kind, eager = false }: { kind: BackgroundKind; eager?: boolean }) {
  const edge = kind !== "home-study-room";
  return <div aria-hidden="true" className={`learning-backdrop ${styles.backdrop} ${edge ? styles.edge : ""}`}>
    <Image src={`/illustrations/hanni/backgrounds/${kind}.webp`} alt="" fill
      sizes={edge ? "(max-width: 767px) 64vw, 440px" : "(max-width: 767px) 100vw, 540px"} preload={eager} className={styles.image}/>
  </div>;
}
