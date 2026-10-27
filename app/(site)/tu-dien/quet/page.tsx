/**
 * BẢN ĐỒ TRANG — QUÉT ẢNH HỌC TỪ (/tu-dien/quet) — chụp ảnh → AI đọc chữ Hán + gọi tên đồ vật → lưu từ
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
 *   GET /payments/configured                     ← usePaymentsConfigured() ở lib/payments.ts (←
 *                                                  components/premium-modal.tsx)
 *                                                  → server: modules/payments/payments.controller.ts →
 *                                                    PaymentsService.providers()
 *   POST /payments/premium-checkout              ← createPremiumCheckout() ở lib/payments.ts (←
 *                                                  components/premium-modal.tsx)
 *                                                  → server: modules/payments/payments.controller.ts →
 *                                                    PaymentsService.createPremiumCheckout()
 *   GET /premium/status                          ← usePremiumStatus() ở lib/premium.ts (←
 *                                                  components/premium-modal.tsx, components/scan/scan-tool.tsx)
 *                                                  → server: modules/premium/premium.controller.ts →
 *                                                    PremiumService.getStatus()
 *   POST /scan                                   ← scanImage() ở lib/scan.ts (← components/scan/scan-tool.tsx)
 *                                                  → server: modules/scan/scan.controller.ts → ScanService.scan()
 *   GET /scan/usage                              ← useScanUsage() ở lib/scan.ts (← components/scan/scan-tool.tsx)
 *                                                  → server: modules/scan/scan.controller.ts → ScanService.usage()
 *   POST /study/add-word                         ← addWordToSrs() ở lib/hooks.ts (← components/scan/scan-tool.tsx)
 *                                                  → server: modules/srs/srs.controller.ts → ReviewService.addWord()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

/**
 * Quét ảnh học từ — trang CÔNG KHAI (Google index được, nhắm truy vấn "dịch
 * tiếng Trung qua ảnh"), công cụ chạy sau khi đăng nhập (mỗi người 3 ảnh/ngày,
 * Premium 100). Khác Google Dịch ở chỗ mỗi từ trong ảnh nối thẳng vào từ điển
 * Hanni: âm Hán Việt, nghĩa, audio và lưu vào ôn tập.
 */
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icon";
import { ScanTool } from "@/components/scan/scan-tool";

export const metadata: Metadata = {
  title: "Quét ảnh dịch tiếng Trung, kèm âm Hán Việt | Hanni",
  description:
    "Chụp thực đơn, biển hiệu, bao bì, trang sách hay món ăn, đồ vật — Hanni đọc chữ Hán, dịch sang tiếng Việt và tách từng từ kèm pinyin, âm Hán Việt, nghĩa, audio để lưu vào ôn tập.",
  alternates: { canonical: "/tu-dien/quet" },
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "camera",
    title: "Chụp hoặc chọn ảnh",
    text: "Thực đơn, biển hiệu, bao bì, sách, tin nhắn, chữ viết tay. Không có chữ thì chụp món ăn, đồ vật.",
  },
  {
    icon: "search",
    title: "Bấm vào từng từ",
    text: "Mỗi từ có pinyin, âm Hán Việt, nghĩa tiếng Việt từ từ điển Hanni và audio phát âm chuẩn.",
  },
  {
    icon: "cards",
    title: "Lưu vào ôn tập",
    text: "Một chạm là từ vào danh sách ôn tập ngắt quãng — gặp lại đúng lúc sắp quên.",
  },
];

export default function ScanPage() {
  return (
    <div className="page-wrap max-w-5xl! space-y-7 py-10!">
      <section className="text-center">
        <span className="eyebrow">QUÉT ẢNH HỌC TỪ</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Chụp là hiểu chữ Hán</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
          Hanni đọc từng dòng chữ trong ảnh, dịch sang tiếng Việt rồi tách ra từng từ kèm pinyin,
          <strong className="text-foreground"> âm Hán Việt</strong> và nghĩa — chụp món ăn, đồ vật thì cho biết tên
          tiếng Trung của chúng.
        </p>
      </section>

      <ScanTool />

      <section aria-label="Cách dùng" className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="panel p-5">
            <span className="icon-tile">
              <Icon name={s.icon} />
            </span>
            <h2 className="mt-3 text-sm font-bold">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
