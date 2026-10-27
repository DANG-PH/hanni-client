"use client";

/**
 * BẢN ĐỒ TRANG — Trang mời vào lớp (/lop/[mã]) — xem trước lớp, nút vào lớp (khách được mời tạo tài khoản)
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /classrooms/code/:code        ← useClassPreview() ở lib/classrooms.ts (← chính trang này)
 *                                       → server: modules/classrooms/classrooms.controller.ts →
 *                                         ClassroomsService.preview()
 *   POST /classrooms/code/:code/join  ← joinClassroom() ở lib/classrooms.ts (← chính trang này)
 *                                       → server: modules/classrooms/classrooms.controller.ts →
 *                                         ClassroomsService.join()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Button, ErrorNote, LinkButton, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { joinClassroom, useClassPreview } from "@/lib/classrooms";
import { hskLabel } from "@/lib/pos";

/** Đường dẫn mời vào lớp giáo viên gửi — khách xem trước lớp, tạo tài khoản rồi quay lại đây để vào. */
export default function JoinClassPage() {
  const { code } = useParams<{ code: string }>();
  const clean = decodeURIComponent(code).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data, error, isLoading } = useClassPreview(clean || null);
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const here = `/lop/${clean}`;

  if (loading || isLoading) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      {error || !data ? (
        <div className="panel space-y-4 p-6 text-center">
          <h1 className="text-xl font-extrabold">Không tìm thấy lớp {clean}</h1>
          <p className="text-sm leading-6 text-muted">
            Mã lớp gồm 6 ký tự (không có số 0, 1 hay chữ O, I, L). Kiểm tra lại với giáo viên, hoặc nhập mã ở trang Lớp học.
          </p>
          <LinkButton href={user ? "/lop-hoc" : "/"} variant="secondary">
            {user ? "Nhập mã khác" : "Về trang chủ Hanni"}
          </LinkButton>
        </div>
      ) : (
        <div className="panel space-y-5 p-6 sm:p-8">
          <div className="text-center">
            <p className="eyebrow">LỜI MỜI VÀO LỚP</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight break-words">{data.name}</h1>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
              <Avatar user={data.teacher} size={24} />
              <span>
                Giáo viên <b className="text-foreground">{data.teacher.displayName}</b>
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {data.hskLevel ? `${hskLabel(data.hskLevel)} · ` : ""}
              {data.memberCount} học viên · mã {clean}
            </p>
          </div>

          <ul className="space-y-2 rounded-xl bg-surface-2/60 p-4 text-sm">
            {[
              ["flag", "Bài giáo viên giao hiện ngay ở Trang chủ, kèm hạn nộp."],
              ["cards", "Học từ mới theo lộ trình HSK, có âm Hán Việt và chấm thanh điệu — miễn phí."],
              ["eye", "Giáo viên thấy tiến độ của bạn trong lớp: chuỗi ngày, phút học, bài đã xong, điểm thi thử. Không thấy email."],
            ].map(([icon, text]) => (
              <li key={text} className="flex gap-2.5">
                <Icon name={icon as "flag"} size={16} className="mt-0.5 shrink-0 text-primary" />
                <span className="leading-6">{text}</span>
              </li>
            ))}
          </ul>

          {joinError && <ErrorNote>{joinError}</ErrorNote>}

          {data.isOwner || data.isMember ? (
            <LinkButton href={`/lop-hoc/${data.id}`} className="w-full">
              {data.isOwner ? "Mở lớp của bạn" : "Bạn đã ở trong lớp — mở lớp"} <Icon name="arrow" size={16} />
            </LinkButton>
          ) : user ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setJoinError(null);
                try {
                  const r = await joinClassroom(clean);
                  router.replace(`/lop-hoc/${r.id}`);
                } catch (err) {
                  setJoinError(err instanceof Error ? err.message : "Chưa vào được lớp, thử lại nhé.");
                  setBusy(false);
                }
              }}
            >
              {busy ? "Đang vào lớp…" : "Vào lớp"}
            </Button>
          ) : (
            <div className="space-y-2">
              <LinkButton href={`/register?next=${encodeURIComponent(here)}`} className="w-full">
                Tạo tài khoản miễn phí để vào lớp
              </LinkButton>
              <p className="text-center text-sm text-muted">
                Đã có tài khoản?{" "}
                <Link href={`/login?next=${encodeURIComponent(here)}`} className="font-semibold text-primary">
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
