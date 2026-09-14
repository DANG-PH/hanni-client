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
        <span className={styles.shadow} />
        <span className={styles.sparkle} />
        <span className={styles.smallSparkle} />
        <Image
          src="/anhloading.png"
          alt=""
          width={1367}
          height={1150}
          sizes={variant === "compact" ? "96px" : "(max-width: 639px) 200px, 240px"}
          loading="eager"
          fetchPriority={variant === "startup" ? "high" : "auto"}
          className={styles.mascot}
        />
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
