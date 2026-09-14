"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { Icon } from "@/components/icon";
import { ShareButton } from "@/components/share-button";
import { Button, Card, ErrorNote, Spinner, Stat } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { usePublicProfile } from "@/lib/hooks";
import { getOrCreateConversation } from "@/lib/messages";
import type { PublicProfileUser } from "@/lib/types";

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
}

function UserRow({ user }: { user: PublicProfileUser }) {
  return (
    <Link
      href={`/u/${user.id}`}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-surface-2"
    >
      <Avatar user={user} size={28} />
      <span className="min-w-0 flex-1 truncate font-medium">
        {user.displayName}
      </span>
    </Link>
  );
}

export default function PublicProfilePage() {
  const { user: me, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const profile = usePublicProfile(params.id);
  const [tab, setTab] = useState<"followers" | "following" | null>(null);
  const [opening, setOpening] = useState(false);

  async function openConversation() {
    if (opening) return;
    setOpening(true);
    try {
      const conversation = await getOrCreateConversation(params.id);
      router.push(`/messages?c=${conversation.id}`);
    } finally {
      setOpening(false);
    }
  }

  if (loading || !me) return <Spinner />;

  if (profile.error) {
    return (
      <div className="page-wrap max-w-xl space-y-4">
        <ErrorNote>Không tải được hồ sơ này.</ErrorNote>
        <Link href="/leaderboard" className="text-sm font-semibold text-primary">
          ← Về bảng xếp hạng
        </Link>
      </div>
    );
  }

  if (profile.isLoading || !profile.data) return <Spinner />;

  const p = profile.data;
  const list = tab === "followers" ? p.followers : tab === "following" ? p.following : null;

  return (
    <div className="page-wrap max-w-3xl space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={p} size={64} />
          <div>
            <h1 className="text-lg font-bold">{p.displayName}</h1>
            <p className="text-xs text-muted">
              Tham gia từ {joinedLabel(p.joinedAt)}
            </p>
          </div>
        </div>
        {p.isMe ? (
          <ShareButton
            title="Hồ sơ Hanni của tôi"
            text={`Mình đã học được ${p.learnedWordsCount} từ và giữ chuỗi ${p.currentStreak} ngày trên Hanni — cùng học tiếng Trung nhé!`}
            path={`/u/${p.id}`}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => void openConversation()} disabled={opening}>
              <Icon name="message" size={16} />
              Nhắn tin
            </Button>
            <FollowButton
              userId={p.id}
              following={p.isFollowing}
              onChange={() => void profile.mutate()}
            />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Chuỗi ngày học"
          value={p.currentStreak}
          hint={`Kỷ lục ${p.longestStreak} ngày`}
          icon="flame"
          tone="text-warn bg-warn/10"
        />
        <Stat
          label="Từ đã thuộc"
          value={p.learnedWordsCount}
          icon="book"
          tone="text-good bg-good/10"
        />
        <Stat
          label="Bài đã xong"
          value={p.completedLessonsCount}
          icon="route"
          tone="text-lavender bg-lavender/12"
        />
        <Stat
          label="Huy hiệu"
          value={p.achievements.length}
          icon="trophy"
          tone="text-primary bg-primary/10"
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-1 border-b border-border pb-3 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setTab(null)}
            className={tab === null ? "text-primary" : "text-muted"}
          >
            Huy hiệu
          </button>
          <span className="mx-2 text-border">·</span>
          <button
            type="button"
            onClick={() => setTab("followers")}
            className={tab === "followers" ? "text-primary" : "text-muted"}
          >
            {p.followerCount} người theo dõi
          </button>
          <span className="mx-2 text-border">·</span>
          <button
            type="button"
            onClick={() => setTab("following")}
            className={tab === "following" ? "text-primary" : "text-muted"}
          >
            Đang theo dõi {p.followingCount}
          </button>
        </div>

        {tab === null ? (
          p.achievements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Chưa mở khoá huy hiệu nào.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {p.achievements.map((a) => (
                <div
                  key={a.code}
                  className="flex items-center gap-2.5 rounded-xl border border-border p-3"
                >
                  <span className="icon-tile text-primary">
                    <Icon name="trophy" size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.nameVi}</p>
                    <p className="truncate text-xs text-muted">
                      {a.descriptionVi}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : list && list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {tab === "followers" ? "Chưa có ai theo dõi." : "Chưa theo dõi ai."}
          </p>
        ) : (
          <div className="space-y-0.5">
            {list?.map((u) => <UserRow key={u.id} user={u} />)}
          </div>
        )}
      </Card>
    </div>
  );
}
