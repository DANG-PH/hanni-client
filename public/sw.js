/* Service worker Hanni: chỉ lưu màn mất mạng và tài nguyên thương hiệu công khai. */
const CACHE_PREFIX = "hanni-public-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_PAGE = "/offline/index.html";
const PUBLIC_ASSETS = [
  OFFLINE_PAGE,
  "/offline/offline.css",
  "/offline/offline.js",
  "/icons/icon-192.png",
];
const worker = globalThis;

worker.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS)),
  );
  // Bản cập nhật chờ người dùng chủ động mở lại, tránh mất bài học đang làm.
});

worker.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await worker.clients.claim();
    })(),
  );
});

worker.addEventListener("message", (event) => {
  if (event.data?.type === "HANNI_APPLY_UPDATE")
    event.waitUntil(worker.skipWaiting());
});

worker.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== worker.location.origin) return;
  // Tuyệt đối không cache API, cookie, phản hồi đăng nhập hoặc RSC của Next.js.
  if (
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    request.headers.has("RSC")
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await (
          await caches.open(CACHE_NAME)
        ).match(OFFLINE_PAGE);
        return (
          fallback ??
          new Response("Hanni chưa có kết nối mạng. Vui lòng thử lại.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  if (PUBLIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(
      caches
        .open(CACHE_NAME)
        .then(
          async (cache) => (await cache.match(url.pathname)) ?? fetch(request),
        ),
    );
  }
});
