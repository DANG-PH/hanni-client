import type { IconName } from "@/components/icon";

export type NavLink = { href: string; label: string; icon: IconName };
export type PracticeLink = NavLink & { description: string };

/**
 * Menu NGẮN, phẳng (2026-10-15). Bản nhóm thu gọn kiểu web Hanbeego (06/10)
 * dài ra lại 10–20 dòng; đối chiếu kỹ thì:
 * - Hanzii (4,8★, 1 triệu+ lượt tải) chỉ có 6 mục trên thanh trên; app của cả
 *   Hanzii, Migii HSK lẫn Hanbeego đều là 5–6 tab dưới đáy, công cụ phụ nằm
 *   trong 1 trang lưới ("Công cụ học tập" của Hanbeego).
 * - Sidebar dài 28 mục của web Hanbeego phải kèm ô "Tìm kiếm tính năng ⌘K".
 * - NN/g: menu ẩn sau hamburger được dùng ít hơn hẳn menu luôn hiện (27% so
 *   với 48% trên máy tính) — nên giữ ít mục nhưng LUÔN HIỆN, không giấu đi.
 * Vì vậy: 5 mục học + 3 mục cộng đồng/cá nhân; nghe/nói/viết/video/trò
 * chơi/ngữ pháp… gom vào trang `/luyen-tap`.
 */
export const NAV_MAIN: NavLink[] = [
  { href: "/learn", label: "Trang chủ", icon: "home" },
  { href: "/study", label: "Ôn tập", icon: "cards" },
  { href: "/thi-thu-hsk", label: "Luyện thi HSK", icon: "target" },
  { href: "/luyen-tap", label: "Luyện tập", icon: "grid" },
  { href: "/tu-dien", label: "Từ điển", icon: "search" },
];

export const NAV_MORE: NavLink[] = [
  { href: "/leaderboard", label: "Xếp hạng", icon: "trophy" },
  { href: "/messages", label: "Tin nhắn", icon: "message" },
  { href: "/progress", label: "Tiến độ", icon: "chart" },
];

export const ACCOUNT_LINK: NavLink = { href: "/account", label: "Tài khoản", icon: "user" };

/** Cuối menu, chỉ hiện khi máy này chưa cài Hanni (`sidebar.tsx`) — lối vào cố định
 * cho ai đã tắt lời mời cài nổi. */
export const INSTALL_LINK: NavLink = { href: "/install", label: "Cài ứng dụng", icon: "download" };

/** Các cách luyện thêm ngoài lộ trình — trang `/luyen-tap`. */
export const PRACTICE_SECTIONS: { title: string; items: PracticeLink[] }[] = [
  {
    title: "Luyện 4 kỹ năng",
    items: [
      { href: "/listening", label: "Luyện nghe", description: "Nghe từ của bài đang học, chọn đúng nghĩa", icon: "headphones" },
      { href: "/pronunciation", label: "Luyện phát âm", description: "Đọc to, Hanni chấm xem bạn nói đúng chưa", icon: "mic" },
      { href: "/roleplay", label: "Luyện nói với AI", description: "Gọi món, hỏi đường, mua sắm — nói như thật", icon: "message" },
      { href: "/writing", label: "Luyện viết chữ Hán", description: "Xem thứ tự nét rồi tự tô từng chữ", icon: "pencil" },
    ],
  },
  {
    title: "Học mà chơi",
    items: [
      { href: "/watch", label: "Học qua video", description: "Phim ngắn, phụ đề song ngữ, bấm từ để tra", icon: "play" },
      { href: "/minigame", label: "Trò chơi & Đấu 1v1", description: "Dịch tốc độ, ghép cặp, đấu với người khác", icon: "trophy" },
    ],
  },
  {
    title: "Nền tảng & tra cứu",
    items: [
      { href: "/phien-am", label: "Bảng phiên âm", description: "Thanh điệu, phụ âm, vần — bấm nghe từng âm", icon: "sound" },
      { href: "/ngu-phap", label: "Ngữ pháp & mẫu câu", description: "235 điểm ngữ pháp giải thích bằng tiếng Việt", icon: "book" },
      { href: "/tu-dien/quet", label: "Quét ảnh học từ", description: "Chụp thực đơn, biển hiệu, đồ vật — ra từ kèm Hán Việt", icon: "camera" },
      { href: "/tu-da-biet", label: "Từ bạn đã biết sẵn", description: "Từ trùng nghĩa với tiếng Việt nhờ âm Hán Việt", icon: "heart" },
      { href: "/kiem-tra-trinh-do", label: "Kiểm tra trình độ", description: "Vài phút biết nên học HSK cấp mấy", icon: "chart" },
    ],
  },
];

const PRACTICE_LINKS = PRACTICE_SECTIONS.flatMap((s) => s.items);

/** Trang không có trong menu nhưng vẫn cần đúng tên ở thanh vị trí (trước đó hiện
 * "Góc học tập › Góc học tập"). */
const OTHER_PAGES = [
  { href: "/settings", label: "Cài đặt" },
  { href: "/achievements", label: "Huy hiệu" },
  { href: "/u", label: "Hồ sơ" },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Mục menu đang sáng: trang công cụ trong `/luyen-tap` thì sáng mục "Luyện tập" — trừ công cụ nằm
 * dưới một mục khác (`/tu-dien/quet` thuộc "Từ điển"), để không sáng 2 mục cùng lúc. */
export function isNavActive(pathname: string, href: string) {
  if (href === "/luyen-tap")
    return (
      isActive(pathname, href) ||
      (PRACTICE_LINKS.some((l) => isActive(pathname, l.href)) &&
        !NAV_MAIN.some((m) => m.href !== href && isActive(pathname, m.href)))
    );
  return isActive(pathname, href);
}

/** Tên trang cho thanh trên (app-shell) — khớp đường dẫn dài nhất (`/tu-dien/quet` trước `/tu-dien`). */
export function pageLabel(pathname: string) {
  return (
    [...NAV_MAIN, ...NAV_MORE, ACCOUNT_LINK, INSTALL_LINK, ...PRACTICE_LINKS, ...OTHER_PAGES]
      .filter((l) => isActive(pathname, l.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label ?? "Góc học tập"
  );
}
