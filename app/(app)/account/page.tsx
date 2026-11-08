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
  const locale = user.locale.toLowerCase();
  const language = locale.startsWith("vi") ? "Tiếng Việt" : locale.startsWith("en") ? "Tiếng Anh" : user.locale;

  return (
    <div className="page-wrap space-y-5">
      <PageHeading
        scene="account"
        featured
        icon="user"
        title="Tài khoản của tôi"
        description="Hồ sơ, mục tiêu học tập và các quyền lợi của bạn."
      >
        <LinkButton href="/settings" variant="secondary"><Icon name="settings" size={16} /> Cài đặt học tập</LinkButton>
        <Link href="#bao-mat" className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-muted hover:text-primary"><Icon name="lock" size={16} /> Bảo mật</Link>
      </PageHeading>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(270px,1fr)]">
        <section id="ho-so" className="panel min-w-0 scroll-mt-24 overflow-hidden shadow-none" aria-label="Hồ sơ">
          <div className="flex items-center gap-3 bg-[#fffbf8] p-4 sm:gap-5 sm:p-5">
            <AvatarEditor user={user} size={64} onChange={refresh} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold [overflow-wrap:anywhere]">{user.displayName}</h2>
              <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">{user.email}</p>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${user.emailVerifiedAt ? "bg-good/8 text-good" : "bg-surface-2 text-muted"}`}>
                <Icon name={user.emailVerifiedAt ? "check" : "info"} size={13} className="shrink-0" />
                {user.emailVerifiedAt ? "Đã xác minh email" : "Chưa xác minh email"}
              </span>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px border-y border-border bg-border">
            <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
              <dt className="text-xs text-muted">Múi giờ học tập</dt>
              <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">{timezone?.label ?? user.timezone}</dd>
            </div>
            <div className="min-w-0 bg-surface px-4 py-3 sm:px-5">
              <dt className="text-xs text-muted">Ngôn ngữ</dt>
              <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">{language}</dd>
            </div>
          </dl>
          <Link href={`/u/${user.id}`} className="flex min-h-11 items-center justify-between gap-2 px-4 text-sm font-semibold text-primary hover:bg-primary/5 sm:px-5">
            Xem hồ sơ công khai <Icon name="arrow" size={16} />
          </Link>
        </section>

        <section id="premium" aria-label="Premium" className="min-w-0 scroll-mt-24 space-y-2">
          <PremiumSection />
          <Link href="/progress#hanni-coach" className="flex min-h-14 items-center gap-3 rounded-xl border border-accent/25 bg-[#fffaf1] px-4 py-3 hover:border-accent/50">
            <Icon name="spark" size={18} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <strong className="block text-sm">Hanni Coach</strong>
              <span className="block text-xs leading-5 text-muted">Xem nhận xét và việc nên luyện tiếp</span>
            </span>
            <Icon name="arrow" size={16} className="shrink-0 text-accent" />
          </Link>
        </section>

        <section id="muc-tieu" className="panel min-w-0 scroll-mt-24 p-4 shadow-none sm:p-5" aria-labelledby="account-goal-title">
          <h2 id="account-goal-title" className="flex items-center gap-2 font-bold">
            <Icon name="target" size={18} className="text-primary" /> Mục tiêu mỗi ngày
          </h2>
          {user.settings ? (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <strong className="text-2xl tabular-nums">{user.settings.dailyGoalValue}</strong>
              <span className="text-sm text-muted">{user.settings.dailyGoalType === "MINUTES" ? "phút học" : "từ ôn"}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-muted">Chọn mục tiêu phù hợp trong cài đặt học tập.</p>
          )}
          <Link href="/settings" className="mt-1 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Cài đặt học tập <Icon name="arrow" size={15} />
          </Link>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2">
            {[
              ["/progress", "Tiến độ"],
              ["/achievements", "Huy hiệu"],
              ["/learn", "Lộ trình HSK"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="inline-flex min-h-9 items-center text-sm font-semibold text-muted hover:text-primary">{label}</Link>
            ))}
          </div>
        </section>

        <section id="bao-mat" className="panel min-w-0 scroll-mt-24 p-4 shadow-none sm:p-5" aria-labelledby="account-security-title">
          <h2 id="account-security-title" className="flex items-center gap-2 font-bold">
            <Icon name="lock" size={18} className="text-primary" /> Bảo mật và đăng nhập
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {user.hasPassword ? "Đổi mật khẩu hoặc đặt lại qua email nếu bạn quên." : "Bạn có thể đặt thêm mật khẩu để đăng nhập bằng email."}
          </p>
          <PasswordForm hasPassword={user.hasPassword} onChanged={() => void refresh()} />
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {user.hasPassword && <LinkButton href="/forgot-password" variant="ghost">Quên mật khẩu?</LinkButton>}
            <Button variant="ghost" disabled={leaving} onClick={() => void signOut()}>
              <Icon name="logout" size={16} /> {leaving ? "Đang đăng xuất…" : "Đăng xuất"}
            </Button>
          </div>
        </section>
        <section id="lop-va-ban" className="grid min-w-0 scroll-mt-24 items-start gap-4 md:grid-cols-2 lg:col-span-2" aria-label="Lớp học và bạn bè">
          <ClassroomCard />
          <ReferralCard userId={user.id} />
        </section>
        <div className="lg:col-span-2">
          <DangerZone hasPassword={user.hasPassword} />
        </div>
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
      </div>
      <div className="mt-4">
        <JoinClassForm id="account-class-code" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-primary">
        <Link href="/lop-hoc" className="inline-flex min-h-9 items-center hover:underline">Mở lớp học</Link>
        <Link href="/lop-hoc#tao-lop" className="inline-flex min-h-9 items-center hover:underline">Tạo lớp miễn phí</Link>
      </div>
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
