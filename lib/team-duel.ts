"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { apiFetch } from "./api";
import { useAuth } from "./auth";
import { getNotificationsSocket } from "./socket";
import type {
  TeamDuelActiveMatch,
  TeamDuelFinished,
  TeamDuelMatched,
  TeamDuelRoundPayload,
  TeamDuelRoundResult,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

/** Poll nhẹ trong lúc đang xếp hàng chờ ghép đội, y hệt `useDuelQueueSize()`
 * của đấu 1v1 (`lib/duel.ts`). */
export function useTeamDuelQueueSize(active: boolean) {
  return useSWR<{ size: number }>(
    active ? "/teamduel/queue-size" : null,
    fetcher,
    { refreshInterval: active ? 3000 : 0 },
  );
}

export function getActiveTeamDuelMatch() {
  return apiFetch<TeamDuelActiveMatch | null>("/teamduel/active");
}

export function joinTeamDuelQueue() {
  getNotificationsSocket(true)?.emit("teamduel:join-queue");
}

export function leaveTeamDuelQueue() {
  getNotificationsSocket(true)?.emit("teamduel:leave-queue");
}

export function submitTeamDuelAnswer(matchId: string, chosenIndex: number) {
  getNotificationsSocket(true)?.emit("teamduel:answer", {
    matchId,
    chosenIndex,
  });
}

interface TeamDuelHandlers {
  onMatched?: (payload: TeamDuelMatched) => void;
  onRound?: (payload: TeamDuelRoundPayload) => void;
  onRoundResult?: (payload: TeamDuelRoundResult) => void;
  onFinished?: (payload: TeamDuelFinished) => void;
}

/** Y hệt `useDuelSocket()` của đấu 1v1 — ref cho handlers để component gọi
 * không cần tự `useCallback`. */
export function useTeamDuelSocket(handlers: TeamDuelHandlers) {
  const { user } = useAuth();
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const s = getNotificationsSocket(Boolean(user));
    if (!s) return;

    const onMatched = (p: TeamDuelMatched) => handlersRef.current.onMatched?.(p);
    const onRound = (p: TeamDuelRoundPayload) => handlersRef.current.onRound?.(p);
    const onRoundResult = (p: TeamDuelRoundResult) =>
      handlersRef.current.onRoundResult?.(p);
    const onFinished = (p: TeamDuelFinished) =>
      handlersRef.current.onFinished?.(p);

    s.on("teamduel:matched", onMatched);
    s.on("teamduel:round", onRound);
    s.on("teamduel:round-result", onRoundResult);
    s.on("teamduel:finished", onFinished);
    return () => {
      s.off("teamduel:matched", onMatched);
      s.off("teamduel:round", onRound);
      s.off("teamduel:round-result", onRoundResult);
      s.off("teamduel:finished", onFinished);
    };
  }, [user]);
}
