"use client";

/**
 * BẢN ĐỒ TRANG — LUYỆN TẬP (/luyen-tap) — lưới công cụ: nghe, phát âm, nói AI, viết, video, trò chơi, phiên âm…
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   (Trang tĩnh — không gọi API nào.)
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { PageHeading, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { PRACTICE_SECTIONS } from "@/lib/nav";
import { SceneCover } from "@/components/learning-scenes";

/**
 * Mọi cách luyện thêm ngoài lộ trình, một chỗ — thay cho các nhóm xổ ra ở
 * sidebar. Giống lưới "Công cụ học tập" ở app Hanbeego và trang "Học tập" của
 * Hanzii: mỗi công cụ một ô có tên + một dòng nói rõ làm gì, bấm là vào.
 */
export default function PracticeHubPage() {
  // Khách dùng được (2026-10-18) — chỉ lưu tiến độ mới cần tài khoản.
  const { loading } = useAuth();
  const [category, setCategory] = useState<number | null>(null);
  const groups = category === null ? PRACTICE_SECTIONS : [PRACTICE_SECTIONS[category]];
  const tools = groups.flatMap((section) => section.items);
  if (loading) return <Spinner />;

  return (
    <div className="page-wrap practice-hub space-y-7">
      <PageHeading
        icon="grid"
        title="Luyện tập"
        description="Luyện thêm ngoài lộ trình — nghe, nói, viết đều lấy từ của bài bạn đang học."
      >
        {/* Tra từ nhanh: gửi thẳng sang /tu-dien?q=… (trang từ điển tự lọc). */}
        <form action="/tu-dien" role="search" className="flex w-full gap-2 lg:w-80">
          <label htmlFor="hub-q" className="sr-only">
            Tra từ
          </label>
          <input
            id="hub-q"
            name="q"
            type="search"
            placeholder="Tra từ: 你好, nihao, học sinh…"
            className="field h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm"
          />
          <button
            type="submit"
            aria-label="Tra từ"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg"
          >
            <Icon name="search" size={18} />
          </button>
        </form>
      </PageHeading>

      <div className="practice-filters" role="group" aria-label="Nhóm luyện tập">
        <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
          Tất cả
        </button>
        {PRACTICE_SECTIONS.map((section, i) => (
          <button key={section.title} type="button" aria-pressed={category === i} onClick={() => setCategory(i)}>
            {section.title}
          </button>
        ))}
      </div>
      <ul className="practice-grid" aria-label="Công cụ luyện tập">
        {tools.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="panel practice-tool flex h-full flex-col overflow-hidden">
              <SceneCover kind={item.scene} />
              <span className="practice-tool-copy">
                <span className="practice-tool-title">
                  <Icon name={item.icon} size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <Icon name="chevron" size={14} className="mt-0.5 shrink-0 text-muted" />
                </span>
                <span className="practice-tool-description">{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
