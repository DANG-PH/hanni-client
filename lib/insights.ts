"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type { CoachResult, InsightsPeriod, InsightsReport } from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/**
 * Báo cáo 1 kỳ — giữ số kỳ cũ trong lúc tải kỳ mới (không nháy trống).
 * API → GET /insights/report · server: modules/insights/insights.controller.ts → InsightsService.report()
 */
export function useInsightsReport(period: InsightsPeriod, offset: 0 | 1) {
  return useSWR<InsightsReport>(
    `/insights/report?period=${period}&offset=${offset}`,
    fetcher,
    { keepPreviousData: true },
  );
}

/** Nhận xét của Hanni Coach (Premium). Server cache theo số liệu nên gọi lại
 * khi chưa học thêm không tốn lượt AI; `enabled=false` thì không gọi.
 * API → POST /insights/report/coach · server: modules/insights/insights.controller.ts → InsightsService.coach()
 */
export function useCoach(period: InsightsPeriod, offset: 0 | 1, enabled: boolean) {
  return useSWR<CoachResult>(
    enabled ? ["coach", period, offset] : null,
    () => api.post<CoachResult>("/insights/report/coach", { period, offset }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
}
