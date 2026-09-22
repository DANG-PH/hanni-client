import type { MetadataRoute } from "next";
import { API_BASE } from "@/lib/api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Tính lại mỗi 24h — 10.9k URL, không nên dựng lại ở mỗi lượt bot ghé. */
export const revalidate = 86400;

interface SlugRow {
  simplified: string;
  updatedAt: string;
}

/** Trang từ điển công khai — phần LỚN NHẤT của sitemap. Trước đây sitemap chỉ
 * có 6 URL toàn trang chức năng (login/register/install) nên Google gần như
 * không có gì để index; toàn bộ kho từ vựng nằm sau đăng nhập. Lỗi fetch thì
 * trả về mảng rỗng: sitemap vẫn hợp lệ với các trang tĩnh, không làm sập build. */
async function dictionaryEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_BASE}/dictionary/slugs`, {
      next: { revalidate },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as SlugRow[];
    return rows.map((r) => ({
      url: `${siteUrl}/tu-dien/${encodeURIComponent(r.simplified)}`,
      lastModified: new Date(r.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

interface GrammarRow {
  slug: string;
  flat?: boolean;
}

/** Điểm ngữ pháp CÓ giải thích thật — mục đại cương rút gọn (`flat`) mở ra là
 * ngõ cụt nên không mời Google index. */
async function grammarEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_BASE}/grammar`, { next: { revalidate } });
    if (!res.ok) return [];
    const rows = (await res.json()) as GrammarRow[];
    return rows
      .filter((g) => g.flat !== true)
      .map((g) => ({
        url: `${siteUrl}/ngu-phap/${encodeURIComponent(g.slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/tu-dien`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/hoc-thu`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/tu-da-biet`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/hsk`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/ngu-phap`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/nguon-du-lieu`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/install`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
  const [dict, grammar] = await Promise.all([
    dictionaryEntries(),
    grammarEntries(),
  ]);
  return [...staticPages, ...grammar, ...dict];
}
