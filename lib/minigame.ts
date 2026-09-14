"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type {
  MinigameLeaderboardRow,
  MinigameResult,
  MinigameStartResponse,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function startMinigame() {
  return api.post<MinigameStartResponse>("/minigame/start");
}

export function finishMinigame(
  sessionId: string,
  answers: { wordId: string; chosenIndex: number }[],
  durationMs: number,
) {
  return api.post<MinigameResult>(`/minigame/${sessionId}/finish`, {
    answers,
    durationMs,
  });
}

export function useMinigameLeaderboard(period: "daily" | "weekly" = "daily") {
  return useSWR<MinigameLeaderboardRow[]>(
    `/minigame/leaderboard?period=${period}`,
    fetcher,
  );
}
