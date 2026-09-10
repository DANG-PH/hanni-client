import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Brand } from "@/components/sidebar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="page-wrap grid gap-8 py-10! sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Hanni — trang chủ">
              <Brand />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-6 text-muted">
              Một góc nhỏ để học tiếng Trung mỗi ngày.
              <br />
              Cùng bạn đi từ những bước đầu tiên.
            </p>
          </div>
          {[
            {
              title: "KHÁM PHÁ HANNI",
              links: [
                ["Lộ trình HSK", "/learn"],
                ["Thư viện từ vựng", "/vocabulary"],
                ["Luyện nghe", "/listening"],
                ["Luyện phát âm", "/pronunciation"],
              ],
            },
            {
              title: "ĐỒNG HÀNH CÙNG BẠN",
              links: [
                ["Tài khoản của bạn", "/account"],
                ["Tiến độ học tập", "/progress"],
                ["Câu hỏi thường gặp", "/#cau-hoi"],
                ["Nguồn & giấy phép học liệu", "/nguon-du-lieu"],
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h2 className="text-[10px] font-bold tracking-wider">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-xs text-muted transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="page-wrap flex flex-wrap items-center justify-between gap-3 py-5! text-[11px] text-muted">
            <span>
              © {new Date().getFullYear()} Hanni. Mỗi ngày một chút, tiến xa
              hơn.
            </span>
            <span>Được xây dựng cho người học tiếng Trung.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
