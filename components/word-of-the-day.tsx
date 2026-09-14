"use client";

import Link from "next/link";
import useSWR from "swr";
import { AudioButton } from "./audio-button";
import { Icon } from "./icon";
import { Card } from "./ui";
import { apiFetch } from "@/lib/api";
import type { Word } from "@/lib/types";

const fetcher = (path: string) => apiFetch<Word>(path);

/** Thẻ "Từ vựng hôm nay" trên dashboard — 1 từ cố định theo ngày, giống
 * nhau cho mọi user (xem `WordsService.ofTheDay()`), tạo cảm giác mới mẻ
 * mỗi lần ghé dù không vào học. Im lặng ẩn đi nếu lỗi/chưa tải xong — đây
 * là nội dung phụ, không đáng để hiện lỗi làm rối dashboard. */
export function WordOfTheDayCard() {
  const { data } = useSWR<Word>("/words/of-the-day", fetcher);
  if (!data) return null;

  return (
    <Card className="flex flex-wrap items-center gap-5 border-accent/15 bg-accent/5">
      <span className="hanzi flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface text-3xl text-accent">
        {data.simplified}
      </span>
      <div className="min-w-0 flex-1">
        <p className="eyebrow mb-1 text-accent">Từ vựng hôm nay</p>
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-semibold">{data.pinyin}</span>
          <AudioButton src={data.audioUrl} size={15} />
          <span className="text-muted">— {data.meaningVi}</span>
        </p>
        <p className="mt-1 text-xs text-muted">HSK {data.hskLevel}</p>
      </div>
      <Link
        href={`/vocabulary?level=${data.hskLevel}`}
        className="shrink-0 text-sm font-semibold text-primary"
      >
        Khám phá thêm <Icon name="arrow" size={14} className="inline" />
      </Link>
    </Card>
  );
}
