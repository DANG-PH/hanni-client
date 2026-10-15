"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import type { PinyinOverview } from "@/lib/types";

/** Dữ liệu dựng sẵn ở server (HTML cho Google); build trúng lúc API lỗi thì
 * tự tải lại phía client thay vì để bảng trống. */
export function usePinyinOverview(initial: PinyinOverview | null) {
  const { data } = useSWR<PinyinOverview>(
    "/pinyin/overview",
    (p: string) => apiFetch<PinyinOverview>(p),
    {
      fallbackData: initial ?? undefined,
      revalidateOnFocus: false,
      revalidateIfStale: !initial,
      revalidateOnMount: !initial,
    },
  );
  return data ?? null;
}
