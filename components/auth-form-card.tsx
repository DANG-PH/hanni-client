"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { GoogleButton } from "@/components/google-button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-redirect";

export function AuthFormCard({ initialMode }: { initialMode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const handlePopState = () => {
      const isRegister = window.location.pathname.startsWith("/register");
      setMode(isRegister ? "register" : "login");
      setError(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const switchMode = (newMode: "login" | "register") => {
    setError(null);
    setMode(newMode);
    const targetUrl = newMode === "register"
      ? `/register?next=${encodeURIComponent(next)}`
      : `/login?next=${encodeURIComponent(next)}`;
    window.history.pushState(null, "", targetUrl);
  };

  const onGoogleSuccess = useCallback(
    async (isNewUser: boolean) => {
      await refresh();
      if (mode === "register") {
        router.replace(
          next !== "/dashboard"
            ? next
            : isNewUser
              ? "/settings?welcome=1"
              : "/dashboard",
        );
      } else {
        router.replace(next);
      }
    },
    [refresh, router, next, mode],
  );

  async function onLoginSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/login", { email: loginEmail, password: loginPassword });
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

  async function onRegisterSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await api.post("/auth/register", {
        displayName: regDisplayName,
        email: regEmail,
        password: regPassword,
        timezone: tz,
      });
      await refresh();
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không đăng ký được. Bạn kiểm tra kết nối rồi thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <section className="login-form-card reveal">
      <div className="transition-all duration-300 ease-out">
        <span className="section-label">
          <Icon name={isLogin ? "clock" : "spark"} size={12} /> MỖI NGÀY MỘT CHÚT TIẾNG TRUNG
        </span>
        <h1 className="mt-5 text-[27px] font-bold leading-tight tracking-tight sm:text-3xl">
          {isLogin ? (
            <>
              Chào mừng bạn trở lại<span className="text-primary">.</span>
            </>
          ) : (
            <>
              Bắt đầu cùng Hanni<span className="text-primary">.</span>
            </>
          )}
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-muted">
          {isLogin
            ? "Góc học tập quen thuộc, những điều mới đang chờ."
            : "Tạo tài khoản để lưu tiến độ và học theo nhịp của riêng bạn."}
        </p>

        {hasGoogle && (
          <div className="mt-7">
            <GoogleButton mode={isLogin ? "signin" : "signup"} onSuccess={onGoogleSuccess} />
            <div className="my-6 flex items-center gap-3 text-[10px] font-semibold tracking-wider text-muted">
              <span className="h-px flex-1 bg-border" />
              {isLogin ? "HOẶC ĐĂNG NHẬP BẰNG EMAIL" : "HOẶC ĐĂNG KÝ BẰNG EMAIL"}
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={onLoginSubmit} className="mt-7 space-y-5" aria-busy={busy}>
            <div>
              <label htmlFor="login-email" className="mb-2 block text-xs font-semibold">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ban@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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
            <Button type="submit" disabled={busy} className="login-submit w-full min-h-12!">
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
        ) : (
          <form onSubmit={onRegisterSubmit} className="mt-7 space-y-5" aria-busy={busy}>
            <div>
              <label htmlFor="register-name" className="mb-2 block text-xs font-semibold">
                Tên hiển thị
              </label>
              <input
                id="register-name"
                name="displayName"
                type="text"
                required
                autoComplete="nickname"
                placeholder="Tên bạn muốn được gọi"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                className="field login-input"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-2 block text-xs font-semibold">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email của bạn"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="field login-input"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="mb-2 block text-xs font-semibold">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Mật khẩu (ít nhất 8 ký tự)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
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
            <Button type="submit" disabled={busy} className="login-submit w-full min-h-12!">
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Đang tạo tài khoản…
                </>
              ) : (
                <>
                  Đăng ký
                  <Icon name="arrow" size={16} />
                </>
              )}
            </Button>
          </form>
        )}

        <p className="login-register-link mt-6 text-center text-xs leading-6 text-muted">
          {isLogin ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-semibold text-primary underline-offset-4 hover:underline cursor-pointer"
              >
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-primary underline-offset-4 hover:underline cursor-pointer"
              >
                Đăng nhập
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
