"use client";

import { useEffect } from "react";
import useSWR, { mutate, preload } from "swr";
import { api, apiFetch, API_BASE } from "./api";
import { useAuth } from "./auth";
import type {
  Achievement,
  AssistantAction,
  AssistantMessage,
  AssistantSession,
  DayActivity,
  CurrentLesson,
  Leaderboard,
  LeaderboardMetric,
  LeaderboardMetricKey,
  HskLevel,
  LearnPath,
  LeechWord,
  SuspendedWord,
  LessonDetail,
  OnboardingPlan,
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
  VideoCard,
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

/** Các hook dưới đây dùng ở trang/khung KHÁCH cũng xem được (2026-10-18) —
 * khách không gọi API cần đăng nhập (mỗi lần gọi là 1 lượt 401 + làm mới
 * token + SWR tự thử lại). */
export function useStreak() {
  const { user } = useAuth();
  return useSWR<StreakInfo>(user ? "/streak" : null, fetcher);
}

/** "Từ khó nhớ" (leech) — từ đã sai đủ nhiều lần trong SRS (xem
 * hanni-server/CLAUDE.md mục Leech). */
export function useLeeches() {
  return useSWR<LeechWord[]>("/study/leeches", fetcher);
}

/** Từ đang ẩn khỏi hàng đợi ôn — xem/bỏ ẩn ở `/progress`. */
export function useSuspendedWords() {
  return useSWR<SuspendedWord[]>("/study/suspended", fetcher);
}

/** "Tôi biết từ này rồi" / bỏ ẩn. Xem lý do ở `ReviewService.setSuspended`. */
export function suspendWord(wordId: string, suspended: boolean) {
  return api.post<{ wordId: string; suspended: boolean }>(
    `/study/words/${wordId}/suspend`,
    { suspended },
  );
}

export function useStreakHistory(days = 30) {
  return useSWR<DayActivity[]>(`/streak/history?days=${days}`, fetcher);
}

export function useStudyStats() {
  const { user } = useAuth();
  return useSWR<StudyStats>(user ? "/study/stats" : null, fetcher, {
    refreshInterval: 60_000,
  });
}

export function useAchievements() {
  return useSWR<Achievement[]>("/achievements", fetcher);
}

export function useRecentQuizzes() {
  return useSWR<QuizAttemptSummary[]>("/quiz/recent", fetcher);
}

/** Tải trước lộ trình + danh sách cấp của trang chủ học — gọi lúc mã trang vừa nạp, khi khung app còn đang hỏi
 * `/auth/session` (khung chỉ hiện trang sau bước đó). Cùng khoá + fetcher với `useLearnPath()`/`useLevels()` nên
 * hook dùng lại đúng request này thay vì hỏi lại. */
export function preloadLearnHome() {
  void preload("/learn/path", fetcher);
  void preload("/levels", fetcher);
}

export function useLearnPath(level?: number) {
  return useSWR<LearnPath>(
    level ? `/learn/path?level=${level}` : "/learn/path",
    fetcher,
    { keepPreviousData: true },
  );
}

/** Bài đang học dở — khách không có (trả `undefined`). */
export function useCurrentLesson(enabled = true) {
  const { user } = useAuth();
  return useSWR<CurrentLesson | null>(
    enabled && user ? "/learn/current" : null,
    fetcher,
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

export function useVideos(params: { level?: number; kind?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.level) qs.set("level", String(params.level));
  if (params.kind) qs.set("kind", params.kind);
  const q = qs.toString();
  return useSWR<VideoCard[]>(`/videos${q ? `?${q}` : ""}`, fetcher, {
    keepPreviousData: true,
  });
}

export function useVideo(id: string | null) {
  return useSWR<VideoDetail>(id ? `/videos/${id}` : null, fetcher);
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

/** Giải đấu học tập theo tuần, xem hanni-server/CLAUDE.md. */
export function useWeeklyLeague() {
  return useSWR<WeeklyLeague>("/leaderboard/league", fetcher);
}

/** Nhiệm vụ hàng ngày — xong cả 3 thì server tự cấp 1 lá chắn giữ chuỗi (`QuestsService.getToday()`);
 * `justEarnedFreeze` chỉ true ở ĐÚNG lần gọi cấp lá chắn → làm mới `/streak` để số lá chắn ở thanh trên theo kịp. */
export function useTodayQuests() {
  const result = useSWR<TodayQuests>("/quests/today", fetcher);
  const justEarnedFreeze = result.data?.justEarnedFreeze ?? false;
  useEffect(() => {
    if (justEarnedFreeze) void mutate("/streak");
  }, [justEarnedFreeze]);
  return result;
}

export function usePracticeStats(skill: PracticeSkill) {
  const { user } = useAuth();
  return useSWR<PracticeStats>(
    user ? `/practice/stats?skill=${skill}` : null,
    fetcher,
  );
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

/** Tính lộ trình đề xuất mà KHÔNG lưu, KHÔNG cần tài khoản — để người làm
 * khảo sát ẩn danh xem kết quả NGAY rồi mới quyết định có đăng ký hay không.
 * Xem `OnboardingService.preview` ở server cho lý do đầy đủ. */
export function previewOnboarding(input: SubmitOnboardingInput) {
  return api.post<{
    recommendedLevel: number;
    recommendationVi: string;
    plan?: OnboardingPlan;
  }>(
    "/onboarding/preview",
    input,
  );
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
