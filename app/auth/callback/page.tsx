"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [msg, setMsg] = useState("Đang hoàn tất đăng nhập…");

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setMsg("Đăng nhập Google thất bại. Đang quay lại…");
      const t = setTimeout(() => router.replace("/login"), 1500);
      return () => clearTimeout(t);
    }
    void (async () => {
      await refresh();
      const isNew = params.get("new") === "1";
      router.replace(isNew ? "/settings?welcome=1" : "/dashboard");
    })();
  }, [params, router, refresh]);

  return (
    <div className="py-24 text-center text-muted">
      <Spinner />
      <p>{msg}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}
