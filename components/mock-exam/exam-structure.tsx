"use client";

import { useState } from "react";

/** Cấu trúc đề HSK hiện hành theo cấp. Mọi bảng đều nằm sẵn trong HTML (bảng
 * đang ẩn chỉ gắn `hidden`) để Google đọc được "cấu trúc đề HSK 3", HSK 2, HSK 1. */
const STRUCTURES: { level: number; rows: { part: string; task: string; n: number }[]; total: string }[] = [
  {
    level: 1,
    rows: [
      { part: "Nghe — Phần 1", task: "Nghe từ, đối chiếu tranh: đúng ✓ / sai ✗", n: 5 },
      { part: "Nghe — Phần 2", task: "Nghe 1 câu, chọn 1 trong 3 tranh", n: 5 },
      { part: "Nghe — Phần 3", task: "Nghe hội thoại, ghép với tranh A–F", n: 5 },
      { part: "Nghe — Phần 4", task: "Nghe câu + câu hỏi, chọn đáp án", n: 5 },
      { part: "Đọc — Phần 1", task: "Đọc từ, đối chiếu tranh: đúng ✓ / sai ✗", n: 5 },
      { part: "Đọc — Phần 2", task: "Đọc câu, ghép với tranh A–F", n: 5 },
      { part: "Đọc — Phần 3", task: "Ghép câu hỏi với câu trả lời A–F", n: 5 },
      { part: "Đọc — Phần 4", task: "Chọn từ A–F điền vào chỗ trống", n: 5 },
    ],
    total: "Tổng 40 câu · 35 phút làm bài · 200 điểm · đạt từ 120 điểm.",
  },
  {
    level: 2,
    rows: [
      { part: "Nghe — Phần 1", task: "Nghe câu, đối chiếu tranh: đúng ✓ / sai ✗", n: 10 },
      { part: "Nghe — Phần 2", task: "Nghe hội thoại, ghép tranh (2 bộ tranh)", n: 10 },
      { part: "Nghe — Phần 3", task: "Hội thoại ngắn + câu hỏi, chọn A/B/C", n: 10 },
      { part: "Nghe — Phần 4", task: "Hội thoại dài hơn + câu hỏi, chọn A/B/C", n: 5 },
      { part: "Đọc — Phần 1", task: "Đọc câu, ghép với tranh A–F", n: 5 },
      { part: "Đọc — Phần 2", task: "Chọn từ A–F điền vào chỗ trống", n: 5 },
      { part: "Đọc — Phần 3", task: "Đọc đoạn văn, xét câu ★ đúng / sai", n: 5 },
      { part: "Đọc — Phần 4", task: "Ghép câu hỏi – câu trả lời (2 bộ)", n: 10 },
    ],
    total: "Tổng 60 câu · 50 phút làm bài · 200 điểm · đạt từ 120 điểm.",
  },
  {
    level: 3,
    rows: [
      { part: "Nghe — Phần 1", task: "Nghe hội thoại, ghép tranh (2 bộ tranh)", n: 10 },
      { part: "Nghe — Phần 2", task: "Nghe 1 đoạn, xét câu ★ đúng / sai", n: 10 },
      { part: "Nghe — Phần 3", task: "Hội thoại ngắn + câu hỏi, chọn A/B/C", n: 10 },
      { part: "Nghe — Phần 4", task: "Hội thoại dài hơn + câu hỏi, chọn A/B/C", n: 10 },
      { part: "Đọc — Phần 1", task: "Ghép câu với câu đáp (2 bộ)", n: 10 },
      { part: "Đọc — Phần 2", task: "Chọn từ điền chỗ trống (2 bộ)", n: 10 },
      { part: "Đọc — Phần 3", task: "Đọc đoạn văn, trả lời câu hỏi ★", n: 10 },
      { part: "Viết — Phần 1", task: "Sắp xếp từ thành câu", n: 5 },
      { part: "Viết — Phần 2", task: "Nhìn pinyin viết chữ Hán", n: 5 },
    ],
    total: "Tổng 80 câu · 85 phút làm bài · 300 điểm · đạt từ 180 điểm.",
  },
];

export function ExamStructure() {
  const [level, setLevel] = useState(1);
  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold">Cấu trúc đề thi HSK {level}</h2>
        <div className="flex gap-1" role="tablist" aria-label="Chọn cấp">
          {STRUCTURES.map((s) => (
            <button
              key={s.level}
              type="button"
              role="tab"
              aria-selected={s.level === level}
              onClick={() => setLevel(s.level)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                s.level === level ? "bg-foreground text-background" : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              HSK {s.level}
            </button>
          ))}
        </div>
      </div>
      {STRUCTURES.map((s) => (
        <div key={s.level} hidden={s.level !== level} role="tabpanel">
          <table className="mt-3 w-full text-xs">
            <caption className="sr-only">Cấu trúc đề thi HSK {s.level}</caption>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.part} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-2 align-top font-semibold whitespace-nowrap">{r.part}</td>
                  <td className="py-2 text-muted">{r.task}</td>
                  <td className="py-2 pl-2 text-right align-top font-semibold">{r.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">{s.total}</p>
        </div>
      ))}
    </section>
  );
}
