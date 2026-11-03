import { Icon } from "./icon";
import styles from "./learning-scenes.module.css";

export type SceneKind = "learn" | "listening" | "pronunciation" | "speaking" | "writing" | "dictionary" | "exam" | "review" | "pinyin" | "grammar" | "video" | "game" | "scan" | "hanviet";

/** Product-native previews: the visual describes what a learner does on the destination. */
export function SceneArt({ kind, compact = false, className = "", cover = false }: { kind: SceneKind; compact?: boolean; className?: string; cover?: boolean }) {
  return <div aria-hidden="true" className={`${styles.art} ${styles[kind] ?? ""} ${compact ? styles.compact : ""} ${cover ? styles.cover : ""} ${className}`}>
    {(kind === "listening" || kind === "video") && <>
      <span className={styles.roundIcon}><Icon name={kind === "video" ? "play" : "headphones"} size={23} /></span>
      <div className={styles.wave}>{[16,26,40,30,52,38,20,34,46,25,14,28,42,22,12].map((h,i)=><i key={i} style={{height:h}} />)}</div>
      <span className={styles.small}>{kind === "video" ? "听 · 看 · 跟读" : "nǐ hǎo"}</span>
    </>}
    {(kind === "pronunciation" || kind === "pinyin") && <>
      <div className={styles.tones}><span>mā</span><span>má</span><span>mǎ</span><span>mà</span></div>
      <svg className={styles.pitch} viewBox="0 0 240 50" fill="none"><path d="M8 15H48M68 39L108 9M128 12Q145 60 168 9M188 9L228 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
    </>}
    {kind === "speaking" && <div className={styles.chat}><span lang="zh">你好！<small>nǐ hǎo</small></span><span lang="zh">一杯茶，谢谢。<small>yì bēi chá, xièxie</small></span></div>}
    {kind === "writing" && <><div className={`${styles.writingGrid} hanzi`} lang="zh">永</div><span className={styles.small}>yǒng · vĩnh</span><span className={styles.pen}><Icon name="pencil" size={28} /></span></>}
    {(kind === "dictionary" || kind === "hanviet") && <div className={styles.dictionaryWord}><div><span lang="zh" className="hanzi">电</span><small>điện</small></div><b>+</b><div><span lang="zh" className="hanzi">脑</span><small>não</small></div><em>diànnǎo · máy tính</em></div>}
    {kind === "exam" && <div className={styles.examSheet}><div><Icon name="target" size={18}/><b>HSK</b><Icon name="clock" size={15}/></div><span><i/>听力</span><span><i/>阅读</span><span><i/>写作</span></div>}
    {(kind === "learn" || kind === "review" || kind === "game") && <div className={styles.cards}><span className={styles.backCard}/><span className={styles.frontCard}><b className="hanzi" lang="zh">{kind === "game" ? "中" : "你好"}</b><small>{kind === "game" ? "zhōng" : "nǐ hǎo"}</small></span><span className={styles.answer}>{kind === "game" ? "zhōng" : "xin chào"}<Icon name="check" size={12}/></span></div>}
    {kind === "grammar" && <div className={styles.sentence}><span><b lang="zh">我</b><small>chủ ngữ</small></span><span><b lang="zh">学</b><small>động từ</small></span><span><b lang="zh">中文</b><small>tân ngữ</small></span></div>}
    {kind === "scan" && <><div className={styles.scanFrame}><span className="hanzi" lang="zh">茶</span><i/></div><span className={styles.scanResult}><Icon name="search" size={13}/>chá · trà</span></>}
  </div>;
}
export function SceneCover({ kind, className }: { kind: SceneKind; className?: string }) { return <SceneArt kind={kind} cover className={className}/>; }
