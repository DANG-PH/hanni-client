// Dựng tệp mẫu cho ô viết tay ở từ điển: `public/hanzi-strokes/recog.txt` — mỗi dòng "<chữ> <nét>,<nét>,…".
// Nguồn: đường giữa nét (`medians`) của các tệp `public/hanzi-strokes/<chữ>.json` (Make Me a Hanzi, giấy phép
// Arphic — xem README.txt cùng thư mục). Dùng CHÍNH hàm chuẩn hoá của bộ nhận dạng (`lib/handwriting.ts`) nên mẫu
// và nét người viết luôn được xử lý giống nhau. Chạy lại khi đổi số điểm/nét hoặc thêm chữ: node scripts/build-handwriting-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodeStrokes, normalizeStrokes } from "../lib/handwriting.ts";

const DIR = new URL("../public/hanzi-strokes/", import.meta.url).pathname;
const index = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8"));
const lines = [];
for (const { c } of index) {
  const { medians } = JSON.parse(readFileSync(join(DIR, `${c}.json`), "utf8"));
  // Make Me a Hanzi: trục y hướng lên, đỉnh chữ ở y = 900 → đổi sang toạ độ màn hình (y hướng xuống) như nét người viết.
  const strokes = medians.map((stroke) => stroke.map(([x, y]) => [x, 900 - y]));
  lines.push(`${c} ${encodeStrokes(normalizeStrokes(strokes))}`);
}
writeFileSync(join(DIR, "recog.txt"), lines.join("\n") + "\n");
console.log(`recog.txt: ${lines.length} chữ, ${(lines.join("\n").length / 1024).toFixed(0)} KB`);
