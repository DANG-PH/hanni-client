"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { VideoCard } from "@/components/video-card";
import { EmptyState, LinkButton, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { useVideos } from "@/lib/hooks";

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
  const { data, isLoading } = useVideos({ kind: kind || undefined });

  if (loading || !user) return <Spinner />;

  return (
    <div className="page-wrap space-y-6">
      <PageHeading
        eyebrow="MIỄN PHÍ CHO MỌI NGƯỜI"
        title="Học qua video"
        description="Xem clip tiếng Trung với phụ đề đồng bộ — chữ Hán, pinyin và nghĩa. Bấm vào câu để tua lại và nghe kỹ."
      >
        <LinkButton href="/watch/new">
          <Icon name="plus" size={16} /> Thêm video
        </LinkButton>
      </PageHeading>

      <div className="flex flex-wrap gap-2">
        {KINDS.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setKind(v)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              kind === v
                ? "bg-primary text-primary-fg"
                : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
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
          title="Chưa có video nào"
          description="Thêm một video YouTube kèm bản chép để bắt đầu học qua video."
        >
          <LinkButton href="/watch/new">Thêm video đầu tiên</LinkButton>
        </EmptyState>
      )}
    </div>
  );
}
