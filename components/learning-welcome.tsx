import styles from "./learning-welcome.module.css";
import { SceneArt } from "./learning-scenes";

export function LearningWelcome({ name }: { name?: string }) {
  return (
    <header className={styles.welcome}>
      <div><p className={styles.eyebrow}>CHẬM MÀ CHẮC · MỖI NGÀY MỘT CHÚT</p><h2>{name ? `Chào ${name}, mình học tiếp nhé!` : "Một chút hôm nay, một bước tiến mới."}</h2><p className={styles.description}>Dành vài phút cho tiếng Trung. Hanni đồng hành cùng bạn.</p></div>
      <SceneArt kind="learn" compact className={styles.art} />
    </header>
  );
}
