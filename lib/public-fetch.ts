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
  const url = `${API_BASE}${path}`;
  try {
    return await read<T>(url, { next: { revalidate } });
  } catch (err) {
    if (err instanceof NotFoundError) return null;
    // Thử lại ĐÚNG 1 lần, bỏ qua cache: chính Data Cache có thể đang giữ một
    // phản hồi hỏng từ lúc API chớp tắt (đo thật trên production — 3 từ kẹt
    // lỗi liên tục trong khi gọi thẳng API vẫn 200, và 27 từ chưa ai mở bao
    // giờ thì bình thường). Lần 2 lỗi nữa thì để ném ra thật.
    try {
      return await read<T>(url, { cache: "no-store" });
    } catch (retryErr) {
      if (retryErr instanceof NotFoundError) return null;
      throw retryErr;
    }
  }
}

/** 404 của API = "không có mục này", khác hẳn lỗi tạm thời — dùng lỗi riêng
 * để phân biệt mà vẫn đi chung một đường thử lại. */
class NotFoundError extends Error {}

async function read<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 404) throw new NotFoundError(url);
  if (!res.ok) throw new Error(`API ${url} trả về ${res.status}`);
  // res.json() cũng có thể ném (body rỗng/hỏng) — nằm trong try ở trên nên
  // cũng được thử lại.
  return (await res.json()) as T;
}
