import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Chỉ cho index các trang công khai — mọi thứ dưới (app) cần đăng nhập,
 * không có giá trị SEO và không nên bị crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register", "/onboarding", "/nguon-du-lieu", "/install"],
      disallow: [
        "/dashboard",
        "/learn",
        "/vocabulary",
        "/grammar",
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
