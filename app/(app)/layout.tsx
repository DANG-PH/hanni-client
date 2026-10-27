/**
 * BẢN ĐỒ TRANG — Khung APP (sidebar + thanh trên + chuông + trợ lý AI) cho các trang trong thư mục (app)/
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /assistant/ask/stream                    ← streamAssistant() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.askStream()
 *   GET /assistant/sessions                      ← useAssistantSessions() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.listSessions()
 *   POST /assistant/sessions                     ← createAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.createSession()
 *   DELETE /assistant/sessions/:sessionId        ← deleteAssistantSession() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.deleteSession()
 *   GET /assistant/sessions/:sessionId/messages  ← useAssistantMessages() ở lib/hooks.ts (←
 *                                                  components/assistant-widget.tsx)
 *                                                  → server: modules/assistant/assistant.controller.ts →
 *                                                    AssistantService.getMessages()
 *   GET /notifications                           ← NOTIFICATIONS_KEY() ở lib/notifications.ts (← chính trang này)
 *                                                  → server: modules/notifications/notifications.controller.ts →
 *                                                    NotificationsService.list()
 *   PATCH /notifications/:id/read                ← markNotificationsRead() ở lib/notifications.ts (←
 *                                                  components/notification-bell.tsx)
 *                                                  → server: modules/notifications/notifications.controller.ts →
 *                                                    NotificationsService.markRead()
 *   POST /notifications/read-all                 ← markAllNotificationsRead() ở lib/notifications.ts (←
 *                                                  components/notification-bell.tsx)
 *                                                  → server: modules/notifications/notifications.controller.ts →
 *                                                    NotificationsService.markAllRead()
 *   GET /payments/configured                     ← usePaymentsConfigured() ở lib/payments.ts (←
 *                                                  components/premium-modal.tsx)
 *                                                  → server: modules/payments/payments.controller.ts →
 *                                                    PaymentsService.isConfigured()
 *   GET /payments/orders/:orderCode              ← getOrderStatus() ở lib/payments.ts
 *                                                  → server: modules/payments/payments.controller.ts →
 *                                                    PaymentsService.getOrderStatus()
 *   POST /payments/premium-checkout              ← createPremiumCheckout() ở lib/payments.ts (←
 *                                                  components/premium-modal.tsx)
 *                                                  → server: modules/payments/payments.controller.ts →
 *                                                    PaymentsService.createPremiumCheckout()
 *   GET /premium/status                          ← usePremiumStatus() ở lib/premium.ts (←
 *                                                  components/premium-modal.tsx, components/premium-nav-card.tsx)
 *                                                  → server: modules/premium/premium.controller.ts →
 *                                                    PremiumService.getStatus()
 *   GET /streak                                  ← useStreak() ở lib/hooks.ts (← components/app-shell.tsx)
 *                                                  → server: modules/gamification/gamification.controller.ts →
 *                                                    StreakService.getStreak()
 *   GET /study/stats                             ← useStudyStats() ở lib/hooks.ts (← components/sidebar.tsx)
 *                                                  → server: modules/srs/srs.controller.ts → ReviewService.getStats()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div id="main-content">{children}</div>
    </AppShell>
  );
}
