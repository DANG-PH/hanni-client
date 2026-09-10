"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AvatarEditor } from "@/components/avatar-editor";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  ErrorNote,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
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
        eyebrow="KHÔNG GIAN CỦA BẠN"
        title="Tài khoản của tôi"
        description="Thông tin cá nhân và những lựa chọn cho hành trình học tập."
      >
        <LinkButton href="/settings" variant="secondary">
          <Icon name="settings" size={17} />
          Cài đặt học tập
        </LinkButton>
      </PageHeading>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0!">
            <div className="relative flex h-28 items-end justify-end overflow-hidden border-b border-primary/10 bg-primary/5 px-7">
              <span
                aria-hidden="true"
                className="hanzi -mb-6 text-9xl text-primary/8"
              >
                你好
              </span>
            </div>
            <div className="relative px-6 pb-6 sm:px-7">
              <div className="-mt-9 mb-5 flex flex-wrap items-end justify-between gap-4">
                <AvatarEditor
                  user={user}
                  size={80}
                  onChange={refresh}
                />
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
          <Card>
            <h2 className="mb-2 font-semibold">Hành trình của tôi</h2>
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
