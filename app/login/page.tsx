"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LoginShell } from "@/components/login-shell";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { Icon } from "@/components/icon";
import { GoogleButton } from "@/components/google-button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-redirect";

function LoginContent() {
  const next = safeNextPath(useSearchParams().get("next"));
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const onGoogleSuccess = useCallback(async () => {
    await refresh();
    router.replace(next);
  }, [refresh, router, next]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/login", { email, password });
      await refresh();
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Chưa đăng nhập được. Bạn kiểm tra kết nối rồi thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login-form-card reveal">
      <span className="section-label">
        <Icon name="clock" size={12} /> MỖI NGÀY MỘT CHÚT TIẾNG TRUNG
      </span>
      <h1 className="mt-5 text-[27px] font-bold leading-tight tracking-tight sm:text-3xl">
        Chào mừng bạn trở lại<span className="text-primary">.</span>
      </h1>
      <p className="mt-2.5 text-sm leading-6 text-muted">
        Góc học tập quen thuộc, những điều mới đang chờ.
      </p>
      {hasGoogle && (
        <div className="mt-7">
          <GoogleButton onSuccess={onGoogleSuccess} />
          <div className="my-6 flex items-center gap-3 text-[10px] font-semibold tracking-wider text-muted">
            <span className="h-px flex-1 bg-border" />
            HOẶC ĐĂNG NHẬP BẰNG EMAIL
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-7 space-y-5" aria-busy={busy}>
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-xs font-semibold"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ban@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field login-input"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="text-xs font-semibold">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-primary hover:underline underline-offset-4"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field login-input pr-12!"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-primary"
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button
          type="submit"
          disabled={busy}
          className="login-submit w-full min-h-12!"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              Đang đăng nhập…
            </>
          ) : (
            <>
              Đăng nhập
              <Icon name="arrow" size={16} />
            </>
          )}
        </Button>
      </form>
      <p className="login-register-link mt-6 text-center text-xs leading-6 text-muted">
        Chưa có tài khoản?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(next)}`}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <LoginShell>
      <Suspense fallback={<Spinner />}>
        <LoginContent />
      </Suspense>
    </LoginShell>
  );
}
