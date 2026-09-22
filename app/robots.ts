import type { MetadataRoute } from "next";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
/** Chỉ cho index các trang công khai — mọi thứ dưới (app) cần đăng nhập,
 * không có giá trị SEO và không nên bị crawl.
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
        "/hoc-thu",
        "/ngu-phap",
        "/login",
        "/register",
        "/onboarding",
        "/nguon-du-lieu",
        "/install",
      ],
      disallow: [
        "/dashboard",
        "/learn",
        "/listening",
        "/pronunciation",
        "/writing",
        "/exams",
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
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
