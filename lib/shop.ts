"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { ShopCatalog, TitleShopCatalog } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Khung avatar — chỉ còn khung Phượng Hoàng của Premium. */
export function useFrameShop(enabled = true) {
  return useSWR<ShopCatalog>(enabled ? "/shop/frames" : null, fetcher);
}

/** `key: null` = gỡ khung đang dùng. */
export function equipFrame(key: string | null) {
  return api.post<void>("/shop/frames/equip", { frameKey: key });
}

/** Danh hiệu mở theo huy hiệu đã đạt (không mua bằng xu). */
export function useTitleShop() {
  return useSWR<TitleShopCatalog>("/shop/titles", fetcher);
}

/** `key: null` = gỡ danh hiệu đang dùng. */
export function equipTitle(key: string | null) {
  return api.post<void>("/shop/titles/equip", { titleKey: key });
}
