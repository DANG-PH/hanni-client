"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { AvatarFrame, ShopCatalog, Title, TitleShopCatalog } from "./types";

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

export function useTitleShop() {
  return useSWR<TitleShopCatalog>("/shop/titles", fetcher);
}

export function buyTitle(key: string) {
  return api.post<Title>(`/shop/titles/${key}/buy`);
}

/** `key: null` = gỡ danh hiệu đang dùng. */
export function equipTitle(key: string | null) {
  return api.post<void>("/shop/titles/equip", { titleKey: key });
}
