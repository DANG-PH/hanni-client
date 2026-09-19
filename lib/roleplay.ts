"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type {
  RoleplayMessage,
  RoleplayScenario,
  RoleplaySessionSummary,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useRoleplayScenarios() {
  return useSWR<RoleplayScenario[]>("/roleplay/scenarios", fetcher);
}

export function useRoleplaySessions() {
  return useSWR<RoleplaySessionSummary[]>("/roleplay/sessions", fetcher);
}

export function useRoleplayMessages(sessionId: string | null) {
  return useSWR<RoleplayMessage[]>(
    sessionId ? `/roleplay/sessions/${sessionId}/messages` : null,
    fetcher,
  );
}

export function startRoleplaySession(scenarioKey: string) {
  return api.post<{ sessionId: string; message: RoleplayMessage }>(
    "/roleplay/sessions",
    { scenarioKey },
  );
}

export function replyRoleplay(sessionId: string, message: string) {
  return api.post<RoleplayMessage>(
    `/roleplay/sessions/${sessionId}/reply`,
    { message },
  );
}

export function hintRoleplay(sessionId: string) {
  return api.post<{ suggestionZh: string; meaningVi: string }>(
    `/roleplay/sessions/${sessionId}/hint`,
  );
}

export function deleteRoleplaySession(sessionId: string) {
  return api.del<{ ok: true }>(`/roleplay/sessions/${sessionId}`);
}
