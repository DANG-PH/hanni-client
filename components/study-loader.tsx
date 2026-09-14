import Image from "next/image";
import styles from "./study-loader.module.css";

/** Branding for real loading states; no artificial delay or simulated progress. */
export function StudyLoader({
  label = "Đang mở góc học tập…",
  variant = "page",
}: {
  label?: string;
  variant?: "page" | "startup" | "compact";
}) {
  return (
    <div className={`${styles.loader} ${styles[variant]}`} role="status" aria-live="polite">
      <div className={styles.emblem} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.orbit} />
        <span className={styles.innerOrbit} />
        <Image src="/brand/hanni.png" alt="" width={56} height={56} className={styles.logo} />
      </div>
      <div className={styles.copy}>
        <span className={styles.brand}>Hanni<span>.</span></span>
        <p>{label}</p>
        <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
      </div>
      {variant === "startup" && <p className={styles.caption}>Mỗi ngày một chút, tiến xa hơn.</p>}
    </div>
  );
}
