"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";

/** Mẹo theo kiểu "Mẹo (1/598)" của Hanzii — nhưng là mẹo RIÊNG của người Việt: âm Hán Việt, dấu → thanh,
 * bộ thủ. Số liệu lấy từ chính dữ liệu Hanni (tỉ lệ đúng đo ở /phien-am, 969 từ ở /tu-da-biet). */
const TIPS: { title: string; body: ReactNode; href: string; cta: string }[] = [
  {
    title: "Dấu tiếng Việt đoán được thanh",
    body: (
      <>
        Âm Hán Việt không dấu → thanh 1 (đúng 96%) · huyền → thanh 2 (91%) · hỏi/ngã → thanh 3 (92%) · sắc/nặng → thanh 4 (94%).
        Vd <span lang="zh" className="hanzi">学</span> học → xué (thanh 2).
      </>
    ),
    href: "/phien-am",
    cta: "Xem bảng phiên âm",
  },
  {
    title: "Bạn đã biết sẵn gần 1.000 từ",
    body: (
      <>
        Đọc theo âm Hán Việt là ra luôn nghĩa: <span lang="zh" className="hanzi">电话</span> điện thoại,{" "}
        <span lang="zh" className="hanzi">世界</span> thế giới, <span lang="zh" className="hanzi">机会</span> cơ hội.
      </>
    ),
    href: "/tu-da-biet",
    cta: "Xem danh sách",
  },
  {
    title: "Ghép nghĩa từng chữ",
    body: (
      <>
        <span lang="zh" className="hanzi">电脑</span> = <span lang="zh" className="hanzi">电</span> điện +{" "}
        <span lang="zh" className="hanzi">脑</span> não → &ldquo;bộ não chạy bằng điện&rdquo; = máy tính.
      </>
    ),
    href: "/tu-dien/电脑",
    cta: "Xem từ 电脑",
  },
  {
    title: "Bộ thủ gợi nghĩa",
    body: (
      <>
        Chữ có bộ <span lang="zh" className="hanzi">氵</span> (thủy) thường liên quan tới nước:{" "}
        <span lang="zh" className="hanzi">河</span> hà, <span lang="zh" className="hanzi">海</span> hải,{" "}
        <span lang="zh" className="hanzi">洗</span> tẩy.
      </>
    ),
    href: "/tu-dien?q=%E6%B4%97&tab=han-tu",
    cta: "Xem chữ 洗",
  },
  {
    title: "Lượng từ đi theo danh từ",
    body: (
      <>
        <span lang="zh" className="hanzi">一本书</span> một quyển sách · <span lang="zh" className="hanzi">一只猫</span> một con mèo ·{" "}
        <span lang="zh" className="hanzi">一台电脑</span> một cái máy tính.
      </>
    ),
    href: "/tu-dien/书",
    cta: "Xem lượng từ của 书",
  },
  {
    title: "Một chữ, hai cách đọc",
    body: (
      <>
        <span lang="zh" className="hanzi">长</span> cháng (dài) / zhǎng (lớn lên) · <span lang="zh" className="hanzi">还</span> hái (vẫn) /
        huán (trả lại). Âm Hán Việt cũng đổi theo: trường / trưởng.
      </>
    ),
    href: "/tu-dien/长",
    cta: "Xem chữ 长",
  },
];

export function HanVietTips() {
  const [i, setI] = useState(0);
  const tip = TIPS[i];
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{tip.title}</p>
        <span className="shrink-0 text-xs text-muted tabular-nums">
          {i + 1}/{TIPS.length}
        </span>
      </div>
      <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-muted">{tip.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <Link href={tip.href} className="inline-flex min-h-8 items-center text-xs font-semibold text-primary hover:underline">
          {tip.cta} →
        </Link>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Mẹo trước"
            onClick={() => setI((i - 1 + TIPS.length) % TIPS.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:text-primary"
          >
            <Icon name="back" size={14} />
          </button>
          <button
            type="button"
            aria-label="Mẹo tiếp"
            onClick={() => setI((i + 1) % TIPS.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:text-primary"
          >
            <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
