"use client";

import Link from "next/link";
import useSWR from "swr";
import { AudioButton } from "./audio-button";
import { Icon } from "./icon";
import { Card } from "./ui";
import { apiFetch } from "@/lib/api";
import type { Word } from "@/lib/types";
import styles from "./word-of-the-day.module.css";

const fetcher = (path: string) => apiFetch<Word>(path);

/** Thẻ "Từ vựng hôm nay" trên dashboard — 1 từ cố định theo ngày, giống
 * nhau cho mọi user (xem `WordsService.ofTheDay()`), tạo cảm giác mới mẻ
 * mỗi lần ghé dù không vào học. Im lặng ẩn đi nếu lỗi/chưa tải xong — đây
 * là nội dung phụ, không đáng để hiện lỗi làm rối dashboard. */
export function WordOfTheDayCard() {
  const { data } = useSWR<Word>("/words/of-the-day", fetcher);
  if (!data) return null;

  return (
    <Card className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.label}><Icon name="spark" size={14} /> Từ vựng hôm nay</span>
        <span className={styles.level}>HSK {data.hskLevel}</span>
      </div>
      <div className={styles.word}>
        <span
          className={`hanzi ${styles.character}`}
          lang="zh"
          data-long={Array.from(data.simplified).length > 2 || undefined}
        >
          {data.simplified}
        </span>
        <div className={styles.definition}>
          <p className={styles.pinyin}>
            <span>{data.pinyin}</span>
            <AudioButton src={data.audioUrl} size={15} />
          </p>
          <p className={styles.meaning}>{data.meaningVi}</p>
        </div>
      </div>
      <Link
        href={`/vocabulary?level=${data.hskLevel}`}
        className={styles.action}
      >
        Khám phá thêm <span><Icon name="arrow" size={15} /></span>
      </Link>
    </Card>
  );
}
