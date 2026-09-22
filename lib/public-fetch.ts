import { API_BASE } from "./api";

/**
 * Gọi API cho các trang CÔNG KHAI (`app/(site)`) render phía server.
 *
 * Lý do tồn tại (lỗi thật, đo trên production 2026-09-22): các trang này
 * `revalidate = 86400`, nên KẾT QUẢ render được cache 24 giờ. Trước đây mỗi
 * trang tự `try/catch` rồi coi MỌI lỗi là "không có dữ liệu" → `notFound()`
 * hoặc danh sách rỗng. Chỉ cần API chớp tắt đúng lúc (pm2 restart khi deploy,
 * 502 vài giây) là trang hỏng đó bị CACHE nguyên 24h — và vì phần thân trang
 * nằm sau `loading.tsx` (streaming), phản hồi vẫn là **HTTP 200** kèm thân
 * trang trống. Google thấy 200 nên không thử lại, lại không có nội dung để
 * index: tệ hơn hẳn một lỗi 500 thật. Đo được 3 trang từ điển (学生, 电脑,
 * 苹果) đang ở đúng trạng thái này trong khi 27 từ khác bình thường.
 *
 * Nên: chỉ 404 của API mới là "thật sự không có mục này" (trả `null` để gọi
 * `notFound()`); mọi lỗi khác NÉM RA để Next không cache gì cả, lượt bò kế
 * tiếp của bot sẽ dựng lại trang đúng.
 *
 * CHỈ dùng cho trang render theo yêu cầu (dynamic). Trang prerender lúc build
 * (`/hoc-thu`, `/hsk`, `/tu-da-biet`, `sitemap`) vẫn phải tự nuốt lỗi, nếu
 * không API chưa chạy là sập cả bản build.
 */
export async function fetchPublic<T>(
  path: string,
  revalidate: number,
): Promise<T | null> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} trả về ${res.status}`);
  return (await res.json()) as T;
}
