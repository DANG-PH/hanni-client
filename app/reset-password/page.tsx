"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Card, ErrorNote, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

function ResetInner() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đặt lại được");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="mt-6">
        <p className="text-sm">
          Đã đổi mật khẩu.{" "}
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      {!token ? (
        <ErrorNote>Thiếu token đặt lại mật khẩu.</ErrorNote>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            aria-label="Mật khẩu mới"
            autoComplete="new-password"
            placeholder="Mật khẩu mới (≥ 8 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <Button type="submit" disabled={busy} className="w-full">
            Đặt lại mật khẩu
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
      <Suspense fallback={<Spinner />}>
        <ResetInner />
      </Suspense>
    </div>
  );
}
