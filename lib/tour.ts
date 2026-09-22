/**
 * Kênh nhỏ để mở LẠI popup hướng dẫn của một trang.
 *
 * `FeatureTour` chỉ hiện đúng 1 lần rồi ghi nhớ vào localStorage — nhưng
 * người dùng bấm "Đã hiểu" lúc chưa kịp đọc thì mất luôn, không có đường
 * xem lại. Nút "Hướng dẫn" ở tiêu đề trang (`PageHeading`) phát tín hiệu
 * qua đây, popup của đúng trang đó nghe được thì tự mở lại.
 *
 * Dùng module-level store thay vì Context: chỉ có 1 popup mỗi trang, không
 * đáng dựng provider bọc cả app (cùng cách `lib/pwa/store.ts` đang làm).
 */
type Listener = (key: string) => void;

const listeners = new Set<Listener>();

export function openTour(key: string) {
  for (const fn of listeners) fn(key);
}

export function onOpenTour(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
