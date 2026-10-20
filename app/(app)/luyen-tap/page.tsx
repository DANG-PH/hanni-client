"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { PageHeading, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { PRACTICE_SECTIONS } from "@/lib/nav";

/**
 * Mọi cách luyện thêm ngoài lộ trình, một chỗ — thay cho các nhóm xổ ra ở
 * sidebar. Giống lưới "Công cụ học tập" ở app Hanbeego và trang "Học tập" của
 * Hanzii: mỗi công cụ một ô có tên + một dòng nói rõ làm gì, bấm là vào.
 */
export default function PracticeHubPage() {
  // Khách dùng được (2026-10-18) — chỉ lưu tiến độ mới cần tài khoản.
  const { loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <div className="page-wrap space-y-7">
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

      {PRACTICE_SECTIONS.map((section, i) => (
        <section key={section.title} aria-labelledby={`hub-${i}`}>
          <h2 id={`hub-${i}`} className="mb-3 text-sm font-bold text-muted">
            {section.title}
          </h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="panel hover-card flex h-full flex-col gap-3 p-4 sm:flex-row sm:items-start"
                >
                  <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted">{item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
