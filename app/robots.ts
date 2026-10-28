import type { MetadataRoute } from "next";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
/** Chỉ cho index các trang công khai render sẵn HTML ở server. Trang dưới (app)
 * — kể cả trang khách đã vào được từ 2026-10-18 (/learn, /watch, /minigame…) —
 * vẽ ở trình duyệt, HTML server trả về chỉ có vòng tải nên không có gì cho
 * Google đọc, không mời crawl.
 *
 * `/tu-dien` là NGOẠI LỆ quan trọng: đây là bản công khai (không cần đăng
 * nhập) của kho từ vựng, cố tình mở cho Google index. Trước đây toàn bộ nội
 * dung nằm sau đăng nhập nên sitemap chỉ có 6 URL toàn trang chức năng —
 * gần như không có cửa nào để người học tìm thấy Hanni qua tìm kiếm. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/tu-dien",
        "/tu-da-biet",
        "/hsk",
        "/ngu-phap",
        "/thi-thu-hsk",
        "/phien-am",
        "/kiem-tra-trinh-do",
        "/login",
        "/register",
        "/onboarding",
        "/nguon-du-lieu",
        "/install",
        "/gioi-thieu",
        "/hop-tac",
        "/dieu-khoan",
        "/chinh-sach-bao-mat",
      ],
      disallow: [
        "/dashboard",
        "/bai-hoc",
        "/bat-dau",
        "/learn",
        "/listening",
        "/pronunciation",
        "/writing",
        "/leaderboard",
        "/progress",
        "/watch",
        "/achievements",
        "/account",
        "/settings",
        "/study",
        "/u/",
        "/auth/",
        "/forgot-password",
        "/reset-password",
        "/lop-hoc",
        "/lop/",
        "/bai-doc",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
