"use client";

import useSWR from "swr";
import { apiFetch } from "./api";
import type { PremiumStatus } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function usePremiumStatus() {
  return useSWR<PremiumStatus>("/premium/status", fetcher);
}
