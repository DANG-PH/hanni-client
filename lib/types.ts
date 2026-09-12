export interface Me {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  role: string;
  emailVerifiedAt: string | null;
  hasPassword: boolean;
  settings?: UserSettings | null;
  streak?: { currentStreak: number; longestStreak: number } | null;
}

export interface UserSettings {
  dailyGoalType: "WORDS" | "MINUTES";
  dailyGoalValue: number;
  newCardsPerDay: number;
  maxReviewsPerDay: number | null;
  srsScheduler: "sm2" | "fsrs";
  targetRetention: number;
  reminderHour: number | null;
}

export interface HskLevel {
  level: number;
  band: "ELEMENTARY" | "INTERMEDIATE" | "ADVANCED";
  isSharedBand: boolean;
  nameVi: string;
  newWords2021: number;
  cumulative2021: number;
  newWords2025: number;
  cumulative2025: number;
  readingChars: number | null;
  writingChars: number | null;
  skills: string[];
  wordsInDb: number;
}

export interface Word {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyinNumeric: string;
  hskLevel: number;
  pos: string[];
  frequencyRank: number | null;
  meaningVi: string | null;
  meaningEn: string | null;
  translationStatus: string;
  audioUrl: string | null;
  lessonId?: string | null;
  lessonOrder?: number | null;
  examples?: WordExample[];
  progressState?: string;
}

export interface LessonNode {
  id: string;
  orderIndex: number;
  title: string;
  wordCount: number;
  learnedWords: number;
  startedWords: number;
  dueWords: number;
  status: "COMPLETED" | "IN_PROGRESS" | "AVAILABLE" | "LOCKED";
  previewWords: string[];
}

export interface LearnPath {
  level: number;
  levelName: string;
  band: string;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  lessons: LessonNode[];
  levels: number[];
}

export interface LessonDetail {
  lesson: {
    id: string;
    title: string;
    orderIndex: number;
    hskLevel: number;
    wordCount: number;
  };
  words: Word[];
}

export interface WordExample {
  id: string;
  zh: string;
  pinyin: string | null;
  vi: string | null;
  en: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QueueItem {
  progressId?: string;
  state: string;
  dueAt?: string;
  word: Word;
}

export interface StudyQueue {
  due: QueueItem[];
  newCards: QueueItem[];
  counts: {
    due: number;
    newRemaining: number;
    newDoneToday: number;
    reviewsDoneToday: number;
  };
}

export interface StudyStats {
  dueNow: number;
  learnedTotal: number;
  inProgress: number;
  reviewsDoneToday: number;
  newDoneToday: number;
  newRemaining: number;
}

export type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface ReviewResult {
  isCorrect: boolean;
  dueAt: string;
  intervalDays: number;
  state: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  lastActiveLocalDate: string | null;
  activeToday: boolean;
  goal: {
    type: "WORDS" | "MINUTES";
    value: number;
    progress: number;
    met: boolean;
  };
}

export interface LevelBucket {
  level: number;
  band: string;
  nameVi: string;
  totalWords: number;
  learned: number;
  learning: number;
  due: number;
  atRisk: number;
  notStarted: number;
  percentComplete: number;
}

export interface ProgressOverview {
  levels: LevelBucket[];
  totals: Omit<LevelBucket, "level" | "band" | "nameVi">;
}

export interface Achievement {
  id: string;
  code: string;
  nameVi: string;
  descriptionVi: string;
  category: string;
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface QuizQuestion {
  wordId: string;
  mode: "reading" | "listening";
  prompt: string;
  pinyin: string;
  audioUrl?: string | null;
  options: string[];
  answer: string;
}

export interface Quiz {
  attemptId: string;
  questions: QuizQuestion[];
}

export type VideoKind =
  | "PODCAST"
  | "STORY"
  | "SONG"
  | "DIALOGUE"
  | "CLIP"
  | "OTHER";

export interface VideoCard {
  id: string;
  youtubeId: string;
  title: string;
  titleZh: string | null;
  description: string | null;
  hskLevel: number | null;
  kind: VideoKind;
  sentenceCount: number;
  thumbnailUrl: string | null;
  author: string | null;
  isFree: boolean;
  isOwner: boolean;
  progressPct: number;
  completed: boolean;
  likeCount: number;
  likedByMe: boolean;
}

export interface VideoLine {
  id: string;
  index: number;
  startMs: number | null;
  zh: string;
  pinyin: string;
  pinyinNum: string;
  vi: string | null;
}

export interface VideoDetail {
  id: string;
  youtubeId: string;
  title: string;
  titleZh: string | null;
  description: string | null;
  hskLevel: number | null;
  kind: VideoKind;
  sentenceCount: number;
  author: string | null;
  isOwner: boolean;
  lines: VideoLine[];
  progress: { lastLineIndex: number; linesRead: number; completed: boolean };
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
}

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface VideoComment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: CommentAuthor;
  replies: VideoComment[];
}

export type NotificationType = "COMMENT_REPLY" | "VIDEO_COMMENT" | "VIDEO_LIKE";

export interface AppNotification {
  id: string;
  type: NotificationType;
  readAt: string | null;
  createdAt: string;
  actor: CommentAuthor | null;
  video: { id: string; title: string } | null;
  comment: { id: string; content: string } | null;
}

export interface NotificationsPage extends Paginated<AppNotification> {
  unreadCount: number;
}

export interface GrammarLevel {
  level: number;
  count: number;
}

export interface GrammarListItem {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
  flat?: boolean;
}

export interface GrammarExample {
  zh: string;
  pinyin: string;
  vi: string;
}

export interface GrammarDetail extends GrammarListItem {
  orderIndex: number;
  explanationVi: string;
  patterns: string[];
  examples: GrammarExample[];
}

export interface ExamAttempt {
  id: string;
  hskLevel: number;
  totalCount: number;
  correctCount: number;
  durationSec: number | null;
  createdAt: string;
}

export interface ExamHistory {
  attempts: ExamAttempt[];
  summary: {
    count: number;
    avgAccuracy: number | null;
    best: { hskLevel: number; correctCount: number; totalCount: number } | null;
  };
}

export type LeaderboardMetricKey = "learned" | "streak" | "longest" | "lessons";

export interface LeaderboardMetric {
  key: LeaderboardMetricKey;
  label: string;
  unit: string;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  value: number;
  currentStreak: number;
  isMe: boolean;
}

export interface Leaderboard {
  metric: LeaderboardMetricKey;
  label: string;
  unit: string;
  rows: LeaderboardRow[];
  me: { rank: number | null; value: number; totalRanked: number };
}
