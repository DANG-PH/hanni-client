/**
 * BẢN ĐỒ TRANG — KIỂM TRA TRÌNH ĐỘ (/kiem-tra-trinh-do) — hỏi dần theo cấp, đề xuất cấp bắt đầu
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /learn/placement             ← components/placement-test.tsx
 *                                      → server: modules/learn/learn.controller.ts → PlacementService.questions()
 *   GET /payments/configured         ← usePaymentsConfigured() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                      → server: modules/payments/payments.controller.ts →
 *                                        PaymentsService.providers()
 *   POST /payments/premium-checkout  ← createPremiumCheckout() ở lib/payments.ts (← components/premium-modal.tsx)
 *                                      → server: modules/payments/payments.controller.ts →
 *                                        PaymentsService.createPremiumCheckout()
 *   GET /premium/status              ← usePremiumStatus() ở lib/premium.ts (← components/premium-modal.tsx,
 *                                      components/premium-nav-card.tsx)
 *                                      → server: modules/premium/premium.controller.ts → PremiumService.getStatus()
 *   GET /study/stats                 ← useStudyStats() ở lib/hooks.ts (← components/sidebar.tsx)
 *                                      → server: modules/srs/srs.controller.ts → ReviewService.getStats()
 */

import type { Metadata } from "next";
import { PlacementTest } from "@/components/placement-test";

// Màn giới thiệu render sẵn trong HTML (client component vẫn SSR trạng thái
// đầu) — "kiểm tra trình độ tiếng Trung" là truy vấn người Việt hay tìm, nên
// trang này được index, khác `/bai-hoc`.
export const metadata: Metadata = {
  title: "Kiểm tra trình độ tiếng Trung miễn phí — bạn đang ở HSK mấy? | Hanni",
  description:
    "Bài kiểm tra trình độ tiếng Trung online miễn phí, không cần đăng ký: câu hỏi nghe – đọc bằng từ vựng HSK 3.0 thật, chọn cấp bắt đầu, đúng thì lên cấp, sai thì xuống cấp — biết ngay nên học từ HSK mấy. Khoảng 2–5 phút.",
  alternates: { canonical: "/kiem-tra-trinh-do" },
};

export default function PlacementPage() {
  return <PlacementTest />;
}
