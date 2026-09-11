import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);

function harness(overrides = {}) {
  const handlers = new Map();
  const saved = [],
    deleted = [],
    notified = [];
  let skipped = 0,
    claimed = 0;
  const fallback = new Response("offline");
  const cache = {
    addAll: async (assets) => saved.push(...assets),
    match: async () => fallback,
  };
  const scope = {
    URL,
    Response,
    location: { origin: "https://hanni.example" },
    addEventListener: (name, listener) => handlers.set(name, listener),
    skipWaiting: async () => {
      skipped++;
    },
    registration: {
      showNotification: async (title, options) => {
        notified.push({ title, ...options });
      },
    },
    clients: {
      claim: async () => {
        claimed++;
      },
      matchAll: async () => [],
      openWindow: async () => undefined,
    },
    caches: {
      open: async () => cache,
      keys: async () => [
        "hanni-public-v0",
        "hanni-public-v1",
        "other-app-cache",
      ],
      delete: async (key) => deleted.push(key),
    },
    fetch: async () => new Response("online"),
    ...overrides,
  };
  vm.runInNewContext(source, scope);
  async function fire(name, fields = {}) {
    let pending = Promise.resolve();
    let response;
    handlers.get(name)({
      waitUntil: (promise) => {
        pending = promise;
      },
      respondWith: (promise) => {
        response = Promise.resolve(promise);
      },
      ...fields,
    });
    await pending;
    return response
      ? { intercepted: true, response: await response }
      : { intercepted: false };
  }
  function request(path, options = {}) {
    return {
      url: new URL(path, scope.location.origin).href,
      method: "GET",
      mode: "navigate",
      headers: new Headers(),
      ...options,
    };
  }
  return {
    fire,
    request,
    saved,
    deleted,
    notified,
    scope,
    fallback,
    skipped: () => skipped,
    claimed: () => claimed,
  };
}

test("Cài worker chỉ tải tài nguyên công khai và không ép cập nhật phiên đang học", async () => {
  const h = harness();
  await h.fire("install");
  assert.equal(h.skipped(), 0);
  assert(h.saved.includes("/offline/index.html"));
  assert(
    h.saved.every(
      (path) => path.startsWith("/offline/") || path.startsWith("/icons/"),
    ),
  );
});

test("Kích hoạt không xóa cache của ứng dụng khác", async () => {
  const h = harness();
  await h.fire("activate");
  assert.deepEqual(h.deleted, ["hanni-public-v0"]);
  assert.equal(h.claimed(), 1);
});

test("Chỉ cập nhật sau thông điệp được định danh của Hanni", async () => {
  const h = harness();
  await h.fire("message", { data: { type: "OTHER" } });
  assert.equal(h.skipped(), 0);
  await h.fire("message", { data: { type: "HANNI_APPLY_UPDATE" } });
  assert.equal(h.skipped(), 1);
});

test("Không can thiệp API, gửi bài, RSC, chunk Next và yêu cầu khác origin", async () => {
  const h = harness();
  for (const request of [
    h.request("/api/users/me"),
    h.request("/api"),
    h.request("/study", { method: "POST" }),
    h.request("/learn?_rsc=abc", { headers: new Headers({ RSC: "1" }) }),
    h.request("/_next/static/chunks/app.js"),
    h.request("https://api.hanni.example/words"),
  ])
    assert.equal(
      (await h.fire("fetch", { request })).intercepted,
      false,
      request.url,
    );
});

test("Mất mạng khi điều hướng trả trang offline và không ghi cache nội dung người dùng", async () => {
  const h = harness({
    fetch: async () => {
      throw new TypeError("network unavailable");
    },
  });
  const result = await h.fire("fetch", {
    request: h.request("/account?private=1"),
  });
  assert.equal(result.response, h.fallback);
  assert.equal(h.saved.length, 0);
});

test("Lỗi HTTP xác thực từ server được giữ nguyên, không bị trang offline che khuất", async () => {
  const unauthorized = new Response("unauthorized", { status: 401 });
  const h = harness({ fetch: async () => unauthorized });
  const result = await h.fire("fetch", { request: h.request("/account") });
  assert.equal(result.response, unauthorized);
  assert.equal(h.saved.length, 0);
});

test("Thiếu cache offline vẫn trả 503 rõ ràng khi mất mạng", async () => {
  const h = harness({
    fetch: async () => {
      throw new Error("offline");
    },
    caches: { open: async () => ({ match: async () => undefined }) },
  });
  const result = await h.fire("fetch", { request: h.request("/learn") });
  assert.equal(result.response.status, 503);
});

test("Giữ file hỗ trợ offline hoạt động nhưng không lưu video/audio", async () => {
  const h = harness();
  assert.equal(
    (
      await h.fire("fetch", {
        request: h.request("/offline/offline.css", { mode: "cors" }),
      })
    ).response,
    h.fallback,
  );
  assert.equal(
    (
      await h.fire("fetch", {
        request: h.request("/videologin.mp4", { mode: "cors" }),
      })
    ).intercepted,
    false,
  );
});

test("Push hiển thị thông báo từ payload JSON, dùng đường dẫn mặc định nếu thiếu url", async () => {
  const h = harness();
  await h.fire("push", {
    data: { json: () => ({ title: "Bài ôn tới hạn", body: "12 từ đang chờ" }) },
  });
  assert.equal(h.notified.length, 1);
  const [note] = h.notified;
  assert.equal(note.title, "Bài ôn tới hạn");
  assert.equal(note.body, "12 từ đang chờ");
  assert.equal(note.icon, "/icons/icon-192.png");
  assert.equal(note.badge, "/icons/icon-192.png");
  assert.equal(note.data.url, "/dashboard");
});

test("Push không có payload vẫn hiển thị thông báo mặc định, không throw", async () => {
  const h = harness();
  await h.fire("push", {});
  assert.equal(h.notified.length, 1);
  assert.equal(h.notified[0].title, "Hanni");
});

test("Bấm vào thông báo mở tab hiện có nếu khớp url, không thì mở tab mới", async () => {
  const existing = { url: "https://hanni.example/dashboard", focus: () => {} };
  let focused = false;
  existing.focus = () => {
    focused = true;
  };
  const opened = [];
  const h = harness({
    clients: {
      claim: async () => {},
      matchAll: async () => [existing],
      openWindow: async (url) => opened.push(url),
    },
  });
  let closed = false;
  await h.fire("notificationclick", {
    notification: {
      close: () => {
        closed = true;
      },
      data: { url: "/dashboard" },
    },
  });
  assert.equal(closed, true);
  assert.equal(focused, true);
  assert.equal(opened.length, 0);
});

test("Bấm vào thông báo mở tab mới khi chưa có tab nào khớp", async () => {
  const opened = [];
  const h = harness({
    clients: {
      claim: async () => {},
      matchAll: async () => [],
      openWindow: async (url) => opened.push(url),
    },
  });
  await h.fire("notificationclick", {
    notification: { close: () => {}, data: { url: "/study" } },
  });
  assert.deepEqual(opened, ["/study"]);
});
