"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useMessagesSocket, useUnreadMessageCount } from "@/lib/messages";
import { Icon, type IconName } from "./icon";

/** Điều hướng xếp theo CHU TRÌNH HỌC (học bài mới → ôn lại → luyện kỹ năng),
 * không phải theo loại tính năng. Rút từ 16 mục xuống 12 (2026-09-22) vì
 * người mới mở app ra thấy 16 lựa chọn thì không biết bấm gì trước:
 * - `/vocabulary` BỎ HẲN — đã gộp vào `/tu-dien` (trước đó 2 trang hiển thị
 *   cùng dữ liệu, chỉ khác chỗ một cái cần đăng nhập).
 * - Huy hiệu + Bảng xếp hạng bỏ khỏi nav, vào từ trong `/progress` — cả 3 đều
 *   trả lời cùng 1 câu hỏi "mình đang ở đâu", tách 3 mục là thừa.
 * - Cài đặt vào từ trong `/account` (cùng là thiết lập cá nhân).
 * Các trang đó vẫn tồn tại và có link trỏ tới, chỉ không chiếm chỗ ở nav. */
export const NAV_GROUPS: {
  title: string;
  links: { href: string; label: string; icon: IconName }[];
}[] = [
  {
    title: "HỌC MỖI NGÀY",
    links: [
      { href: "/dashboard", label: "Tổng quan", icon: "home" },
      { href: "/learn", label: "Lộ trình HSK", icon: "route" },
      { href: "/study", label: "Ôn tập flashcard", icon: "cards" },
      { href: "/watch", label: "Học qua video", icon: "play" },
    ],
  },
  {
    title: "TRA CỨU",
    links: [
      { href: "/tu-dien", label: "Từ điển", icon: "book" },
      { href: "/ngu-phap", label: "Ngữ pháp & mẫu câu", icon: "cards" },
    ],
  },
  {
    title: "LUYỆN KỸ NĂNG",
    links: [
      { href: "/listening", label: "Luyện nghe", icon: "headphones" },
      { href: "/pronunciation", label: "Luyện phát âm", icon: "mic" },
      { href: "/writing", label: "Luyện viết Hán tự", icon: "pencil" },
      { href: "/roleplay", label: "Luyện nói với AI", icon: "message" },
      { href: "/exams", label: "Kiểm tra HSK", icon: "target" },
    ],
  },
  {
    // Rút 16 -> 12 mục (2026-09-22) đã bỏ NHẦM 2 mục này: minigame và bảng
    // xếp hạng là 2 thứ giữ chân mạnh nhất (chơi + thi đua), bỏ khỏi nav là
    // gần như không ai tìm ra — `/minigame` chỉ còn link từ `/account`.
    // Gom thành nhóm riêng thay vì nhét lại vào nhóm học: vẫn gọn, mà không
    // giấu mất tính năng.
    title: "CHƠI & THI ĐUA",
    links: [
      { href: "/minigame", label: "Minigame & Đấu 1v1", icon: "spark" },
      { href: "/leaderboard", label: "Bảng xếp hạng", icon: "trophy" },
    ],
  },
  {
    title: "CỦA BẠN",
    links: [
      { href: "/progress", label: "Tiến độ", icon: "chart" },
      { href: "/messages", label: "Tin nhắn", icon: "message" },
      { href: "/account", label: "Tài khoản", icon: "user" },
    ],
  },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/hanni.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl"
        sizes="40px"
      />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-xl font-bold tracking-tight">
            Hanni<span className="text-primary">.</span>
          </span>
          <span className="mt-0.5 block text-[10px] text-muted">
            Học tiếng Trung mỗi ngày
          </span>
        </span>
      )}
    </span>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const { data: unread } = useUnreadMessageCount();
  // Sidebar nằm trong app-shell nên luôn mount ở mọi trang — nghe socket ở
  // đây để badge chưa đọc cập nhật realtime dù đang không mở /messages
  // (trang /messages tự nghe thêm 1 lần nữa cho đúng hội thoại đang xem,
  // 2 listener cùng lúc trên 1 event vô hại, socket.io-client tự dedupe kết
  // nối theo URL).
  useMessagesSocket(null);
  return (
    <div className="flex min-h-full flex-col p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-7 px-2 pt-2"
        aria-label="Hanni — trang chủ"
      >
        <Brand />
      </Link>
      <nav aria-label="Điều hướng học tập" className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-bold tracking-[.14em] text-muted/80 uppercase">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/")
                      ? "page"
                      : undefined
                  }
                  className="nav-item text-[13px]!"
                >
                  <Icon name={link.icon} size={18} />
                  <span>{link.label}</span>
                  {link.href === "/messages" &&
                    !!unread?.count &&
                    unread.count > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-fg shadow-2xs">
                        {unread.count > 9 ? "9+" : unread.count}
                      </span>
                    )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="mb-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 to-accent/5 px-3.5 py-3.5 shadow-2xs">
          <p className="flex items-center gap-2 text-xs font-bold text-primary">
            <Icon name="spark" size={15} /> Mỗi ngày một chút
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Mỗi từ bạn nhớ là một bước tiến xa hơn.
          </p>
        </div>
        <div className="border-t border-border/70 pt-3">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await logout();
              onNavigate?.();
              setBusy(false);
            }}
            className="nav-item w-full text-left text-xs! hover:text-danger hover:bg-danger/8 disabled:opacity-50"
          >
            <Icon name="logout" size={16} />
            {busy ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
