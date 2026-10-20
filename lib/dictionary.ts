/** 4 cách tra như Hanzii: từ vựng (mặc định), Hán tự (từng chữ: bộ thủ, số nét, từ chứa chữ),
 * câu ví dụ, ngữ pháp. Giá trị nằm ở `?tab=` của `/tu-dien`. File thường (không "use client") để cả
 * trang Server Component lẫn ô tra phía trình duyệt cùng gọi được `dictHref`. */
export type DictTab = "tu-vung" | "han-tu" | "vi-du" | "ngu-phap";
export const DICT_TABS: { key: DictTab; label: string; placeholder: string }[] = [
  { key: "tu-vung", label: "Từ vựng", placeholder: "你好, nihao, học sinh…" },
  { key: "han-tu", label: "Hán tự", placeholder: "Chữ Hán: 学, 爱, 汉…" },
  { key: "vi-du", label: "Ví dụ", placeholder: "Câu có 学习, “đi học”…" },
  { key: "ngu-phap", label: "Ngữ pháp", placeholder: "把, 了, so sánh…" },
];

export function dictHref(q: string, tab: DictTab = "tu-vung") {
  const p = new URLSearchParams({ q });
  if (tab !== "tu-vung") p.set("tab", tab);
  return `/tu-dien?${p}`;
}
