"use client";

import { Suspense } from "react";
import { LoginShell } from "@/components/login-shell";
import { Spinner } from "@/components/ui";
import { AuthFormCard } from "@/components/auth-form-card";

export default function RegisterPage() {
  return (
    <LoginShell>
      <Suspense fallback={<Spinner />}>
        <AuthFormCard initialMode="register" />
      </Suspense>
    </LoginShell>
  );
}


