/** 4 cách tra như Hanzii: từ vựng (mặc định), Hán tự (từng chữ: bộ thủ, số nét, từ chứa chữ),
 * câu ví dụ, ngữ pháp. Giá trị nằm ở `?tab=` của `/tu-dien`. File thường (không "use client") để cả
 * trang Server Component lẫn ô tra phía trình duyệt cùng gọi được `dictHref`. */
export type DictTab = "tu-vung" | "han-tu" | "vi-du" | "ngu-phap";
export const DICT_TABS: { key: DictTab; label: string; placeholder: string }[] = [
  { key: "tu-vung", label: "Từ vựng", placeholder: "Hán tự, pinyin, nghĩa hoặc âm Hán Việt…" },
  { key: "han-tu", label: "Hán tự", placeholder: "Nhập chữ Hán để xem bộ thủ, số nét, cách viết…" },
  { key: "vi-du", label: "Ví dụ", placeholder: "Tìm câu ví dụ: 学习, “đi học”…" },
  { key: "ngu-phap", label: "Ngữ pháp", placeholder: "Tìm ngữ pháp: 把, 了, so sánh…" },
];

export function dictHref(q: string, tab: DictTab = "tu-vung") {
  const p = new URLSearchParams({ q });
  if (tab !== "tu-vung") p.set("tab", tab);
  return `/tu-dien?${p}`;
}
