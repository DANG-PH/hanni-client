"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginShell } from "@/components/login-shell";
import { Button, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không gửi được yêu cầu. Bạn kiểm tra lại email nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginShell>
      <section className="login-form-card reveal">
        <span className="section-label">
          <Icon name="lock" size={12} /> KHÔI PHỤC MẬT KHẨU
        </span>
        <h1 className="mt-5 text-[27px] font-bold leading-tight tracking-tight sm:text-3xl">
          Quên mật khẩu<span className="text-primary">?</span>
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-muted">
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
        </p>
        {sent ? (
          <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-foreground">
            Nếu email tồn tại trong hệ thống, Hanni đã gửi liên kết đặt lại mật khẩu. Bạn hãy kiểm tra hộp thư (cả thư rác) nhé!
            <div className="mt-4">
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-7 space-y-5" aria-busy={busy}>
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-xs font-semibold"
              >
                Email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field login-input"
              />
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
                  Đang gửi…
                </>
              ) : (
                <>
                  Gửi liên kết đặt lại
                  <Icon name="arrow" size={16} />
                </>
              )}
            </Button>
          </form>
        )}
        <p className="login-register-link mt-6 text-center text-xs leading-6 text-muted">
          Nhớ mật khẩu rồi?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    </LoginShell>
  );
}

