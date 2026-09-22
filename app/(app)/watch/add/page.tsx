"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  ErrorNote,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { VideoDetail, VideoKind } from "@/lib/types";
import { NextStep } from "@/components/next-step";

const KINDS: { value: VideoKind; label: string }[] = [
  { value: "STORY", label: "Truyện ngắn" },
  { value: "PODCAST", label: "Podcast" },
  { value: "DIALOGUE", label: "Hội thoại" },
  { value: "SONG", label: "Bài hát" },
  { value: "CLIP", label: "Đoạn ngắn" },
  { value: "OTHER", label: "Khác" },
];

export default function AddVideoPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [title, setTitle] = useState("");
  const [hskLevel, setHskLevel] = useState<number | undefined>();
  const [kind, setKind] = useState<VideoKind | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading || !user) return <Spinner />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const video = await api.post<VideoDetail>("/videos", {
        youtubeUrl: youtubeUrl.trim(),
        title: title.trim() || undefined,
        hskLevel,
        kind,
      });
      router.push(`/watch/${video.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa thêm được video. Kiểm tra lại đường dẫn YouTube.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="page-wrap max-w-2xl! space-y-6">
      <PageHeading
        icon="plus"
        tone="good"
        eyebrow="Góp thêm câu chuyện"
        title="Thêm video của bạn"
        description="Dán đường dẫn YouTube có phụ đề tiếng Trung — Hanni tự lấy bản chép + dịch nghĩa cho bạn."
      />
      <Card>
        <form onSubmit={(e) => void submit(e)} className="space-y-5">
          <label className="block text-sm font-medium">
            Đường dẫn YouTube
            <input
              type="url"
              required
              minLength={5}
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="field mt-1.5"
            />
            <p className="mt-1.5 text-xs text-muted">
              Video cần có phụ đề (CC) tiếng Trung trên YouTube để Hanni lấy
              được bản chép tự động.
            </p>
          </label>

          {!showMore ? (
            <button
              type="button"
              onClick={() => setShowMore(true)}
              className="text-sm font-semibold text-primary"
            >
              + Thêm chi tiết (tuỳ chọn)
            </button>
          ) : (
            <div className="space-y-4 border-t border-border pt-4">
              <label className="block text-sm font-medium">
                Tiêu đề (tuỳ chọn)
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Để trống sẽ tự lấy tiêu đề từ YouTube"
                  className="field mt-1.5"
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">Cấp HSK (tuỳ chọn)</p>
                <div className="grid grid-cols-9 gap-1.5">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() =>
                        setHskLevel(hskLevel === lv ? undefined : lv)
                      }
                      aria-pressed={hskLevel === lv}
                      className={`min-h-9 rounded-lg text-sm font-semibold transition-colors ${
                        hskLevel === lv
                          ? "bg-primary text-primary-fg"
                          : "bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Thể loại (tuỳ chọn)</p>
                <div className="flex flex-wrap gap-2">
                  {KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() =>
                        setKind(kind === k.value ? undefined : k.value)
                      }
                      aria-pressed={kind === k.value}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        kind === k.value
                          ? "border-primary/40 bg-primary/8 text-primary"
                          : "border-border bg-surface text-muted hover:text-foreground"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}

          <Button type="submit" disabled={busy || !youtubeUrl.trim()}>
            <Icon name="plus" size={16} />
            {busy ? "Đang thêm…" : "Thêm video"}
          </Button>
          <p className="text-xs leading-5 text-muted">
            Lấy phụ đề từ YouTube có thể mất vài giây. Bản chép tiếng Trung
            hiện ngay sau khi thêm — nghĩa tiếng Việt từng dòng sẽ dịch dần
            trong nền, có thể chưa hiện đủ ngay lập tức.
          </p>
        </form>
      </Card>

      <NextStep
        title="Chưa muốn thêm video?"
        description="Kho video có sẵn đã có phụ đề chạy đồng bộ và bấm từ để lưu vào ôn tập."
        actions={[
          { href: "/watch", label: "Xem kho video", icon: "play" as const },
          { href: "/learn", label: "Lộ trình HSK", icon: "route" as const },
        ]}
      />
    </div>
  );
}
