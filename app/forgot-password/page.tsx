"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await api.post("/auth/forgot-password", { email }).catch(() => undefined);
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
      <Card className="mt-6">
        {sent ? (
          <p className="text-sm text-muted">
            Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Kiểm tra
            hộp thư (ở môi trường dev, link được in ra console của server).
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={busy} className="w-full">
              Gửi liên kết đặt lại
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
