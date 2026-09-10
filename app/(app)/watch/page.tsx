"use client";

import { useState } from "react";
import { VideoCard } from "@/components/video-card";
import { EmptyState, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useVideos } from "@/lib/hooks";

const KINDS = [
  ["", "Tất cả"],
  ["PODCAST", "Podcast"],
  ["STORY", "Truyện ngắn"],
  ["DIALOGUE", "Hội thoại"],
  ["SONG", "Bài hát"],
] as const;

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7];

export default function WatchPage() {
  const { user, loading } = useRequireAuth();
  const [kind, setKind] = useState("");
  const [level, setLevel] = useState(0);
  const { data, isLoading } = useVideos({
    kind: kind || undefined,
    level: level || undefined,
  });

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-5">
      <PageHeading
        eyebrow="MIỄN PHÍ CHO MỌI NGƯỜI"
        title="Học qua video"
        description="Xem clip tiếng Trung với phụ đề đồng bộ — chữ Hán, pinyin và nghĩa. Mỗi video có cấp độ HSK để bạn chọn cho vừa sức."
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors ${
                level === l
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {l === 0 ? "Mọi cấp" : `HSK ${l}`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setKind(v)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                kind === v
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data && data.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có video phù hợp"
          description="Thử đổi cấp độ hoặc loại video. Nội dung sẽ được cập nhật thêm."
        />
      )}
    </div>
  );
}
