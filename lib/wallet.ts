"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { CoinTransaction, WalletBalance } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useWallet() {
  return useSWR<WalletBalance>("/wallet/me", fetcher);
}

export function useWalletTransactions() {
  return useSWR<CoinTransaction[]>("/wallet/transactions", fetcher);
}

export function buyStreakFreeze() {
  return api.post<{ balance: number; price: number }>(
    "/wallet/buy/streak-freeze",
  );
}
