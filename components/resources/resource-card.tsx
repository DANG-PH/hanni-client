"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Button, Card, ErrorNote, LinkButton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { createResourceLink, formatBytes, type LearningResource } from "@/lib/resources";
import { HlsVideo } from "./hls-video";

const KIND: Record<LearningResource["kind"], { label: string; icon: IconName; action: string }> = {
  video: { label: "Video", icon: "play", action: "Xem video" },
  audio: { label: "Bài nghe", icon: "headphones", action: "Nghe" },
  pdf: { label: "Tài liệu PDF", icon: "book", action: "Tải về" },
};

export function ResourceCard({ resource }: { resource: LearningResource }) {
  const { user } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const kind = KIND[resource.kind];

  async function open() {
    setBusy(true);
    setFailed(false);
    try {
      const link = await createResourceLink(resource.id);
      if (resource.kind === "pdf") window.location.assign(link.url);
      else setUrl(link.url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="icon-tile shrink-0">
          <Icon name={kind.icon} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{resource.title}</h2>
          <p className="text-sm text-muted">{resource.description}</p>
          <p className="mt-1 text-xs text-muted">
            {kind.label} · {formatBytes(resource.bytes)}
          </p>
        </div>
      </div>
      {url && resource.kind === "video" && <HlsVideo src={url} title={resource.title} />}
      {url && resource.kind === "audio" && (
        <audio src={url} controls aria-label={resource.title} className="w-full" />
      )}
      {failed && <ErrorNote>Chưa mở được học liệu này. Bạn thử lại sau ít phút nhé.</ErrorNote>}
      {!url &&
        (resource.requiresLogin && !user ? (
          <LinkButton href="/login?next=/hoc-lieu" variant="secondary">
            Đăng nhập để mở
          </LinkButton>
        ) : (
          <Button onClick={() => void open()} disabled={busy} variant="secondary">
            {busy ? "Đang mở…" : kind.action}
          </Button>
        ))}
    </Card>
  );
}
