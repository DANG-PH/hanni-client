"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, ErrorNote } from "@/components/ui";
import { GoogleButton } from "@/components/google-button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/login", { email, password });
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đăng nhập được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Chào mừng bạn trở lại"
      description="Góc học tập của bạn đang chờ. Cùng tiếp tục hành trình nhé."
    >
      <Card className="mt-6 space-y-4">
        <GoogleButton
          onSuccess={async () => {
            await refresh();
            router.replace("/dashboard");
          }}
        />
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" /> hoặc{" "}
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            aria-label="Địa chỉ email"
            autoComplete="email"
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
          <input
            type="password"
            required
            aria-label="Mật khẩu"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Đang xử lý…" : "Đăng nhập"}
          </Button>
        </form>

        <div className="flex justify-between text-sm text-muted">
          <Link href="/forgot-password" className="hover:text-foreground">
            Quên mật khẩu?
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Tạo tài khoản
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
