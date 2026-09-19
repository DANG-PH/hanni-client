"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { TopUpOrder, TopUpResponse } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Ẩn cả khối "Nạp xu" nếu server chưa cấu hình payOS (PAYOS_CLIENT_ID/
 * PAYOS_API_KEY/PAYOS_CHECKSUM_KEY để trống) — tránh hiện nút bấm vào báo lỗi. */
export function useTopUpConfigured() {
  return useSWR<{ configured: boolean }>("/payments/configured", fetcher);
}

export function createTopUp(amountVnd: number) {
  return api.post<TopUpResponse>("/payments/topup", { amountVnd });
}

export function getTopUpStatus(orderCode: number) {
  return apiFetch<TopUpOrder>(`/payments/topup/${orderCode}`);
}

/** Cùng luồng payOS/checkout với `createTopUp()`, khác `kind` đơn hàng —
 * xem `hanni-server/CLAUDE.md` mục Premium. */
export function createPremiumCheckout(planKey: string) {
  return api.post<TopUpResponse>("/payments/premium-checkout", { planKey });
}
