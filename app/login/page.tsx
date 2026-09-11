"use client";

import { Suspense } from "react";
import { LoginShell } from "@/components/login-shell";
import { Spinner } from "@/components/ui";
import { AuthFormCard } from "@/components/auth-form-card";

export default function LoginPage() {
  return (
    <LoginShell>
      <Suspense fallback={<Spinner />}>
        <AuthFormCard initialMode="login" />
      </Suspense>
    </LoginShell>
  );
}

