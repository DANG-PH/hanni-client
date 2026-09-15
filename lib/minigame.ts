"use client";

import useSWR from "swr";
import { api, apiFetch } from "./api";
import type {
  GameMode,
  MinigameLeaderboardRow,
  MinigameResult,
  MinigameStartResponse,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function startMinigame(mode: GameMode = "TRANSLATE") {
  return api.post<MinigameStartResponse>("/minigame/start", { mode });
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

/** MATCH ("Ghép cặp") — không có `answers` trắc nghiệm, chỉ báo số lần lật
 * sai + thời gian, xem `finishMatchGame()` ở server. */
export function finishMatchMinigame(
  sessionId: string,
  mistakes: number,
  durationMs: number,
) {
  return api.post<MinigameResult>(`/minigame/${sessionId}/finish`, {
    mistakes,
    durationMs,
  });
}

export function useMinigameLeaderboard(
  period: "daily" | "weekly" = "daily",
  mode: GameMode = "TRANSLATE",
) {
  return useSWR<MinigameLeaderboardRow[]>(
    `/minigame/leaderboard?period=${period}&mode=${mode}`,
    fetcher,
  );
}
