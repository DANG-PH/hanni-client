"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { CheckoutResponse, PaymentOrder, PaymentProvider } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Cổng nào đã cấu hình ở server (PAYOS_* / MOMO_* trong .env) — chưa cổng nào thì popup Premium hiện "Sắp mở bán"
 * thay vì nút bấm vào báo lỗi. MoMo khoá thử chỉ hiện khi chạy local (`momoSandbox` → hiện thẻ ATM thử); production
 * chỉ hiện MoMo khi có khoá thật.
 * API → GET /payments/configured · server: modules/payments/payments.controller.ts → PaymentsService.providers()
 */
export function usePaymentsConfigured() {
  return useSWR<{ configured: boolean; payos?: boolean; momo?: boolean; momoSandbox?: boolean }>(
    "/payments/configured",
    fetcher,
  );
}

/**
 * Tạo đơn Premium + link thanh toán ở cổng đã chọn (payOS / MoMo) — xem `hanni-server/CLAUDE.md` mục Premium.
 * API → POST /payments/premium-checkout · server: modules/payments/payments.controller.ts → PaymentsService.createPremiumCheckout()
 */
export function createPremiumCheckout(planKey: string, provider: PaymentProvider = "payos") {
  return api.post<CheckoutResponse>("/payments/premium-checkout", { planKey, provider });
}

/**
 * Trạng thái 1 đơn — đọc khi payOS/MoMo đưa người dùng quay về `/account?premium=<mã đơn>`. Đơn còn PENDING thì
 * server tự hỏi lại cổng thanh toán (không chỉ đợi webhook).
 * API → GET /payments/orders/:orderCode · server: modules/payments/payments.controller.ts → PaymentsService.getOrderStatus()
 */
export function getOrderStatus(orderCode: number) {
  return apiFetch<PaymentOrder>(`/payments/orders/${orderCode}`);
}
