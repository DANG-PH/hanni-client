/**
 * BẢN ĐỒ TRANG — Khung trang CÔNG KHAI (SEO): khách thấy menu site tối giản, người đã đăng nhập thấy khung app có
 *   sidebar
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
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
 *   GET /notifications                           ← useNotifications() ở lib/notifications.ts (←
 *                                                  components/notification-bell.tsx)
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
 *                                                    PaymentsService.providers()
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
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Brand } from "@/components/sidebar";
import { SiteShell } from "@/components/site-shell";

/** Trang công khai: khách thấy khung giới thiệu (Nav + footer), người ĐÃ
 * đăng nhập thấy khung app có sidebar — xem components/site-shell.tsx cho
 * lý do (bấm "Từ điển" trong sidebar mà mất luôn sidebar là lạc đường). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell guest={<GuestFrame>{children}</GuestFrame>}>{children}</SiteShell>
  );
}

function GuestFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="page-wrap grid gap-8 py-10! sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Hanni — trang chủ">
              <Brand />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-6 text-muted">
              Một góc nhỏ để học tiếng Trung mỗi ngày.
              <br />
              Cùng bạn đi từ những bước đầu tiên.
            </p>
          </div>
          {[
            {
              title: "KHÁM PHÁ HANNI",
              links: [
                ["Lộ trình HSK", "/learn"],
                ["Thư viện từ vựng", "/tu-dien"],
                ["Luyện nghe", "/listening"],
                ["Luyện phát âm", "/pronunciation"],
              ],
            },
            {
              title: "ĐỒNG HÀNH CÙNG BẠN",
              links: [
                ["Tài khoản của bạn", "/account"],
                ["Tiến độ học tập", "/progress"],
                ["Học qua video", "/watch"],
                ["Cài ứng dụng Hanni", "/install"],
                ["Câu hỏi thường gặp", "/#cau-hoi"],
              ],
            },
            {
              title: "VỀ HANNI",
              links: [
                ["Giới thiệu", "/gioi-thieu"],
                ["Dành cho giáo viên", "/hop-tac"],
                ["Điều khoản sử dụng", "/dieu-khoan"],
                ["Chính sách bảo mật", "/chinh-sach-bao-mat"],
                ["Nguồn dữ liệu", "/nguon-du-lieu"],
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-bold tracking-wider">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-muted transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="page-wrap flex flex-wrap items-center justify-between gap-3 py-5! text-xs text-muted">
            <span>
              © {new Date().getFullYear()} Hanni. Mỗi ngày một chút, tiến xa
              hơn.
            </span>
            <span>Được xây dựng cho người học tiếng Trung.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
