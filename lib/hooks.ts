"use client";

import useSWR from "swr";
import { api, apiFetch, API_BASE } from "./api";
import type {
  Achievement,
  AssistantAction,
  AssistantMessage,
  AssistantSession,
  ExamHistory,
  Leaderboard,
  LeaderboardMetric,
  LeaderboardMetricKey,
  GrammarDetail,
  GrammarLevel,
  GrammarListItem,
  HskLevel,
  LearnPath,
  LessonDetail,
  OnboardingProfile,
  Paginated,
  PracticeSkill,
  PracticeStats,
  ProgressOverview,
  StreakInfo,
  StudyStats,
  SubmitOnboardingInput,
  VideoCard,
  VideoComment,
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
    { keepPreviousData: true },
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
  return useSWR<VideoCard[]>(`/videos${q ? `?${q}` : ""}`, fetcher, {
    keepPreviousData: true,
  });
}

export function useVideo(id: string | null) {
  return useSWR<VideoDetail>(id ? `/videos/${id}` : null, fetcher);
}

export function useComments(videoId: string | null, page = 1) {
  return useSWR<Paginated<VideoComment>>(
    videoId ? `/videos/${videoId}/comments?page=${page}&pageSize=20` : null,
    fetcher,
  );
}

export function postComment(
  videoId: string,
  content: string,
  parentId?: string,
) {
  return api.post<VideoComment>(`/videos/${videoId}/comments`, {
    content,
    parentId,
  });
}

export function deleteComment(videoId: string, commentId: string) {
  return api.del(`/videos/${videoId}/comments/${commentId}`);
}

export function likeVideo(videoId: string) {
  return api.post<{ liked: boolean; likeCount: number }>(
    `/videos/${videoId}/like`,
  );
}

export function unlikeVideo(videoId: string) {
  return api.del<{ liked: boolean; likeCount: number }>(
    `/videos/${videoId}/like`,
  );
}

export function followUser(userId: string) {
  return api.post<{ following: boolean; followerCount: number }>(
    `/users/${userId}/follow`,
  );
}

export function unfollowUser(userId: string) {
  return api.del<{ following: boolean; followerCount: number }>(
    `/users/${userId}/follow`,
  );
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

export function useLeaderboardMetrics() {
  return useSWR<LeaderboardMetric[]>("/leaderboard/metrics", fetcher);
}

export function useLeaderboard(
  metric: LeaderboardMetricKey,
  scope: "global" | "friends" = "global",
) {
  return useSWR<Leaderboard>(
    `/leaderboard?metric=${metric}&scope=${scope}`,
    fetcher,
  );
}

export function usePracticeStats(skill: PracticeSkill) {
  return useSWR<PracticeStats>(`/practice/stats?skill=${skill}`, fetcher);
}

/** Ghi 1 lượt luyện nghe/phát âm lên server — không chặn UI nếu lỗi mạng. */
export function recordPracticeAttempt(
  wordId: string,
  skill: PracticeSkill,
  isCorrect?: boolean,
) {
  return api
    .post("/practice/attempts", { wordId, skill, isCorrect })
    .catch(() => undefined);
}

/** null = chưa làm khảo sát bao giờ. `enabled=false` khi chưa đăng nhập (tránh gọi API cần auth). */
export function useOnboarding(enabled = true) {
  return useSWR<OnboardingProfile | null>(enabled ? "/onboarding" : null, fetcher);
}

export function submitOnboarding(input: SubmitOnboardingInput) {
  return api.post<OnboardingProfile>("/onboarding", input);
}

/** Chỉ tải khi widget đang mở — tránh gọi API này trên mọi trang cho mọi user. */
export function useAssistantSessions(enabled: boolean) {
  return useSWR<AssistantSession[]>(
    enabled ? "/assistant/sessions" : null,
    fetcher,
  );
}

export function useAssistantMessages(sessionId: string | null) {
  return useSWR<AssistantMessage[]>(
    sessionId ? `/assistant/sessions/${sessionId}/messages` : null,
    fetcher,
  );
}

export function createAssistantSession() {
  return api.post<AssistantSession>("/assistant/sessions");
}

/**
 * Streaming qua SSE (`EventSource`) — trả từng đoạn chữ ngay khi có thay vì
 * đợi cả câu trả lời xong. Trả về hàm để đóng kết nối sớm (vd widget đóng
 * giữa chừng). `EventSource` không tự refresh token 401 như `apiFetch` —
 * chấp nhận được vì access token sống đủ lâu (mặc định 15 phút) so với 1
 * lượt hỏi, không đáng để xử lý riêng.
 */
export function streamAssistant(
  message: string,
  sessionId: string | undefined,
  handlers: {
    onDelta: (delta: string) => void;
    onDone: (sessionId: string, action?: AssistantAction) => void;
    onError: () => void;
  },
): () => void {
  const params = new URLSearchParams({ message });
  if (sessionId) params.set("sessionId", sessionId);
  const es = new EventSource(`${API_BASE}/assistant/ask/stream?${params}`, {
    withCredentials: true,
  });
  es.onmessage = (event) => {
    let payload: {
      delta?: string;
      done?: boolean;
      sessionId?: string;
      action?: AssistantAction;
    };
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (payload.delta) handlers.onDelta(payload.delta);
    if (payload.done) {
      handlers.onDone(payload.sessionId ?? sessionId ?? "", payload.action);
      es.close();
    }
  };
  es.onerror = () => {
    handlers.onError();
    es.close();
  };
  return () => es.close();
}

export function deleteAssistantSession(sessionId: string) {
  return api.del<{ ok: true }>(`/assistant/sessions/${sessionId}`);
}
