"use client";

import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { api, apiFetch, API_BASE } from "./api";
import type {
  Achievement,
  AssistantAction,
  AssistantMessage,
  AssistantSession,
  DayActivity,
  ExamHistory,
  Leaderboard,
  LeaderboardMetric,
  LeaderboardMetricKey,
  GrammarDetail,
  GrammarLevel,
  GrammarListItem,
  HskLevel,
  LearnPath,
  LeechWord,
  LessonDetail,
  OnboardingProfile,
  Paginated,
  PracticeSkill,
  PracticeStats,
  ProgressOverview,
  PublicProfile,
  QuizAttemptSummary,
  StreakInfo,
  ReferralStats,
  StudyStats,
  SubmitOnboardingInput,
  TodayQuests,
  UserSearchResult,
  VideoCard,
  VideoComment,
  VideoDetail,
  WeeklyLeague,
  Word,
} from "./types";

const fetcher = <T>(path: string) => apiFetch<T>(path);

export function useLevels() {
  return useSWR<HskLevel[]>("/levels", fetcher);
}

/** Thống kê công khai (không cần đăng nhập) — số từ có âm Hán Việt, dùng
 * cho phần giới thiệu ở trang chủ. */
export function useWordStats() {
  return useSWR<{ total: number; withHanViet: number }>(
    "/words/stats",
    fetcher,
  );
}

export function useProgress() {
  return useSWR<ProgressOverview>("/progress/overview", fetcher);
}

export function useStreak() {
  return useSWR<StreakInfo>("/streak", fetcher);
}

/** "Từ khó nhớ" (leech) — từ đã sai đủ nhiều lần trong SRS (xem
 * hanni-server/CLAUDE.md mục Leech). */
export function useLeeches() {
  return useSWR<LeechWord[]>("/study/leeches", fetcher);
}

export function useStreakHistory(days = 30) {
  return useSWR<DayActivity[]>(`/streak/history?days=${days}`, fetcher);
}

export function useStudyStats() {
  return useSWR<StudyStats>("/study/stats", fetcher, {
    refreshInterval: 60_000,
  });
}

export function useAchievements() {
  return useSWR<Achievement[]>("/achievements", fetcher);
}

export function useRecentQuizzes() {
  return useSWR<QuizAttemptSummary[]>("/quiz/recent", fetcher);
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
  lessonId?: string;
  q?: string;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params.level) qs.set("level", String(params.level));
  if (params.lessonId) qs.set("lessonId", params.lessonId);
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

export function usePublicProfile(userId: string | null) {
  return useSWR<PublicProfile>(
    userId ? `/users/${userId}/profile` : null,
    fetcher,
  );
}

export function useReferralStats() {
  return useSWR<ReferralStats>("/referrals/me", fetcher);
}

/** Tìm người dùng theo tên — để theo dõi/nhắn tin khi họ không lọt bảng xếp hạng. */
export function useUserSearch(q: string) {
  const query = q.trim();
  return useSWR<UserSearchResult[]>(
    query ? `/users/search?q=${encodeURIComponent(query)}` : null,
    fetcher,
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

/** Giải đấu học tập theo tuần — khác ELO đấu 1v1, xem hanni-server/CLAUDE.md. */
export function useWeeklyLeague() {
  return useSWR<WeeklyLeague>("/leaderboard/league", fetcher);
}

/** Nhiệm vụ hàng ngày — server tự cộng xu ngay khi phát hiện nhiệm vụ vừa
 * hoàn thành (xem `QuestsService.getToday()`), field `justClaimedXu` chỉ
 * khác 0 ở ĐÚNG lần gọi phát hiện ra điều đó — client dùng để hiện toast
 * rồi làm mới số dư ví (`/wallet/me`) vì 2 thẻ này không cùng 1 component. */
export function useTodayQuests() {
  const result = useSWR<TodayQuests>("/quests/today", fetcher);
  const justClaimedXu = result.data?.justClaimedXu ?? 0;
  useEffect(() => {
    if (justClaimedXu > 0) void mutate("/wallet/me");
  }, [justClaimedXu]);
  return result;
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

/** Lưu 1 từ vào hàng đợi SRS (vd. bấm vào từ trong bản chép video) — tạo
 * thẳng ở trạng thái sẵn sàng ôn, không cần chờ tới lượt "từ mới" theo cấp/
 * bài học. `added: false` nghĩa là từ đã có sẵn trong tiến độ học rồi. */
export function addWordToSrs(wordId: string) {
  return api.post<{ added: boolean }>("/study/add-word", { wordId });
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
