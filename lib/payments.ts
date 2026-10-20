"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { CheckoutResponse, PaymentOrder } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Ẩn nút thanh toán nếu server chưa cấu hình payOS (PAYOS_CLIENT_ID/
 * PAYOS_API_KEY/PAYOS_CHECKSUM_KEY để trống) — tránh hiện nút bấm vào báo lỗi. */
export function usePaymentsConfigured() {
  return useSWR<{ configured: boolean }>("/payments/configured", fetcher);
}

/** Tạo đơn Premium + link thanh toán payOS — xem `hanni-server/CLAUDE.md` mục Premium. */
export function createPremiumCheckout(planKey: string) {
  return api.post<CheckoutResponse>("/payments/premium-checkout", { planKey });
}

/** Trạng thái 1 đơn — đọc khi payOS đưa người dùng quay về `/account?premium=<mã đơn>`. */
export function getOrderStatus(orderCode: number) {
  return apiFetch<PaymentOrder>(`/payments/orders/${orderCode}`);
}
