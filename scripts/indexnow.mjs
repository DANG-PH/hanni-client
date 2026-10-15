/**
 * Báo URL cho các công cụ tìm kiếm hỗ trợ IndexNow (Bing — nguồn của ChatGPT
 * Search/DuckDuckGo —, Yandex, Seznam, Naver…) để được index trong vài ngày
 * thay vì đợi bot tự bò tới. Google KHÔNG hỗ trợ IndexNow — Google cần xác
 * minh Search Console (xem GOOGLE_SITE_VERIFICATION ở app/layout.tsx) rồi
 * nộp sitemap.
 *
 * Khoá xác minh là file `public/<KEY>.txt` (nội dung = khoá) đã deploy cùng
 * site. Chạy SAU khi deploy có trang mới:
 *   node scripts/indexnow.mjs                 # toàn bộ sitemap
 *   node scripts/indexnow.mjs /phien-am ...   # chỉ vài đường dẫn
 */
const HOST = "hanni.dangpham.id.vn";
const KEY = "7f568f7653e25b72aebc4f37acc0ceac";
const BATCH = 10000; // giới hạn của IndexNow cho 1 lần gửi

async function urlsFromSitemap() {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((p) => `https://${HOST}${p}`) : await urlsFromSitemap();
const key = await (await fetch(`https://${HOST}/${KEY}.txt`)).text();
if (key.trim() !== KEY) throw new Error("File khoá chưa có trên site — deploy trước rồi chạy lại");

for (let i = 0; i < urls.length; i += BATCH) {
  const urlList = urls.slice(i, i + BATCH);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  console.log(`Gửi ${urlList.length} URL → HTTP ${res.status}`);
}
