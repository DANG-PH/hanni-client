import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Chỉ liệt kê trang công khai — trang cần đăng nhập không có giá trị SEO. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/nguon-du-lieu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/install`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
