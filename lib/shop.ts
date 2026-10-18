"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { TitleShopCatalog } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Danh hiệu mở theo huy hiệu đã đạt (không mua bằng xu). */
export function useTitleShop() {
  return useSWR<TitleShopCatalog>("/shop/titles", fetcher);
}

/** `key: null` = gỡ danh hiệu đang dùng. */
export function equipTitle(key: string | null) {
  return api.post<void>("/shop/titles/equip", { titleKey: key });
}
