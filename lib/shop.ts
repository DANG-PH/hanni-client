"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { TitleShopCatalog } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/**
 * Danh hiệu mở theo huy hiệu đã đạt (không mua bằng xu).
 * API → GET /shop/titles · server: modules/shop/shop.controller.ts → TitleService.getCatalog()
 */
export function useTitleShop() {
  return useSWR<TitleShopCatalog>("/shop/titles", fetcher);
}

/**
 * `key: null` = gỡ danh hiệu đang dùng.
 * API → POST /shop/titles/equip · server: modules/shop/shop.controller.ts → TitleService.equip()
 */
export function equipTitle(key: string | null) {
  return api.post<void>("/shop/titles/equip", { titleKey: key });
}
