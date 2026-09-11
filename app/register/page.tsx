"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/auth-redirect";
import { Spinner } from "@/components/ui";
import { Suspense, useEffect, useState } from "react";
import { Button, Card, ErrorNote } from "@/components/ui";
import { GoogleButton } from "@/components/google-button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function RegisterContent() {
  const next = safeNextPath(useSearchParams().get("next"));
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.post("/auth/register", { ...form, timezone: tz });
      await refresh();
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đăng ký được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Bắt đầu cùng Hanni"
      description="Tạo tài khoản để lưu tiến độ và học theo nhịp của riêng bạn."
    >
      <Card className="register-fields mt-6 space-y-4">
        <GoogleButton
          mode="signup"
          onSuccess={async (isNewUser) => {
            await refresh();
            router.replace(
              next !== "/dashboard"
                ? next
                : isNewUser
                  ? "/settings?welcome=1"
                  : "/dashboard",
            );
          }}
        />
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" /> hoặc{" "}
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={onSubmit} className="register-form space-y-4">
          <div>
            <label
              htmlFor="register-name"
              className="register-field-label hidden"
            >
              Tên hiển thị
            </label>
            <input
              id="register-name"
              required
              aria-label="Tên hiển thị"
              autoComplete="nickname"
              placeholder="Tên bạn muốn được gọi"
              value={form.displayName}
              onChange={set("displayName")}
              className="field"
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="register-field-label hidden"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              aria-label="Địa chỉ email"
              autoComplete="email"
              placeholder="Email của bạn"
              value={form.email}
              onChange={set("email")}
              className="field"
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="register-field-label hidden"
            >
              Mật khẩu
            </label>
            <input
              id="register-password"
              type="password"
              required
              minLength={8}
              aria-label="Mật khẩu (ít nhất 8 ký tự)"
              autoComplete="new-password"
              placeholder="Mật khẩu (ít nhất 8 ký tự)"
              value={form.password}
              onChange={set("password")}
              className="field"
            />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Đang xử lý…" : "Đăng ký"}
          </Button>
        </form>

        <p className="register-signin text-sm text-muted">
          Đã có tài khoản?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-foreground hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterContent />
    </Suspense>
  );
}
