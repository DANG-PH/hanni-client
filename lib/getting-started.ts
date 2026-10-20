/** Khoá trình duyệt cho thẻ "Bắt đầu với Hanni" (`components/learn/getting-started.tsx`). */
export const GETTING_STARTED_HIDDEN_KEY = "hanni:getting-started-hidden";
export const TONE_TRIED_KEY = "hanni:tone-tried";

/** Chấm thanh điệu chạy ngay trên máy nên server không biết người dùng đã thử — `ToneCheck` gọi khi chấm xong. */
export function markToneTried() {
  try {
    localStorage.setItem(TONE_TRIED_KEY, "1");
    window.dispatchEvent(new Event(TONE_TRIED_KEY));
  } catch {
    /* bỏ qua */
  }
}
