"use client";

/**
 * BẢN ĐỒ TRANG — XÁC MINH EMAIL (/auth/verify-email?token=…) — mở từ link trong email
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   POST /auth/verify-email  ← chính trang này
 *                              → server: modules/auth/auth.controller.ts → AuthService.verifyEmail()
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, PageHeading, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

function VerifyInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    if (!token) {
      setState("fail");
      return;
    }
    // API → POST /auth/verify-email · server: modules/auth/auth.controller.ts → AuthService.verifyEmail()
    void api
      .post("/auth/verify-email", { token })
      .then(() => setState("ok"))
      .catch(() => setState("fail"));
  }, [token]);

  return (
    <Card className="mt-6 text-sm">
      {state === "loading" && <Spinner />}
      {state === "ok" && (
        <p>
          Đã xác minh email.{" "}
          <Link href="/learn" className="text-primary hover:underline">
            Vào học
          </Link>
        </p>
      )}
      {state === "fail" && (
        <p className="text-primary">
          Liên kết không hợp lệ hoặc đã hết hạn.
        </p>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageHeading
        icon="check"
        tone="good"
        eyebrow="Tài khoản Hanni"
        title="Xác minh email"
        description="Xác nhận địa chỉ email để tiếp tục hành trình học của bạn."
      />
      <Suspense fallback={<Spinner />}>
        <VerifyInner />
      </Suspense>
    </div>
  );
}
