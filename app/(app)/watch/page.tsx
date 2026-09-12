"use client";

import Link from "next/link";
import { useState } from "react";
import { VideoCard } from "@/components/video-card";
import { Icon } from "@/components/icon";
import { LevelFilter } from "@/components/learning-library";
import { SelectionGroup } from "@/components/selection-group";
import { Button, EmptyState, ErrorNote, PageHeading } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useVideos } from "@/lib/hooks";
import styles from "@/components/video-library.module.css";

const KINDS = [
  ["", "Tất cả"],
  ["PODCAST", "Podcast"],
  ["STORY", "Truyện ngắn"],
  ["DIALOGUE", "Hội thoại"],
  ["SONG", "Bài hát"],
] as const;

export default function WatchPage() {
  const { user, loading } = useRequireAuth();
  const [kind, setKind] = useState("");
  const [level, setLevel] = useState<number | undefined>();
  const [query, setQuery] = useState("");
  const { data, isLoading, error, mutate } = useVideos({
    kind: kind || undefined,
    level,
  });
  const dangCapNhat = Boolean(data) && isLoading;
  const tuKhoa = query.trim().toLocaleLowerCase("vi");
  const danhSach = (data ?? []).filter((video) =>
    `${video.title} ${video.titleZh ?? ""}`
      .toLocaleLowerCase("vi")
      .includes(tuKhoa),
  );
  // Chỉ gợi ý xem tiếp khi có tiến độ thực, và không lọc thư viện.
  const xemTiep =
    !kind && !level && !tuKhoa
      ? data?.find((video) => video.progressPct > 0 && video.progressPct < 100)
      : undefined;

  function xoaBoLoc() {
    setKind("");
    setLevel(undefined);
    setQuery("");
  }

  return (
    <div className="page-wrap learning-workspace">
      <PageHeading
        icon="play"
        eyebrow="Tiếng Trung trong cuộc sống"
        title="Học qua video"
        description="Chọn một câu chuyện bạn thích. Nghe, đọc phụ đề và làm quen với tiếng Trung tự nhiên."
      >
        <span className={styles.captionNote}>
          <Icon name="headphones" size={17} /> Hán tự · Pinyin · Nghĩa tiếng
          Việt
        </span>
      </PageHeading>

      {user && xemTiep && !error && (
        <Link href={`/watch/${xemTiep.id}`} className={styles.continueWatching}>
          <span className={styles.continueIcon}>
            <Icon name="play" size={20} />
          </span>
          <span className={styles.continueCopy}>
            <span>Tiếp tục khám phá</span>
            <strong>{xemTiep.title}</strong>
          </span>
          <span className={styles.continueProgress}>
            {Math.round(xemTiep.progressPct)}% đã học
          </span>
          <Icon name="arrow" size={18} />
        </Link>
      )}

      <section className={styles.library} aria-label="Thư viện video">
        <div className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            <div>
              <h2>Khám phá video</h2>
              <p aria-live="polite">
                {dangCapNhat
                  ? "Đang cập nhật danh sách…"
                  : isLoading || loading
                    ? "Đang tìm nội dung cho bạn…"
                    : error
                      ? data
                        ? "Đang hiển thị danh sách đã tải trước đó"
                        : "Thư viện tạm thời chưa tải được"
                      : `${danhSach.length} video${level ? ` · HSK ${level}` : " cho mọi cấp độ"}`}
              </p>
            </div>
            <label className={styles.search}>
              <Icon name="search" size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm video bạn muốn xem…"
                aria-label="Tìm video theo tên"
              />
            </label>
          </div>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Cấp độ</span>
            <LevelFilter
              options={[
                { value: undefined, label: "Mọi cấp" },
                ...Array.from({ length: 9 }, (_, i) => ({
                  value: i + 1,
                  label: `HSK ${i + 1}`,
                })),
              ]}
              value={level}
              onChange={setLevel}
            />
          </div>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>Thể loại</span>
            <SelectionGroup
              className={styles.kinds}
              label="Lọc thể loại video"
              value={kind}
            >
              {KINDS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={kind === value}
                  aria-controls="video-results"
                  onClick={() => setKind(value)}
                >
                  {label}
                </button>
              ))}
            </SelectionGroup>
            {(kind || level || query) && (
              <button type="button" onClick={xoaBoLoc} className={styles.clear}>
                <Icon name="close" size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <div
          id="video-results"
          className={styles.results}
          aria-busy={isLoading || loading}
          data-updating={dangCapNhat || undefined}
        >
          {user && error && (
            <div className={styles.loadError}>
              <ErrorNote>
                {data
                  ? "Chưa cập nhật được danh sách. Các video trước vẫn được giữ lại."
                  : "Chưa tải được video."}{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => void mutate()}
                >
                  Thử lại
                </button>
              </ErrorNote>
            </div>
          )}
          {loading || !user || (isLoading && !data) ? (
            <div
              className={styles.grid}
              role="status"
              aria-label="Đang tải video"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skeleton}>
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : error && !data ? null : danhSach.length ? (
            <div className={styles.grid}>
              {danhSach.map((video, index) => (
                <VideoCard key={video.id} video={video} index={index} />
              ))}
            </div>
          ) : dangCapNhat ? (
            <div className={styles.pendingEmpty} role="status">
              <Icon name="search" size={24} />
              Đang tìm video phù hợp…
            </div>
          ) : (
            <EmptyState
              title="Chưa có video phù hợp"
              description="Thử một từ khóa, cấp độ hoặc thể loại khác để tìm câu chuyện tiếp theo."
            >
              {(kind || level || query) && (
                <Button variant="secondary" onClick={xoaBoLoc}>
                  Xem tất cả video
                </Button>
              )}
            </EmptyState>
          )}
        </div>
      </section>
    </div>
  );
}
