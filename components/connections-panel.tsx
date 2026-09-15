"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { Icon } from "@/components/icon";
import { MessageIconButton } from "@/components/message-icon-button";
import { Spinner } from "@/components/ui";
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
    <div className="hover-card reveal flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
      <Link href={`/u/${row.id}`} className="shrink-0">
        <Avatar user={row} size={42} />
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

function CardGrid({ rows, onFollowChange }: { rows: Row[]; onFollowChange: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <ConnectionCard key={row.id} row={row} onFollowChange={onFollowChange} />
      ))}
    </div>
  );
}

function TabEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center">
      <span className="icon-tile mx-auto mb-3">
        <Icon name="user" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-muted">
        {description}
      </p>
    </div>
  );
}

function toRow(u: PublicProfileUser, isFollowing: boolean): Row {
  return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, isFollowing };
}

type SubTab = "mutual" | "followers" | "following" | "suggested";

/** Nội dung "Kết nối" — tách riêng khỏi trang để nhúng làm 1 tab trong
 * `/messages` (gộp chung với Tin nhắn, xem ghi chú trong messages/page.tsx
 * về lý do gộp: trước đó "Tin nhắn mới" và trang Kết nối trùng lặp gần như
 * y hệt phần tìm người + bắt đầu nhắn tin). Chia theo SUB-TAB (thay vì dồn
 * hết vào 1 cuộn dài như trước) — dễ định vị hơn, mỗi tab có badge số lượng
 * để biết ngay chỗ nào đang "có việc cần làm" (vd ai đang theo dõi mình mà
 * mình chưa theo dõi lại). */
export function ConnectionsPanel({ myUserId }: { myUserId: string }) {
  const myProfile = usePublicProfile(myUserId);
  const suggestions = useLeaderboard("streak", "global");
  const [q, setQ] = useState("");
  const search = useUserSearch(q);
  const [sub, setSub] = useState<SubTab>("mutual");

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

  const TABS: { key: SubTab; label: string; rows: Row[] }[] = [
    { key: "mutual", label: "Đã kết nối", rows: mutual },
    { key: "followers", label: "Đang theo dõi bạn", rows: onlyFollowers },
    { key: "following", label: "Bạn đang theo dõi", rows: onlyFollowing },
    { key: "suggested", label: "Gợi ý", rows: suggested },
  ];
  const activeRows = TABS.find((t) => t.key === sub)?.rows ?? [];
  const searching = q.trim().length > 0;

  return (
    <div className="space-y-5 p-4">
      <label className="field flex items-center gap-2">
        <Icon name="search" size={16} className="text-muted" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm theo tên hoặc mã người dùng (UID)…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Xoá tìm kiếm"
            className="text-muted hover:text-foreground"
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </label>

      {searching ? (
        <div className="space-y-2">
          {search.isLoading && <p className="text-sm text-muted">Đang tìm…</p>}
          {!search.isLoading && search.data?.length === 0 && (
            <TabEmpty
              title="Không tìm thấy ai"
              description="Thử tên khác, hoặc dán đúng mã người dùng (UID) của họ."
            />
          )}
          {!!search.data?.length && (
            <CardGrid rows={search.data} onFollowChange={refresh} />
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={sub === t.key}
                onClick={() => setSub(t.key)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  sub === t.key
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                {t.label}
                {t.rows.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      sub === t.key ? "bg-primary-fg/20" : "bg-border/60"
                    }`}
                  >
                    {t.rows.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeRows.length > 0 ? (
            <CardGrid rows={activeRows} onFollowChange={refresh} />
          ) : sub === "mutual" ? (
            <TabEmpty
              title="Chưa kết nối với ai"
              description="Theo dõi lẫn nhau với 1 người khác để nhắn tin trực tiếp — thử xem tab Gợi ý hoặc tìm theo tên/mã người dùng ở trên."
            />
          ) : sub === "followers" ? (
            <TabEmpty
              title="Chưa có ai theo dõi bạn"
              description="Khi có người theo dõi bạn, họ sẽ xuất hiện ở đây — theo dõi lại để kết nối 2 chiều."
            />
          ) : sub === "following" ? (
            <TabEmpty
              title="Bạn chưa theo dõi ai"
              description="Những người bạn theo dõi nhưng chưa theo dõi lại sẽ hiện ở đây."
            />
          ) : (
            <TabEmpty
              title="Chưa có gợi ý nào"
              description="Quay lại sau khi có thêm người học tích cực trên Hanni."
            />
          )}
        </>
      )}
    </div>
  );
}
