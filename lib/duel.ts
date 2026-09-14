"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { apiFetch } from "./api";
import { useAuth } from "./auth";
import { getNotificationsSocket } from "./socket";
import type {
  DuelFinished,
  DuelLeaderboardRow,
  DuelMatched,
  DuelRatingStats,
  DuelRoundPayload,
  DuelRoundResult,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useDuelRating() {
  return useSWR<DuelRatingStats>("/duel/rating/me", fetcher);
}

export function useDuelLeaderboard() {
  return useSWR<DuelLeaderboardRow[]>("/duel/leaderboard", fetcher);
}

export function joinDuelQueue() {
  getNotificationsSocket(true)?.emit("duel:join-queue");
}

export function leaveDuelQueue() {
  getNotificationsSocket(true)?.emit("duel:leave-queue");
}

export function submitDuelAnswer(matchId: string, chosenIndex: number) {
  getNotificationsSocket(true)?.emit("duel:answer", { matchId, chosenIndex });
}

interface DuelHandlers {
  onMatched?: (payload: DuelMatched) => void;
  onRound?: (payload: DuelRoundPayload) => void;
  onRoundResult?: (payload: DuelRoundResult) => void;
  onFinished?: (payload: DuelFinished) => void;
}

/** Lắng nghe toàn bộ vòng đời 1 trận đấu 1v1. Dùng ref cho handlers để
 * component gọi không cần tự `useCallback` — effect chỉ đăng ký socket 1
 * lần theo `user`, còn logic xử lý luôn lấy bản MỚI NHẤT của handlers. */
export function useDuelSocket(handlers: DuelHandlers) {
  const { user } = useAuth();
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const s = getNotificationsSocket(Boolean(user));
    if (!s) return;

    const onMatched = (p: DuelMatched) => handlersRef.current.onMatched?.(p);
    const onRound = (p: DuelRoundPayload) => handlersRef.current.onRound?.(p);
    const onRoundResult = (p: DuelRoundResult) =>
      handlersRef.current.onRoundResult?.(p);
    const onFinished = (p: DuelFinished) =>
      handlersRef.current.onFinished?.(p);

    s.on("duel:matched", onMatched);
    s.on("duel:round", onRound);
    s.on("duel:round-result", onRoundResult);
    s.on("duel:finished", onFinished);
    return () => {
      s.off("duel:matched", onMatched);
      s.off("duel:round", onRound);
      s.off("duel:round-result", onRoundResult);
      s.off("duel:finished", onFinished);
    };
  }, [user]);
}
