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
  examples?: WordExample[];
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
  prompt: string;
  pinyin: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  attemptId: string;
  questions: QuizQuestion[];
}
