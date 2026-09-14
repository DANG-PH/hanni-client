"use client";

import Link from "next/link";
import { Icon } from "./icon";
import styles from "./hero-banner.module.css";

/** Lời chào cá nhân và lối vào bài học đang tiếp tục. */
export function HeroBanner({
  title,
  highlight,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  highlight: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className={`reveal ${styles.hero}`}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.statusDot} />
          Mỗi ngày một bước tiến
        </p>
        <h1 className={styles.title}>
          {title}
          <br />
          <span className="text-primary">{highlight}</span>
        </h1>
        <p className={styles.subtitle}>
          {subtitle}
        </p>
        <Link
          href={ctaHref}
          className={`motion-button ${styles.cta}`}
        >
          {ctaLabel}
          <span className={styles.ctaArrow}><Icon name="arrow" size={18} /></span>
        </Link>
        <div className={styles.footnote}>
          <span className="hanzi">学而不止</span>
          <span>Học một chút. Tiến xa hơn.</span>
        </div>
      </div>

      <div aria-hidden="true" className={styles.illustration}>
        <div className={styles.scene}>
          <div className={styles.orbit} />
          <div className={styles.orbitInner} />
          <span className={styles.sparkOne}><Icon name="spark" size={22} /></span>
          <span className={styles.sparkTwo}><Icon name="spark" size={12} /></span>
          <div className={styles.stageShadow} />
          <div className={styles.floatingDeck}>
            <div className={styles.deck} data-depth="scene">
              <div className={styles.backCard} />
              <div className={styles.middleCard} />
              <div className={styles.wordCard}>
                <div className={styles.cardTopline}>
                  <span>HANNI · 中文</span>
                  <Icon name="spark" size={15} />
                </div>
                <div className={styles.characterGrid}>
                  <span className="hanzi">学</span>
                </div>
                <span className={styles.pinyin}>xué</span>
                <span className={styles.meaning}>học · khám phá · tiến bộ</span>
                <div className={styles.cardBottom}>
                  <span>MỘT TỪ MỚI, MỘT BƯỚC TIẾN</span>
                  <Icon name="arrow" size={15} />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.soundChip}>
            <span className={styles.soundIcon}><Icon name="sound" size={18} /></span>
            <div className={styles.soundText}><strong>你好</strong><span>nǐ hǎo</span></div>
            <span className={styles.wave}><i /><i /><i /><i /><i /></span>
          </div>
          <div className={styles.glyphTile}><span className="hanzi">语</span></div>
          <div className={styles.smallSeal}><span className="hanzi">中</span></div>
        </div>
      </div>
    </section>
  );
}
