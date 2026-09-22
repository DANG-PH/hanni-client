/**
 * Giữ tạm danh sách từ người dùng học ở bộ thẻ "học thử" (`/hoc-thu`) để
 * sau khi đăng ký thì đưa thẳng vào hàng đợi ôn.
 *
 * Lý do có: màn kết học thử có nút "Lưu N từ này vào tài khoản" — nhưng
 * trước 2026-09-22 đăng ký xong CHẲNG có gì được lưu cả, N từ vừa học biến
 * mất. Đó là lời hứa bị gãy ngay tại khoảnh khắc quan trọng nhất của cả
 * phễu: đúng lúc người lạ quyết định tạo tài khoản.
 *
 * Dùng `sessionStorage` y như `hanni:pending-onboarding` (khảo sát làm
 * trước khi có tài khoản) — cùng một bài toán, giữ cùng một cách.
 */
const KEY = "hanni:pending-trial-words";

export function savePendingWords(wordIds: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(wordIds));
  } catch {
    /* trình duyệt có thể chặn sessionStorage — mất phần lưu từ, không sao */
  }
}

/** Đọc rồi XOÁ luôn: chỉ đưa vào hàng đợi đúng một lần. */
export function drainPendingWords(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    sessionStorage.removeItem(KEY);
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
