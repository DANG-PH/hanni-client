import Image from "next/image";
import styles from "./study-loader.module.css";

/** Trạng thái đang tải thật (không giả tiến độ). Dùng logo chữ 汉 chứ không dùng
 * cáo Hanni: vòng tải hiện ở mọi lần mở app, mở bài, mở đề — user thấy cáo "xuất
 * hiện quá nhiều" (2026-10-17), cáo chỉ còn ở chào mừng, chúc mừng, trạng thái rỗng. */
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
        <span className={styles.sparkle} />
        <span className={styles.smallSparkle} />
        <Image
          src="/brand/hanni.png"
          alt=""
          width={1254}
          height={1254}
          sizes={variant === "compact" ? "44px" : "96px"}
          loading="eager"
          fetchPriority={variant === "startup" ? "high" : "auto"}
          className={styles.logo}
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
