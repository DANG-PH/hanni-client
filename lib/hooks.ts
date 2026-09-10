"use client";

import useSWR from "swr";
import { apiFetch } from "./api";
import type {
  Achievement,
  ExamHistory,
  Leaderboard,
  GrammarDetail,
  GrammarLevel,
  GrammarListItem,
  HskLevel,
  LearnPath,
  LessonDetail,
  Paginated,
  ProgressOverview,
  StreakInfo,
  StudyStats,
  VideoCard,
  VideoDetail,
  Word,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useLevels() {
  return useSWR<HskLevel[]>("/levels", fetcher);
}

export function useProgress() {
  return useSWR<ProgressOverview>("/progress/overview", fetcher);
}

export function useStreak() {
  return useSWR<StreakInfo>("/streak", fetcher);
}

export function useStudyStats() {
  return useSWR<StudyStats>("/study/stats", fetcher, {
    refreshInterval: 60_000,
  });
}

export function useAchievements() {
  return useSWR<Achievement[]>("/achievements", fetcher);
}

export function useLearnPath(level?: number) {
  return useSWR<LearnPath>(
    level ? `/learn/path?level=${level}` : "/learn/path",
    fetcher,
  );
}

export function useLesson(id: string | null) {
  return useSWR<LessonDetail>(id ? `/learn/lessons/${id}` : null, fetcher);
}

export function useWords(params: {
  level?: number;
  q?: string;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params.level) qs.set("level", String(params.level));
  if (params.q) qs.set("q", params.q);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", "24");
  return useSWR<Paginated<Word>>(`/words?${qs.toString()}`, fetcher);
}

export function useVideos(params: { level?: number; kind?: string; mine?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (params.level) qs.set("level", String(params.level));
  if (params.kind) qs.set("kind", params.kind);
  if (params.mine) qs.set("mine", "true");
  const q = qs.toString();
  return useSWR<VideoCard[]>(`/videos${q ? `?${q}` : ""}`, fetcher);
}

export function useVideo(id: string | null) {
  return useSWR<VideoDetail>(id ? `/videos/${id}` : null, fetcher);
}

export function useGrammarLevels() {
  return useSWR<GrammarLevel[]>("/grammar/levels", fetcher);
}

export function useGrammar(level?: number) {
  return useSWR<GrammarListItem[]>(
    `/grammar${level ? `?level=${level}` : ""}`,
    fetcher,
  );
}

export function useGrammarPoint(slug: string | null) {
  return useSWR<GrammarDetail>(slug ? `/grammar/${slug}` : null, fetcher);
}

export function useExamHistory() {
  return useSWR<ExamHistory>("/exams/attempts", fetcher);
}

export function useLeaderboard() {
  return useSWR<Leaderboard>("/leaderboard", fetcher);
}
