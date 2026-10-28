/**
 * Giữ tạm các từ KHÁCH bấm "Lưu để ôn tập" (từ trong video, chữa bài thi thử, quét ảnh…) để đăng ký/đăng nhập xong
 * đưa thẳng vào hàng đợi ôn (`auth-form-card.tsx` → `drainPendingWords()`). `sessionStorage` y như khảo sát làm trước
 * khi có tài khoản — cùng một bài toán, cùng một cách. Tên khoá giữ nguyên để từ đã lưu tạm không mất khi cập nhật.
 */
const KEY = "hanni:pending-trial-words";

export function savePendingWords(wordIds: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(wordIds));
  } catch {
    /* trình duyệt có thể chặn sessionStorage — mất phần lưu từ, không sao */
  }
}

/** Thêm 1 từ khách bấm "Lưu để ôn tập" (vd trong bản chép video) — giữ các
 * từ đã ghi trước đó, không ghi đè như `savePendingWords`. */
export function addPendingWord(wordId: string) {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    const ids = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    if (!ids.includes(wordId)) savePendingWords([...ids, wordId]);
  } catch {
    savePendingWords([wordId]);
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
