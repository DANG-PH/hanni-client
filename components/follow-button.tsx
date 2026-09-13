"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { followUser, unfollowUser } from "@/lib/hooks";

export function FollowButton({
  userId,
  following,
  onChange,
  compact,
}: {
  userId: string;
  following: boolean;
  onChange: (following: boolean) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const optimistic = !following;
    onChange(optimistic);
    try {
      const res = optimistic
        ? await followUser(userId)
        : await unfollowUser(userId);
      onChange(res.following);
    } catch {
      onChange(following); // lỗi mạng → khôi phục trạng thái cũ
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={following}
      title={following ? "Bỏ theo dõi" : "Theo dõi người học này"}
      className={`motion-button inline-flex items-center gap-1 rounded-full font-semibold transition-colors disabled:opacity-60 ${
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${
        following
          ? "bg-surface-2 text-muted hover:text-foreground"
          : "bg-primary/10 text-primary hover:bg-primary/15"
      }`}
    >
      <Icon name={following ? "check" : "plus"} size={12} />
      {following ? "Đang theo dõi" : "Theo dõi"}
    </button>
  );
}
