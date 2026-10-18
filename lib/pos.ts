/** Nhãn tiếng Việt cho từ loại (enum `WordPos` của server) — trang từ điển trước đó
 * hiện thẳng mã tiếng Anh ("VERB · PREPOSITION"). */
export const POS_VI: Record<string, string> = {
  NOUN: "Danh từ",
  VERB: "Động từ",
  ADJECTIVE: "Tính từ",
  ADVERB: "Phó từ",
  PRONOUN: "Đại từ",
  NUMERAL: "Số từ",
  MEASURE: "Lượng từ",
  CONJUNCTION: "Liên từ",
  PREPOSITION: "Giới từ",
  PARTICLE: "Trợ từ",
  INTERJECTION: "Thán từ",
  IDIOM: "Thành ngữ",
  PHRASE: "Cụm từ",
  OTHER: "Khác",
};

/** Cấp có từ vựng — dữ liệu gộp HSK 7–9 thành cấp 7 (chip HSK 8, 9 luôn trống). */
export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
export const hskLabel = (level: number) => `HSK ${level >= 7 ? "7–9" : level}`;
