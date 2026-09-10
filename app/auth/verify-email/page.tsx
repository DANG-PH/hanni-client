"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

function VerifyInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    if (!token) {
      setState("fail");
      return;
    }
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
          <Link href="/dashboard" className="text-primary hover:underline">
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
      <h1 className="text-2xl font-bold">Xác minh email</h1>
      <Suspense fallback={<Spinner />}>
        <VerifyInner />
      </Suspense>
    </div>
  );
}
