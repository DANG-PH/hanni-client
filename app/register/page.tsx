"use client";

/**
 * BẢN ĐỒ TRANG — ĐĂNG KÝ (/register) — tạo tài khoản; xong thì nạp bài học/đề thi/từ đã làm khi còn là khách
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   POST /auth/google                 ← components/google-button.tsx
 *                                       → server: modules/auth/auth.controller.ts → AuthService.loginWithGoogle()
 *   POST /auth/login                  ← components/auth-form-card.tsx
 *                                       → server: modules/auth/auth.controller.ts → AuthService.login()
 *   POST /auth/register               ← components/auth-form-card.tsx
 *                                       → server: modules/auth/auth.controller.ts → AuthService.register()
 *   POST /learn/lessons/:id/complete  ← drainPendingLessons() ở lib/pending-lessons.ts (←
 *                                       components/auth-form-card.tsx)
 *                                       → server: modules/learn/learn.controller.ts → LessonSessionService.complete()
 *   POST /mock-exams/:slug/submit     ← drainPendingExam() ở lib/pending-lessons.ts (← components/auth-form-card.tsx)
 *                                       → server: modules/mock-exams/mock-exams.controller.ts →
 *                                         MockExamsService.submit()
 *   POST /onboarding                  ← submitOnboarding() ở lib/hooks.ts (← components/auth-form-card.tsx)
 *                                       → server: modules/onboarding/onboarding.controller.ts →
 *                                         OnboardingService.submit()
 *   POST /study/add-word              ← addWordToSrs() ở lib/hooks.ts (← components/auth-form-card.tsx)
 *                                       → server: modules/srs/srs.controller.ts → ReviewService.addWord()
 *   PATCH /users/me/settings          ← drainPendingCourseLevel() ở lib/pending-lessons.ts (←
 *                                       components/auth-form-card.tsx) · drainPendingLessons() ở
 *                                       lib/pending-lessons.ts (← components/auth-form-card.tsx)
 *                                       → server: modules/users/users.controller.ts → UserSettingsService.update()
 */

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


