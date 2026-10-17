"use client";

import useSWR from "swr";
import { apiFetch } from "./api";
import type { PremiumStatus } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** `enabled=false` khi chưa đăng nhập (route cần auth). */
export function usePremiumStatus(enabled = true) {
  return useSWR<PremiumStatus>(enabled ? "/premium/status" : null, fetcher);
}
