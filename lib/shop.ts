"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { AvatarFrame, ShopCatalog } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useFrameShop() {
  return useSWR<ShopCatalog>("/shop/frames", fetcher);
}

export function buyFrame(key: string) {
  return api.post<AvatarFrame>(`/shop/frames/${key}/buy`);
}

/** `key: null` = gỡ khung đang dùng. */
export function equipFrame(key: string | null) {
  return api.post<void>("/shop/frames/equip", { frameKey: key });
}
