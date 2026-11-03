import Image from "next/image";
import styles from "./scene-background.module.css";

export type BackgroundKind = "lesson-journey" | "review-desk" | "dictionary-room" | "home-study-room";

/** Original full-bleed environments; real content and controls stay in the foreground. */
export function SceneBackground({ kind, eager = false }: { kind: BackgroundKind; eager?: boolean }) {
  return <div aria-hidden="true" className={`learning-backdrop ${styles.backdrop}`}>
    <Image src={`/illustrations/hanni/backgrounds/${kind}.webp`} alt="" fill
      sizes="(max-width: 767px) 100vw, 1100px" preload={eager} className={styles.image}/>
  </div>;
}
