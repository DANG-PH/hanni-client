import type { MetadataRoute } from "next";

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
