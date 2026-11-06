"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";

/** Học liệu tải về: API chỉ cấp liên kết có hạn, tệp do máy chủ tệp phục vụ — xem `hanni-server/CLAUDE.md`. */

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  kind: "video" | "pdf" | "audio";
  bytes: number;
  sha256: string | null;
  requiresLogin: boolean;
}

export interface ResourceLink {
  url: string;
  expiresAt: string;
}

/** API → GET /resources · server: modules/resources/resources.controller.ts → ResourcesService.list() */
export function useResources() {
  return useSWR<LearningResource[]>("/resources", (p: string) => apiFetch<LearningResource[]>(p), {
    revalidateOnFocus: false,
  });
}

/** API → POST /resources/:id/link · server: modules/resources/resources.controller.ts → ResourcesService.link() */
export function createResourceLink(id: string) {
  return api.post<ResourceLink>(`/resources/${id}/link`);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
