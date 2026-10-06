import { api } from "./api";

/**
 * Kết quả bài học KHÁCH làm trước khi có tài khoản (kiểu Duolingo: học bài 1
 * trước, đăng ký sau để lưu). Giữ ở `sessionStorage` giống
 * `pending-words.ts`; đăng ký/đăng nhập xong thì nạp lên server — không thì
 * lời mời "lưu tiến độ" ở màn hoàn thành bài là hứa suông.
 */
const KEY = "hanni:pending-lessons";

export interface PendingLesson {
  lessonId: string;
  hskLevel: number;
  results: { wordId: string; mistakes: number }[];
  durationMs: number;
}

function read(): PendingLesson[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as PendingLesson[]) : [];
  } catch {
    return [];
  }
}

export function savePendingLesson(lesson: PendingLesson) {
  try {
    const rest = read().filter((l) => l.lessonId !== lesson.lessonId);
    sessionStorage.setItem(KEY, JSON.stringify([...rest, lesson]));
  } catch {
    /* trình duyệt chặn sessionStorage — mất phần lưu, không chặn việc học */
  }
}

export function hasPendingLessons(): boolean {
  return read().length > 0;
}

/** Cấp mà bài kiểm tra trình độ đề xuất cho KHÁCH — không lưu thì người vừa
 * làm bài ra "HSK3" rồi bấm đăng ký luôn sẽ vào lộ trình HSK1 mặc định. */
const LEVEL_KEY = "hanni:pending-course-level";

export function savePendingCourseLevel(level: number) {
  try {
    sessionStorage.setItem(LEVEL_KEY, String(level));
  } catch {
    /* bỏ qua — chỉ mất phần ghi nhớ cấp */
  }
}

/** Đặt cấp lộ trình theo kết quả kiểm tra (nếu có) rồi XOÁ. */
export async function drainPendingCourseLevel(): Promise<boolean> {
  let level = 0;
  try {
    level = Number(sessionStorage.getItem(LEVEL_KEY));
    sessionStorage.removeItem(LEVEL_KEY);
  } catch {
    return false;
  }
  if (!level) return false;
  return api.patch("/users/me/settings", { courseLevel: level }).then(
    () => true,
    () => false,
  );
}

/** Nạp mọi bài đã học lúc chưa đăng nhập rồi XOÁ (chỉ nạp đúng 1 lần). Cấp
 * của bài đầu tiên thành cấp lộ trình — người vừa học thử HSK1 thì vào app
 * là thấy đúng lộ trình HSK1, không phải tự chọn lại. Trả về số bài đã lưu. */
export async function drainPendingLessons(): Promise<number> {
  const lessons = read();
  if (lessons.length === 0) return 0;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
  let saved = 0;
  for (const l of lessons) {
    try {
      await api.post(`/learn/lessons/${l.lessonId}/complete`, {
        results: l.results,
        durationMs: l.durationMs,
      });
      saved += 1;
    } catch {
      /* 1 bài lỗi không được chặn các bài còn lại */
    }
  }
  if (saved > 0) {
    await api
      .patch("/users/me/settings", { courseLevel: lessons[0].hskLevel })
      .catch(() => undefined);
  }
  return saved;
}
