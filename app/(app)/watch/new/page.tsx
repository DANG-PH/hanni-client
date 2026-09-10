"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";

const KINDS = [
  ["PODCAST", "Podcast"],
  ["STORY", "Truyện ngắn"],
  ["DIALOGUE", "Hội thoại"],
  ["SONG", "Bài hát"],
  ["CLIP", "Clip"],
  ["OTHER", "Khác"],
] as const;

const PLACEHOLDER = `[0:00] 大家好，欢迎收听。 | Xin chào, cảm ơn đã lắng nghe.
[0:04] 今天我们聊聊学习方法。 | Hôm nay chúng ta nói về phương pháp học.
今天天气很好。 | Hôm nay thời tiết rất đẹp.`;

export default function NewVideoPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [f, setF] = useState({
    youtubeUrl: "",
    title: "",
    titleZh: "",
    hskLevel: "",
    kind: "PODCAST",
    transcript: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user) return <Spinner />;

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((p) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { id } = await api.post<{ id: string }>("/videos", {
        youtubeUrl: f.youtubeUrl.trim(),
        title: f.title.trim() || undefined,
        titleZh: f.titleZh.trim() || undefined,
        hskLevel: f.hskLevel ? Number(f.hskLevel) : undefined,
        kind: f.kind,
        transcript: f.transcript,
      });
      router.push(`/watch/${id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Không thêm được video",
      );
      setBusy(false);
    }
  }

  return (
    <div className="page-wrap max-w-2xl space-y-6">
      <PageHeading
        eyebrow="HỌC QUA VIDEO"
        title="Thêm video"
        description="Dán link YouTube và bản chép (mỗi câu một dòng). Pinyin sẽ tự sinh."
      />

      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <label className="block text-sm">
            Link YouTube
            <input
              required
              value={f.youtubeUrl}
              onChange={(e) => set("youtubeUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              className="field mt-1"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Tiêu đề tiếng Việt <span className="text-muted">(tuỳ chọn)</span>
              <input
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Tự lấy từ YouTube nếu bỏ trống"
                className="field mt-1"
              />
            </label>
            <label className="block text-sm">
              Tiêu đề tiếng Trung <span className="text-muted">(tuỳ chọn)</span>
              <input
                value={f.titleZh}
                onChange={(e) => set("titleZh", e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm">
              Cấp HSK
              <select
                value={f.hskLevel}
                onChange={(e) => set("hskLevel", e.target.value)}
                className="field mt-1"
              >
                <option value="">— chưa xác định —</option>
                {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Loại
              <select
                value={f.kind}
                onChange={(e) => set("kind", e.target.value)}
                className="field mt-1"
              >
                {KINDS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="space-y-2">
          <label className="block text-sm font-medium">Bản chép</label>
          <p className="text-xs leading-5 text-muted">
            Mỗi câu một dòng, dạng{" "}
            <code className="rounded bg-surface-2 px-1">
              [phút:giây] 中文 | Bản dịch
            </code>
            . Mốc thời gian và bản dịch đều tuỳ chọn.
          </p>
          <textarea
            required
            value={f.transcript}
            onChange={(e) => set("transcript", e.target.value)}
            rows={12}
            placeholder={PLACEHOLDER}
            className="field mt-1 font-mono text-xs leading-6"
          />
        </Card>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : "Thêm video"}
          </Button>
          <Link href="/watch" className="text-sm text-muted hover:text-foreground">
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
}
