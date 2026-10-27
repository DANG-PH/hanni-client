"use client";

/**
 * BẢN ĐỒ TRANG — TÀI KHOẢN (/account) — ảnh đại diện, Premium, lớp học, mời bạn, đổi mật khẩu, xoá tài khoản
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   GET /classrooms/mine             ← useMyClassrooms() ở lib/classrooms.ts (← chính trang này)
 *                                      → server: modules/classrooms/classrooms.controller.ts →
 *                                        ClassroomsService.mine()
 *   GET /payments/configured         ← usePaymentsConfigured() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                      → server: modules/payments/payments.controller.ts →
 *                                        PaymentsService.providers()
 *   GET /payments/orders/:orderCode  ← getOrderStatus() ở lib/payments.ts (← components/premium-section.tsx)
 *                                      → server: modules/payments/payments.controller.ts →
 *                                        PaymentsService.getOrderStatus()
 *   POST /payments/premium-checkout  ← createPremiumCheckout() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                      → server: modules/payments/payments.controller.ts →
 *                                        PaymentsService.createPremiumCheckout()
 *   GET /premium/status              ← usePremiumStatus() ở lib/premium.ts (← components/premium-modal.tsx,
 *                                      components/premium-section.tsx)
 *                                      → server: modules/premium/premium.controller.ts → PremiumService.getStatus()
 *   GET /referrals/me                ← useReferralStats() ở lib/hooks.ts (← chính trang này)
 *                                      → server: modules/referrals/referrals.controller.ts →
 *                                        ReferralsService.getStats()
 *   DELETE /users/me                 ← chính trang này
 *                                      → server: modules/users/users.controller.ts → UsersService.deleteAccount()
 *   POST /users/me/avatar            ← components/avatar-editor.tsx
 *                                      → server: modules/users/users.controller.ts → UsersService.setAvatarFile()
 *   DELETE /users/me/avatar          ← components/avatar-editor.tsx
 *                                      → server: modules/users/users.controller.ts → UsersService.clearAvatar()
 *   POST /users/me/password          ← chính trang này
 *                                      → server: modules/users/users.controller.ts → UsersService.changePassword()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AvatarEditor } from "@/components/avatar-editor";
import { JoinClassForm } from "@/components/classrooms/join-class-form";
import { Icon } from "@/components/icon";
import { PremiumSection } from "@/components/premium-section";
import { ShareButton } from "@/components/share-button";
import {
  Button,
  Card,
  ErrorNote,
  LinkButton,
  PageHeading,
  SectionHeading,
  Spinner,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { useMyClassrooms } from "@/lib/classrooms";
import { useReferralStats } from "@/lib/hooks";
import { TIMEZONES } from "@/lib/timezones";

export default function AccountPage() {
  const { user, loading, logout, refresh } = useRequireAuth();
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  if (loading || !user) return <Spinner />;

  async function signOut() {
    setLeaving(true);
    await logout();
    router.replace("/login");
  }

  const timezone = TIMEZONES.find((item) => item.value === user.timezone);

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        icon="user"
        tone="lavender"
        eyebrow="Không gian của bạn"
        title="Tài khoản của tôi"
        description="Hồ sơ, mật khẩu, lớp học, Premium và mời bạn bè."
      >
        <LinkButton href="/settings" variant="secondary">
          <Icon name="settings" size={17} />
          Cài đặt học tập
        </LinkButton>
      </PageHeading>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0! border-primary/20 shadow-md">
            <div className="relative flex h-32 items-end justify-between overflow-hidden border-b border-primary/15 bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10 px-7 py-3">
              {/* Nhãn ở góc TRÊN: góc dưới bên trái là chỗ avatar kéo lên đè. */}
              <div className="flex items-center gap-2 self-start">
                <span className="whitespace-nowrap rounded-full bg-surface/80 px-3 py-1 text-xs font-bold text-primary shadow-2xs">
                  Học viên Hanni
                </span>
              </div>
              <span
                aria-hidden="true"
                className="hanzi -mb-6 text-9xl font-bold text-primary/12 select-none"
              >
                你好
              </span>
            </div>
            <div className="relative px-6 pb-6 sm:px-7">
              <div className="-mt-9 mb-5 flex flex-wrap items-end justify-between gap-4">
                <AvatarEditor user={user} size={80} onChange={refresh} />
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted">
                  <Icon
                    name={user.emailVerifiedAt ? "check" : "info"}
                    size={13}
                  />
                  {user.emailVerifiedAt
                    ? "Email đã xác minh"
                    : "Email chưa xác minh"}
                </span>
              </div>
              <h2 className="break-words text-xl font-semibold">
                {user.displayName}
              </h2>
              <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
              <dl className="mt-6 divide-y divide-border border-t border-border text-sm">
                <div className="flex flex-wrap justify-between gap-2 py-4">
                  <dt className="text-muted">Tên hiển thị</dt>
                  <dd className="break-words font-medium">
                    {user.displayName}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-4">
                  <dt className="text-muted">Múi giờ học tập</dt>
                  <dd className="font-medium">
                    {timezone?.label ?? user.timezone}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-4">
                  <dt className="text-muted">Ngôn ngữ tài khoản</dt>
                  <dd className="font-medium">
                    {user.locale.toLowerCase().startsWith("vi")
                      ? "Tiếng Việt"
                      : user.locale.toLowerCase().startsWith("en")
                        ? "Tiếng Anh"
                        : user.locale}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <span className="icon-tile">
                <Icon name="lock" />
              </span>
              <div>
                <h2 className="font-semibold">Bảo mật tài khoản</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {user.hasPassword
                    ? "Đổi mật khẩu ngay tại đây, hoặc đặt lại qua email nếu bạn quên."
                    : "Bạn đang đăng nhập qua Google. Có thể đặt thêm mật khẩu để đăng nhập bằng email."}
                </p>
              </div>
            </div>

            <PasswordForm
              hasPassword={user.hasPassword}
              onChanged={() => void refresh()}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {user.hasPassword && (
                <LinkButton href="/forgot-password" variant="ghost">
                  Quên mật khẩu?
                </LinkButton>
              )}
              <Button
                variant="ghost"
                disabled={leaving}
                onClick={() => void signOut()}
              >
                <Icon name="logout" size={17} />
                {leaving ? "Đang đăng xuất…" : "Đăng xuất"}
              </Button>
            </div>
          </Card>
          <ClassroomCard />
          <ReferralCard userId={user.id} />
          <DangerZone hasPassword={user.hasPassword} />
        </div>
        <aside className="space-y-5">
          <Card>
            <h2 className="mb-5 flex items-center gap-2 font-semibold">
              <Icon name="target" className="text-primary" size={19} />
              Nhịp học của bạn
            </h2>
            {user.settings ? (
              <>
                <p className="text-3xl font-semibold">
                  {user.settings.dailyGoalValue}
                  <span className="ml-2 text-sm font-normal text-muted">
                    {user.settings.dailyGoalType === "MINUTES"
                      ? "phút / ngày"
                      : "từ ôn / ngày"}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  Thêm {user.settings.newCardsPerDay} từ mới mỗi ngày.
                </p>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Chọn mục tiêu và lịch ôn phù hợp trong cài đặt học tập.
              </p>
            )}
            <Link
              href="/settings"
              className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm font-medium text-primary"
            >
              Điều chỉnh mục tiêu <Icon name="arrow" size={16} />
            </Link>
          </Card>
          <PremiumSection />
          <Card>
            <SectionHeading
              icon="route"
              tone="lavender"
              title="Hành trình của tôi"
              className="mb-2"
            />
            {[
              {
                href: "/progress",
                icon: "chart" as const,
                label: "Tiến độ học tập",
              },
              {
                href: "/achievements",
                icon: "trophy" as const,
                label: "Bộ sưu tập huy hiệu",
              },
              { href: "/learn", icon: "route" as const, label: "Lộ trình HSK" },
              {
                href: `/u/${user.id}`,
                icon: "user" as const,
                label: "Hồ sơ công khai",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-2 py-3 text-sm text-muted transition-colors hover:bg-primary/5 hover:text-primary"
              >
                <Icon name={item.icon} size={18} />
                <span className="flex-1">{item.label}</span>
                <Icon name="arrow" size={15} />
              </Link>
            ))}
          </Card>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <p className="hanzi mb-2 text-2xl text-primary">学无止境</p>
            <p className="text-sm font-medium">Học không có điểm dừng.</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Hanni đồng hành cùng bạn qua từng bài học nhỏ.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PasswordForm({
  hasPassword,
  onChanged,
}: {
  hasPassword: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (next.length < 8) {
      setError("Mật khẩu mới cần ít nhất 8 ký tự.");
      return;
    }
    if (next !== confirm) {
      setError("Hai ô mật khẩu mới không khớp.");
      return;
    }
    setBusy(true);
    try {
      // API → POST /users/me/password · server: modules/users/users.controller.ts → UsersService.changePassword()
      await api.post("/users/me/password", {
        currentPassword: hasPassword ? cur : undefined,
        newPassword: next,
      });
      setDone(true);
      setOpen(false);
      setCur("");
      setNext("");
      setConfirm("");
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Chưa đổi được mật khẩu.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-5">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <Icon name="lock" size={16} />
          {hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu"}
        </Button>
        {done && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-good">
            <Icon name="check" size={15} /> Đã cập nhật mật khẩu.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
      {hasPassword && (
        <label className="block text-sm font-medium">
          Mật khẩu hiện tại
          <input
            type="password"
            autoComplete="current-password"
            required
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            className="field mt-1.5"
          />
        </label>
      )}
      <label className="block text-sm font-medium">
        Mật khẩu mới
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="field mt-1.5"
        />
      </label>
      <label className="block text-sm font-medium">
        Nhập lại mật khẩu mới
        <input
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field mt-1.5"
        />
      </label>
      {error && <ErrorNote>{error}</ErrorNote>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu mật khẩu"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          Huỷ
        </Button>
      </div>
    </form>
  );
}

/** Thêm 1 lối vào lớp học ngoài mục "Lớp học" ở menu — như Duolingo:
 * học viên nhập mã lớp ở Cài đặt → Duolingo for Schools. */
function ClassroomCard() {
  const { data } = useMyClassrooms();
  const count = (data?.owned.length ?? 0) + (data?.joined.length ?? 0);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="icon-tile">
          <Icon name="users" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Lớp học</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {count > 0
              ? `Bạn đang ở ${count} lớp.`
              : "Giáo viên gửi mã lớp cho bạn? Nhập ở đây để nhận bài được giao ngay ở Trang chủ."}
          </p>
        </div>
        {count > 0 && (
          <LinkButton href="/lop-hoc" variant="secondary" className="shrink-0 px-3! text-xs">
            Mở lớp học
          </LinkButton>
        )}
      </div>
      <div className="mt-4">
        <JoinClassForm id="account-class-code" />
      </div>
      <p className="mt-3 text-sm text-muted">
        Bạn dạy tiếng Trung?{" "}
        <Link href="/lop-hoc#tao-lop" className="font-semibold text-primary hover:underline">
          Tạo lớp miễn phí
        </Link>
      </p>
    </Card>
  );
}

function ReferralCard({ userId }: { userId: string }) {
  const { data } = useReferralStats();

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="icon-tile">
          <Icon name="spark" />
        </span>
        <div>
          <h2 className="font-semibold">Mời bạn bè cùng học</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Khi bạn mời hoàn thành ngày học đầu tiên, cả hai đều nhận thêm 1
            lá chắn giữ chuỗi ngày học.
          </p>
        </div>
      </div>
      {data && data.totalReferred > 0 && (
        <p className="mt-4 text-sm">
          Đã mời <strong>{data.totalReferred}</strong> người ·{" "}
          <strong className="text-good">{data.rewardedCount}</strong> đã nhận
          thưởng
          {data.pendingCount > 0 && ` · ${data.pendingCount} đang chờ`}
        </p>
      )}
      <div className="mt-5">
        <ShareButton
          title="Học tiếng Trung cùng mình trên Hanni"
          text="Mình đang học tiếng Trung theo chuẩn HSK 3.0 trên Hanni — vào học cùng mình nhé, cả hai sẽ nhận thêm lá chắn giữ chuỗi ngày học!"
          path={`/register?ref=${userId}`}
        />
      </div>
    </Card>
  );
}

const DELETE_CONFIRM_WORD = "XÓA";

function DangerZone({ hasPassword }: { hasPassword: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    confirmText.trim().toUpperCase() === DELETE_CONFIRM_WORD &&
    (!hasPassword || password.length > 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError("");
    try {
      // API → DELETE /users/me · server: modules/users/users.controller.ts → UsersService.deleteAccount()
      await api.del("/users/me", hasPassword ? { password } : undefined);
      await logout();
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Chưa xoá được tài khoản.",
      );
      setBusy(false);
    }
  }

  return (
    <Card className="border-danger/20">
      <div className="flex items-start gap-3">
        <span className="icon-tile bg-danger/10 text-danger">
          <Icon name="trash" />
        </span>
        <div>
          <h2 className="font-semibold text-danger">Vùng nguy hiểm</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Xoá tài khoản sẽ xoá vĩnh viễn toàn bộ tiến độ học và dữ liệu cá
            nhân — không thể khôi phục.
          </p>
        </div>
      </div>

      {!open ? (
        <Button
          variant="secondary"
          className="mt-5 text-danger"
          onClick={() => setOpen(true)}
        >
          <Icon name="trash" size={16} />
          Xoá tài khoản
        </Button>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
          {hasPassword && (
            <label className="block text-sm font-medium">
              Nhập mật khẩu để xác nhận
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field mt-1.5"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            Gõ &quot;{DELETE_CONFIRM_WORD}&quot; để xác nhận
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="field mt-1.5"
              placeholder={DELETE_CONFIRM_WORD}
            />
          </label>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!canSubmit || busy}
              className="bg-danger! hover:bg-danger/90!"
            >
              {busy ? "Đang xoá…" : "Xoá vĩnh viễn"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setError("");
                setPassword("");
                setConfirmText("");
              }}
            >
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
