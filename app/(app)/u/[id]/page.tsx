"use client";

/**
 * BẢN ĐỒ TRANG — HỒ SƠ CÔNG KHAI (/u/[id]) — chuỗi ngày, số liệu, huy hiệu của 1 người
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /users/:id/profile  ← usePublicProfile() ở lib/hooks.ts (← chính trang này)
 *                             → server: modules/users/users.controller.ts → UsersService.getPublicProfile()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { ShareButton } from "@/components/share-button";
import { Card, ErrorNote, Spinner, Stat } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { usePublicProfile } from "@/lib/hooks";

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
}

/** Hồ sơ công khai: chuỗi ngày học, số liệu, huy hiệu. Nhắn tin + theo dõi đã gỡ hẳn (2026-10-20 — app học
 * khác không có nhắn tin, ít người dùng nên hộp thư/danh sách theo dõi trống). */
export default function PublicProfilePage() {
  const { user: me, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const profile = usePublicProfile(params.id);

  if (loading || !me) return <Spinner />;

  if (profile.error) {
    return (
      <div className="page-wrap max-w-xl space-y-4">
        <ErrorNote>Không tải được hồ sơ này.</ErrorNote>
        <Link href="/leaderboard" className="inline-flex min-h-8 items-center text-sm font-semibold text-primary">
          ← Về bảng xếp hạng
        </Link>
      </div>
    );
  }

  if (profile.isLoading || !profile.data) return <Spinner />;

  const p = profile.data;

  return (
    <div className="page-wrap max-w-3xl space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar user={p} size={64} />
            <div>
              <h1 className="flex flex-wrap items-center gap-1.5 text-lg font-bold">
                {p.displayName}
                {p.isPremium && (
                  <span
                    title="Hanni Premium"
                    className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent"
                  >
                    <Icon name="crown" size={11} />
                    PREMIUM
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted">
                Tham gia từ {joinedLabel(p.joinedAt)}
              </p>
            </div>
          </div>
          {p.isMe && (
            <ShareButton
              title="Hồ sơ Hanni của tôi"
              text={`Mình đã học được ${p.learnedWordsCount} từ và giữ chuỗi ${p.currentStreak} ngày trên Hanni — cùng học tiếng Trung nhé!`}
              path={`/u/${p.id}`}
            />
          )}
        </div>
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
        <h2 className="mb-4 border-b border-border pb-3 text-sm font-semibold">Huy hiệu</h2>
        {p.achievements.length === 0 ? (
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
        )}
      </Card>
    </div>
  );
}
