// Bộ nhận dạng chữ viết tay (lib/handwriting.ts) — chạy: npm run test:handwriting
// Giả lập nét người viết từ đường giữa nét của chính chữ đó (1/5 số chữ HSK) + biến dạng: run tay, đảo thứ tự nét,
// viết ngược chiều nét, quên 1 nét; cộng vài chữ vẽ tay bằng nét thẳng thô như người mới viết.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseTemplates, recognize, type Stroke } from "../lib/handwriting.ts";

const DIR = new URL("../public/hanzi-strokes/", import.meta.url).pathname;
const templates = parseTemplates(readFileSync(DIR + "recog.txt", "utf8"));
const index: { c: string }[] = JSON.parse(readFileSync(DIR + "index.json", "utf8"));
const sample = index.filter((_, i) => i % 5 === 0).map(({ c }) => {
  const { medians } = JSON.parse(readFileSync(`${DIR}${c}.json`, "utf8")) as { medians: [number, number][][] };
  return { c, strokes: medians.map((s) => s.map(([x, y]) => [x, 900 - y] as [number, number])) };
});

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const noise = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

function distort(strokes: Stroke[], opt: { swap?: boolean; reverse?: boolean; drop?: boolean }): Stroke[] {
  const ang = (noise() * 5 * Math.PI) / 180;
  const sx = 1 + noise() * 0.08;
  const sy = 1 + noise() * 0.08;
  const out: Stroke[] = strokes.map((s) =>
    s.map(([x, y]) => {
      const X = (x - 512) * sx;
      const Y = (y - 450) * sy;
      return [X * Math.cos(ang) - Y * Math.sin(ang) + noise() * 20, X * Math.sin(ang) + Y * Math.cos(ang) + noise() * 20];
    }),
  );
  if (opt.reverse && out.length > 1) {
    const i = Math.floor(rnd() * out.length);
    out[i] = [...out[i]].reverse();
  }
  if (opt.swap && out.length > 2) {
    const i = Math.floor(rnd() * (out.length - 1));
    [out[i], out[i + 1]] = [out[i + 1], out[i]];
  }
  if (opt.drop && out.length > 3) out.splice(Math.floor(rnd() * out.length), 1);
  return out;
}

function accuracy(opt: Parameters<typeof distort>[1]) {
  let top1 = 0;
  let top5 = 0;
  for (const { c, strokes } of sample) {
    const res = recognize(templates, distort(strokes, opt));
    if (res[0] === c) top1++;
    if (res.slice(0, 5).includes(c)) top5++;
  }
  return { top1: top1 / sample.length, top5: top5 / sample.length };
}

test("tệp mẫu có đủ chữ HSK", () => {
  assert.equal(templates.length, index.length);
});

test("run tay, đảo thứ tự nét, viết ngược chiều nét vẫn nhận đúng", () => {
  const { top1, top5 } = accuracy({ swap: true, reverse: true });
  assert.ok(top1 >= 0.97, `top-1 ${top1}`);
  assert.ok(top5 >= 0.99, `top-5 ${top5}`);
});

test("quên 1 nét: chữ đúng vẫn nằm trong 5 gợi ý đầu", () => {
  const { top5 } = accuracy({ drop: true });
  assert.ok(top5 >= 0.9, `top-5 ${top5}`);
});

test("chữ vẽ tay bằng nét thẳng thô như người mới viết", () => {
  const hand: Record<string, Stroke[]> = {
    十: [[[40, 128], [216, 128]], [[128, 40], [128, 216]]],
    口: [[[70, 70], [70, 190]], [[70, 70], [186, 70], [186, 190]], [[70, 186], [186, 186]]],
    人: [[[128, 40], [112, 120], [50, 210]], [[120, 110], [170, 170], [215, 210]]],
    大: [[[50, 100], [206, 100]], [[128, 40], [120, 130], [50, 215]], [[128, 125], [210, 215]]],
    木: [[[50, 90], [206, 90]], [[128, 30], [128, 230]], [[125, 95], [50, 190]], [[131, 95], [210, 190]]],
    中: [[[70, 80], [70, 160]], [[70, 80], [186, 80], [186, 160]], [[70, 158], [186, 158]], [[128, 30], [128, 230]]],
  };
  for (const [c, strokes] of Object.entries(hand)) assert.equal(recognize(templates, strokes)[0], c);
});

test("không có nét hoặc nét chỉ 1 điểm không làm hỏng", () => {
  assert.deepEqual(recognize(templates, []), []);
  assert.ok(recognize(templates, [[[10, 10]]]).length > 0);
});
