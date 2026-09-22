import { redirect } from "next/navigation";

/**
 * GỘP vào `/tu-dien`. Trước đây trang này và `/tu-dien` hiển thị CÙNG dữ liệu
 * từ vựng, chỉ khác: trang này cần đăng nhập và render bằng JS nên Google
 * không đọc được. Hai hệ thống rời rạc cho một việc — giờ `/tu-dien` làm cả
 * duyệt theo cấp lẫn tra chi tiết, ai cũng xem được.
 *
 * Redirect phía SERVER (không phải useEffect) để bot và người dùng đều được
 * chuyển ngay, không tải trang rỗng rồi mới nhảy. Giữ nguyên `?level=` để
 * link cũ từ dashboard/trợ lý AI vẫn về đúng cấp.
 */
export default async function VocabularyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  redirect(level ? `/tu-dien?level=${encodeURIComponent(level)}` : "/tu-dien");
}
