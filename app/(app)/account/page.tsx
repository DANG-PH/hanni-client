"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  Button,
  Card,
  LinkButton,
  PageHeading,
  Spinner,
} from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { TIMEZONES } from "@/lib/timezones";

export default function AccountPage() {
  const { user, loading, logout } = useRequireAuth();
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();
  if (loading || !user) return <Spinner />;

  async function signOut() {
    setLeaving(true);
    await logout();
    router.replace("/login");
  }

  const timezone = TIMEZONES.find((item) => item.value === user.timezone);
  const initials = user.displayName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

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
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-surface bg-primary text-2xl font-semibold text-primary-fg">
                  {initials || "H"}
                </span>
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
                    ? "Bạn có thể yêu cầu đặt lại mật khẩu qua email đã đăng ký."
                    : "Tài khoản của bạn hiện đăng nhập qua dịch vụ liên kết."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {user.hasPassword && (
                <LinkButton href="/forgot-password" variant="secondary">
                  Đặt lại mật khẩu
                  <Icon name="arrow" size={15} />
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
