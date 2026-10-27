"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type {
  RoleplayMessage,
  RoleplayScenario,
  RoleplaySessionSummary,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/**
 * API → GET /roleplay/scenarios · server: modules/roleplay/roleplay.controller.ts → RoleplayService.listScenarios()
 */
export function useRoleplayScenarios() {
  return useSWR<RoleplayScenario[]>("/roleplay/scenarios", fetcher);
}

/**
 * API → GET /roleplay/sessions · server: modules/roleplay/roleplay.controller.ts → RoleplayService.listSessions()
 */
export function useRoleplaySessions() {
  return useSWR<RoleplaySessionSummary[]>("/roleplay/sessions", fetcher);
}

/**
 * API → GET /roleplay/sessions/:sessionId/messages · server: modules/roleplay/roleplay.controller.ts → RoleplayService.getMessages()
 */
export function useRoleplayMessages(sessionId: string | null) {
  return useSWR<RoleplayMessage[]>(
    sessionId ? `/roleplay/sessions/${sessionId}/messages` : null,
    fetcher,
  );
}

/**
 * API → POST /roleplay/sessions · server: modules/roleplay/roleplay.controller.ts → RoleplayService.startSession()
 */
export function startRoleplaySession(scenarioKey: string) {
  return api.post<{ sessionId: string; message: RoleplayMessage }>(
    "/roleplay/sessions",
    { scenarioKey },
  );
}

/**
 * API → POST /roleplay/sessions/:sessionId/reply · server: modules/roleplay/roleplay.controller.ts → RoleplayService.reply()
 */
export function replyRoleplay(sessionId: string, message: string) {
  return api.post<RoleplayMessage>(
    `/roleplay/sessions/${sessionId}/reply`,
    { message },
  );
}

/**
 * API → POST /roleplay/sessions/:sessionId/hint · server: modules/roleplay/roleplay.controller.ts → RoleplayService.hint()
 */
export function hintRoleplay(sessionId: string) {
  return api.post<{ suggestionZh: string; meaningVi: string }>(
    `/roleplay/sessions/${sessionId}/hint`,
  );
}

/** Nhận xét ngắn sau khi kết thúc buổi luyện — xem `RoleplayService.feedback`
 * ở server. Không lưu DB, chỉ trả về một lần.
 * API → POST /roleplay/sessions/:sessionId/feedback · server: modules/roleplay/roleplay.controller.ts → RoleplayService.feedback()
 */
export function feedbackRoleplay(sessionId: string) {
  return api.post<{ userTurns: number; feedbackVi: string }>(
    `/roleplay/sessions/${sessionId}/feedback`,
    {},
  );
}

/**
 * API → DELETE /roleplay/sessions/:sessionId · server: modules/roleplay/roleplay.controller.ts → RoleplayService.deleteSession()
 */
export function deleteRoleplaySession(sessionId: string) {
  return api.del<{ ok: true }>(`/roleplay/sessions/${sessionId}`);
}
