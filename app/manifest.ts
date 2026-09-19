import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Nhận diện ứng dụng cài đặt; dùng các đường dẫn học tập có thật của Hanni. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Hanni — Học tiếng Trung mỗi ngày",
    short_name: "Hanni",
    description:
      "Học tiếng Trung theo lộ trình HSK, ôn từ vựng và theo dõi tiến độ của bạn.",
    lang: "vi",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#dc3526",
    orientation: "any",
    categories: ["education"],
    // Tự tham chiếu chính mình dạng "webapp" — cho phép
    // `navigator.getInstalledRelatedApps()` (Chrome/Edge) biết ứng dụng ĐÃ
    // được cài trên thiết bị hay chưa mà không cần đợi sự kiện
    // `beforeinstallprompt`/`appinstalled` (2 sự kiện này không bắn lại một
    // khi đã cài, nên trước đây không có cách nào phân biệt "chưa cài" với
    // "đã cài nhưng đang mở ở tab trình duyệt thường" — xem `pwa-runtime.tsx`).
    related_applications: [
      { platform: "webapp", url: `${siteUrl}/manifest.webmanifest` },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Lộ trình HSK",
        short_name: "Vào học",
        url: "/learn",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
      },
      {
        name: "Ôn tập flashcard",
        short_name: "Ôn tập",
        url: "/study",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
      },
    ],
  };
}
