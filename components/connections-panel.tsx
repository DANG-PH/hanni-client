"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { Icon } from "@/components/icon";
import { MessageIconButton } from "@/components/message-icon-button";
import { SectionHeading, Spinner } from "@/components/ui";
import { useLeaderboard, usePublicProfile, useUserSearch } from "@/lib/hooks";
import type { PublicProfileUser } from "@/lib/types";

interface Row {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  currentStreak?: number;
  isFollowing: boolean;
}

function ConnectionCard({
  row,
  onFollowChange,
}: {
  row: Row;
  onFollowChange: (following: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <Link href={`/u/${row.id}`} className="shrink-0">
        <Avatar user={row} size={40} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/u/${row.id}`}
          className="block truncate text-sm font-semibold hover:underline"
        >
          {row.displayName}
        </Link>
        {!!row.currentStreak && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Icon name="flame" size={12} className="text-primary" />
            {row.currentStreak} ngày
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <FollowButton
          userId={row.id}
          following={row.isFollowing}
          onChange={onFollowChange}
          compact
        />
        {row.isFollowing && <MessageIconButton userId={row.id} />}
      </div>
    </div>
  );
}

function toRow(u: PublicProfileUser, isFollowing: boolean): Row {
  return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, isFollowing };
}

/** Nội dung "Kết nối" — tách riêng khỏi trang để nhúng làm 1 tab trong
 * `/messages` (gộp chung với Tin nhắn, xem ghi chú trong messages/page.tsx
 * về lý do gộp: trước đó "Tin nhắn mới" và trang Kết nối trùng lặp gần như
 * y hệt phần tìm người + bắt đầu nhắn tin). */
export function ConnectionsPanel({ myUserId }: { myUserId: string }) {
  const myProfile = usePublicProfile(myUserId);
  const suggestions = useLeaderboard("streak", "global");
  const [q, setQ] = useState("");
  const search = useUserSearch(q);

  if (myProfile.isLoading) return <Spinner />;

  const followingList = myProfile.data?.following ?? [];
  const followersList = myProfile.data?.followers ?? [];
  const followingIds = new Set(followingList.map((u) => u.id));
  const followerIds = new Set(followersList.map((u) => u.id));

  const mutual = followingList
    .filter((u) => followerIds.has(u.id))
    .map((u) => toRow(u, true));
  const onlyFollowers = followersList
    .filter((u) => !followingIds.has(u.id))
    .map((u) => toRow(u, false));
  const onlyFollowing = followingList
    .filter((u) => !followerIds.has(u.id))
    .map((u) => toRow(u, true));
  const suggested = (suggestions.data?.rows ?? [])
    .filter((r) => !r.isMe && !followingIds.has(r.userId))
    .slice(0, 8)
    .map(
      (r): Row => ({
        id: r.userId,
        displayName: r.displayName,
        avatarUrl: r.avatarUrl,
        currentStreak: r.currentStreak,
        isFollowing: r.isFollowing,
      }),
    );

  function refresh() {
    void myProfile.mutate();
    void suggestions.mutate();
  }

  return (
    <div className="space-y-8 p-4">
      <section>
        <SectionHeading
          icon="search"
          title="Tìm theo tên hoặc mã người dùng"
          className="mb-4"
        />
        <label className="field flex items-center gap-2">
          <Icon name="search" size={16} className="text-muted" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Nhập tên hoặc mã người dùng…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        {q.trim() && (
          <div className="mt-3 space-y-2">
            {search.isLoading && (
              <p className="text-sm text-muted">Đang tìm…</p>
            )}
            {!search.isLoading && search.data?.length === 0 && (
              <p className="text-sm text-muted">
                Không tìm thấy ai tên hoặc mã này.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {search.data?.map((u) => (
                <ConnectionCard
                  key={u.id}
                  row={u}
                  onFollowChange={() => refresh()}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {mutual.length > 0 && (
        <section>
          <SectionHeading
            icon="check"
            tone="good"
            title={`Đã kết nối (${mutual.length})`}
            description="Theo dõi lẫn nhau — nhắn tin được ngay."
            className="mb-4"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {mutual.map((row) => (
              <ConnectionCard
                key={row.id}
                row={row}
                onFollowChange={() => refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {onlyFollowers.length > 0 && (
        <section>
          <SectionHeading
            icon="user"
            tone="lavender"
            title={`Đang theo dõi bạn (${onlyFollowers.length})`}
            description="Theo dõi lại để kết nối 2 chiều và nhắn tin được."
            className="mb-4"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {onlyFollowers.map((row) => (
              <ConnectionCard
                key={row.id}
                row={row}
                onFollowChange={() => refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {onlyFollowing.length > 0 && (
        <section>
          <SectionHeading
            icon="route"
            title={`Bạn đang theo dõi (${onlyFollowing.length})`}
            description="Chờ họ theo dõi lại để nhắn tin được."
            className="mb-4"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {onlyFollowing.map((row) => (
              <ConnectionCard
                key={row.id}
                row={row}
                onFollowChange={() => refresh()}
              />
            ))}
          </div>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <SectionHeading
            icon="spark"
            tone="accent"
            title="Gợi ý kết nối"
            description="Những người học tích cực bạn có thể chưa biết."
            className="mb-4"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {suggested.map((row) => (
              <ConnectionCard
                key={row.id}
                row={row}
                onFollowChange={() => refresh()}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
