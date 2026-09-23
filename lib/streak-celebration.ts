/**
 * Kênh nhỏ báo hiệu VỪA cán một cột mốc chuỗi ngày học (1/3/7/30/100 ngày).
 *
 * Vì sao tách riêng khỏi chuông thông báo có sẵn: mở khoá huy hiệu
 * STREAK_* trước đây chỉ thêm 1 dòng vào danh sách thông báo — người dùng
 * phải chủ động bấm chuông mới thấy, và nhìn y hệt mọi loại thông báo khác
 * (bình luận, theo dõi...). Nghiên cứu về Duolingo (xem hanni-client/
 * CLAUDE.md mục "Cột mốc chuỗi ngày học") đo được: riêng việc tách MÀN HÌNH
 * ĂN MỪNG cho đúng những cột mốc hiếm (không phải mọi buổi ôn) dịch chuyển
 * được tỉ lệ quay lại ở ngày 7 — vì người dùng chỉ thấy nó "hiếm" khi nó
 * thực sự hiếm; lặp lại mỗi buổi ôn (như dòng "Chuỗi N ngày" cuối mỗi buổi
 * ôn ở /study) thì mất tác dụng dần.
 *
 * `lib/notifications.ts`'s `onNew()` đã nhận MỌI thông báo qua socket —
 * chỗ đó lọc ra đúng loại ACHIEVEMENT_UNLOCKED với mã STREAK_* rồi phát
 * tín hiệu qua đây, thay vì mở kết nối socket riêng.
 *
 * Module-level store thay vì Context: chỉ 1 modal cho cả app, không đáng
 * dựng provider (cùng cách `lib/tour.ts`/`lib/pwa/store.ts` đã làm).
 */
type Listener = (streakDays: number) => void;

const listeners = new Set<Listener>();

export function announceStreakMilestone(streakDays: number) {
  for (const fn of listeners) fn(streakDays);
}

export function onStreakMilestone(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
