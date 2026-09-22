"use client";

import Link from "next/link";
import { useState } from "react";
import { VideoCard } from "@/components/video-card";
import { Icon } from "@/components/icon";
import { LevelFilter } from "@/components/learning-library";
import { ProgressiveList } from "@/components/progressive-list";
import { SelectionGroup } from "@/components/selection-group";
import {
  Button,
  EmptyState,
  ErrorNote,
  LinkButton,
  PageHeading,
  SectionHeading,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useVideos } from "@/lib/hooks";
import styles from "@/components/video-library.module.css";
import { NextStep } from "@/components/next-step";

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
        tone="good"
        eyebrow="Tiếng Trung trong cuộc sống"
        title="Học qua video"
        description="Chọn một câu chuyện bạn thích. Nghe, đọc phụ đề và làm quen với tiếng Trung tự nhiên."
      >
        <span className={styles.captionNote}>
          <Icon name="headphones" size={17} /> Hán tự · Pinyin · Nghĩa tiếng
          Việt
        </span>
        <LinkButton href="/watch/add" variant="secondary">
          <Icon name="plus" size={17} />
          Thêm video
        </LinkButton>
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
          <SectionHeading
            className={styles.libraryHeading}
            icon="play"
            title="Khám phá video"
            tone="good"
            description={
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
            }
          >
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
          </SectionHeading>
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
            <ProgressiveList
              items={danhSach}
              initialCount={6}
              step={6}
              itemLabel="video"
              resetKey={`${kind}:${level ?? ""}:${tuKhoa}:${danhSach.map((video) => video.id).join(",")}`}
              renderItems={(visibleVideos) => (
                <div className={styles.grid}>
                  {visibleVideos.map((video, index) => (
                    <VideoCard key={video.id} video={video} index={index} />
                  ))}
                </div>
              )}
            />
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

      {/* Xem danh sách xong thì đi đâu? Trước đó cụt — video là cách học phụ,
       * gốc vẫn là lộ trình + ôn tập. */}
      <NextStep
        title="Xem video là để gặp lại từ đã học"
        description="Bấm vào từ trong bản chép để lưu vào danh sách ôn. Nhưng vốn từ nền vẫn đến từ lộ trình bài học."
        actions={[
          { href: "/learn", label: "Lộ trình HSK", icon: "route" as const },
          { href: "/study", label: "Ôn tập flashcard", icon: "cards" as const },
        ]}
      />
    </div>
  );
}
