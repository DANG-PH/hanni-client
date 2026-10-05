import type { IconName } from "@/components/icon";

/** Các công cụ luyện thêm ngoài lộ trình chính — gom vào 1 trang "Khám phá"
 * thay vì mỗi thứ một mục ở menu (16 mục khiến người mới không biết bấm gì
 * trước, user báo "nhiều chức năng nhưng rời rạc"). Dùng chung cho trang
 * `/kham-pha` và nhãn trang ở thanh trên (app-shell). */
export const EXPLORE_ITEMS: {
  href: string;
  label: string;
  description: string;
  icon: IconName;
  group: "Luyện kỹ năng" | "Giải trí" | "Tra cứu";
}[] = [
  { href: "/listening", label: "Luyện nghe", description: "Nghe từ của bài đang học và chọn đúng", icon: "headphones", group: "Luyện kỹ năng" },
  { href: "/pronunciation", label: "Luyện phát âm", description: "Đọc to, Hanni chấm xem bạn nói đúng chưa", icon: "mic", group: "Luyện kỹ năng" },
  { href: "/writing", label: "Luyện viết chữ Hán", description: "Xem thứ tự nét và tự tô từng chữ", icon: "pencil", group: "Luyện kỹ năng" },
  { href: "/roleplay", label: "Luyện nói với AI", description: "Gọi món, hỏi đường, mua sắm — nói như thật", icon: "message", group: "Luyện kỹ năng" },
  { href: "/watch", label: "Học qua video", description: "Phim, phụ đề song ngữ, bấm từ để tra nghĩa", icon: "play", group: "Giải trí" },
  { href: "/minigame", label: "Trò chơi & Đấu 1v1", description: "Dịch tốc độ, ghép cặp, đấu với người khác", icon: "spark", group: "Giải trí" },
  { href: "/tu-dien", label: "Từ điển", description: "Hán tự, pinyin, âm Hán Việt, câu ví dụ", icon: "book", group: "Tra cứu" },
  { href: "/ngu-phap", label: "Ngữ pháp & mẫu câu", description: "235 điểm ngữ pháp giải thích bằng tiếng Việt", icon: "cards", group: "Tra cứu" },
  { href: "/tu-da-biet", label: "Từ bạn đã biết sẵn", description: "Hàng trăm từ trùng nghĩa nhờ âm Hán Việt", icon: "heart", group: "Tra cứu" },
];
