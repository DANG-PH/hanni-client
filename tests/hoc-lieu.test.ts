// Test trang /hoc-lieu trên trình duyệt thật, giả lập API để bật được từng trạng thái: có dữ liệu, trống, lỗi, khách.
// Chạy khi client đang bật:  npm run test:hoc-lieu   (đổi địa chỉ bằng BASE_URL, mặc định http://localhost:3000)
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const RESOURCES = [
  { id: "video-mau", title: "Video mẫu", description: "Video thử", kind: "video", bytes: 20_000_000, sha256: null, requiresLogin: true },
  { id: "bang-phien-am", title: "Bảng phiên âm", description: "PDF thử", kind: "pdf", bytes: 2_000, sha256: "a", requiresLogin: false },
  { id: "nghe-mau", title: "Bài nghe mẫu", description: "MP3 thử", kind: "audio", bytes: 300_000, sha256: "b", requiresLogin: false },
];

let browser: Browser;
let page: Page;
let linkCalls = 0;

async function open(list: (attempt: number) => { status: number; body: unknown }, link = { status: 503, body: {} }) {
  let attempt = 0;
  await page.route(/\/api\/resources$/, (route) => {
    attempt += 1;
    const { status, body } = list(attempt);
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route(/\/api\/resources\/[^/]+\/link$/, (route) => {
    linkCalls += 1;
    return route.fulfill({ status: link.status, contentType: "application/json", body: JSON.stringify(link.body) });
  });
  await page.route(/\/api\/auth\/session$/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: null }) }),
  );
  await page.goto(`${BASE}/hoc-lieu`);
}

before(async () => {
  browser = await chromium.launch();
});

beforeEach(async () => {
  linkCalls = 0;
  const context = await browser.newContext();
  page = await context.newPage();
});

after(async () => {
  await browser.close();
});

test("có danh sách: hiện đủ học liệu kèm loại và dung lượng", async () => {
  await open(() => ({ status: 200, body: RESOURCES }));
  for (const item of RESOURCES) await page.getByRole("heading", { name: item.title }).waitFor();
  assert.ok(await page.getByText(/Tài liệu PDF · 2 KB/).isVisible());
});

test("danh sách trống: báo chưa có học liệu thay vì để trang rỗng", async () => {
  await open(() => ({ status: 200, body: [] }));
  await page.getByText("Chưa có học liệu").waitFor();
});

test("API lỗi: hiện nút thử lại, bấm vào thì tải được", async () => {
  await open((attempt) => (attempt <= 4 ? { status: 500, body: {} } : { status: 200, body: RESOURCES }));
  await page.getByRole("button", { name: "Thử lại" }).click({ timeout: 30_000 });
  await page.getByRole("heading", { name: "Video mẫu" }).waitFor({ timeout: 30_000 });
});

test("khách gặp học liệu cần đăng nhập: được mời đăng nhập, không gọi API xin liên kết", async () => {
  await open(() => ({ status: 200, body: RESOURCES }));
  const invite = page.getByRole("link", { name: "Đăng nhập để mở" });
  await invite.waitFor();
  assert.match((await invite.getAttribute("href")) ?? "", /\/login\?next=\/hoc-lieu/);
  assert.equal(linkCalls, 0);
});

test("không xin được liên kết: báo lỗi ngay trên thẻ, trang không vỡ", async () => {
  await open(() => ({ status: 200, body: RESOURCES }));
  await page.getByRole("button", { name: "Nghe" }).click();
  await page.getByText("Chưa mở được học liệu này").waitFor();
  assert.equal(linkCalls, 1);
  assert.ok(await page.getByRole("heading", { name: "Bảng phiên âm" }).isVisible());
});
