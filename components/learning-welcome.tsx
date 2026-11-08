import Image from "next/image";
import styles from "./learning-welcome.module.css";

export function LearningWelcome({ name }: { name?: string }) {
  return <header className={styles.welcome}>
    <div><p className={styles.eyebrow}>CÙNG HANNI HỌC TIẾNG TRUNG</p><h2>{name ? `Chào ${name}, mình học tiếp nhé!` : "Mình học thêm một chút nhé?"}</h2><p className={styles.description}>Bài tiếp theo đã sẵn sàng. Bắt đầu từ một bước nhỏ hôm nay.</p></div>
    <span aria-hidden="true" className={styles.fox}><Image src="/illustrations/hanni/home-guide.webp" alt="" width={82} height={82} style={{objectFit:"contain"}}/></span>
  </header>;
}
