import Image from "next/image";
import styles from "./study-artwork.module.css";

/** Home introduces a real learning activity rather than a scenic destination. */
export function StudyArtwork() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <Image src="/illustrations/study-journey.webp" alt="" fill priority sizes="(min-width: 1280px) 560px, 48vw" className={styles.image} />
      <span className={styles.caption}>Học từ mới, luyện từng ngày.</span>
    </div>
  );
}
