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

/** Thẻ "Từ vựng hôm nay" trên dashboard — 1 từ cố định theo ngày trong đúng
 * cấp đang học (`level`; trước đó lấy mọi cấp nên người HSK 1 nhận từ HSK 4),
 * xem `WordsService.ofTheDay()`. Im lặng ẩn đi nếu lỗi/chưa tải xong — đây là
 * nội dung phụ, không đáng để hiện lỗi làm rối dashboard. */
export function WordOfTheDayCard({ level }: { level?: number }) {
  // API → GET /words/of-the-day · server: modules/vocabulary/vocabulary.controller.ts → WordsService.ofTheDay()
  const { data } = useSWR<Word>(`/words/of-the-day${level ? `?level=${level}` : ""}`, fetcher);
  if (!data) return null;

  return (
    <Card className={styles.card}>
      <div className={styles.topline}>
        <span className={styles.label}>
          <Icon name="spark" size={14} /> Từ vựng hôm nay
        </span>
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
          {data.hanViet && (
            <p className="text-xs text-muted">
              Hán Việt: <b className="text-hanviet">{data.hanViet}</b>
            </p>
          )}
          <p className={styles.meaning}>{data.meaningVi}</p>
        </div>
      </div>
      {/* Câu ví dụ (HSK 1–3 đã có câu Hanni soạn) — lấp chỗ trống bằng cách dùng từ thật trong câu. */}
      {data.examples?.[0] && (
        <div className="mt-3 rounded-xl bg-surface-2/60 px-3.5 py-2.5">
          <p lang="zh" className="hanzi text-base">
            {data.examples[0].zh}
          </p>
          {data.examples[0].pinyin && <p className="text-xs text-muted">{data.examples[0].pinyin}</p>}
          {data.examples[0].vi && <p className="mt-0.5 text-xs">{data.examples[0].vi}</p>}
        </div>
      )}
      {/* Thẻ đang khoe MỘT từ cụ thể thì lối đi tiếp phải là trang của CHÍNH
       * từ đó (âm Hán Việt, phân tích từng chữ, từ cùng chữ, video có từ
       * này) — trước đó lại dẫn ra danh sách cả cấp HSK, mất hẳn ngữ cảnh. */}
      <Link
        href={`/tu-dien/${encodeURIComponent(data.simplified)}`}
        className={styles.action}
      >
        Tìm hiểu {data.simplified}{" "}
        <span>
          <Icon name="arrow" size={15} />
        </span>
      </Link>
    </Card>
  );
}
