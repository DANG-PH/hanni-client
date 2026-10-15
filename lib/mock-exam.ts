import type {
  MockAnswer,
  MockExamMeta,
  MockPaper,
  MockPartType,
  MockReviewItem,
  MockSectionKind,
} from "./types";

export const SECTION_VI: Record<MockSectionKind, { zh: string; vi: string }> = {
  listening: { zh: "听力", vi: "Nghe hiểu" },
  reading: { zh: "阅读", vi: "Đọc hiểu" },
  writing: { zh: "书写", vi: "Viết" },
};

interface PartInfo {
  label: string;
  /** Mẹo khi làm sai nhiều ở dạng này. */
  tip: string;
  /** Chỗ luyện thêm đúng kỹ năng đó trong Hanni. */
  href: string;
  cta: string;
}

/** Dạng câu theo phần thi — tên ngắn để phân tích điểm mạnh/yếu (như "Nhận
 * xét kết quả" của Migii HSK, "Phân tích điểm mạnh, yếu" của Hanbeego), kèm
 * mẹo và chỗ luyện tiếp — sai ở đâu thì có ngay việc cụ thể để làm. */
const PART_INFO: Record<string, PartInfo> = {
  "listening:judge": {
    label: "Nghe từ, đối chiếu tranh",
    tip: "Nghe cho ra từ khoá (đồ vật, hành động) rồi mới so với tranh — đừng chọn theo âm nghe na ná.",
    href: "/listening",
    cta: "Luyện nghe",
  },
  "listening:choose-picture": {
    label: "Nghe câu, chọn tranh",
    tip: "Trước khi nghe, nhìn 3 tranh và nghĩ sẵn từ tiếng Trung của từng tranh.",
    href: "/listening",
    cta: "Luyện nghe",
  },
  "listening:match-picture": {
    label: "Nghe hội thoại, ghép tranh",
    tip: "Từ khoá hay nằm ở câu đáp của người thứ hai — nghe hết rồi mới chọn, loại dần tranh đã dùng.",
    href: "/listening",
    cta: "Luyện nghe",
  },
  "listening:choose-text": {
    label: "Nghe câu hỏi, chọn đáp án",
    tip: "Đọc trước 3 đáp án để biết cần nghe số, giờ, nơi chốn hay người.",
    href: "/listening",
    cta: "Luyện nghe",
  },
  "reading:judge": {
    label: "Đọc từ, đối chiếu tranh",
    tip: "Sai phần này thường do chưa thuộc mặt chữ — ôn lại từ vựng, nhớ nghĩa qua âm Hán Việt.",
    href: "/study",
    cta: "Ôn từ vựng",
  },
  "reading:match-picture": {
    label: "Đọc câu, ghép tranh",
    tip: "Tìm động từ/danh từ chính của câu rồi khớp với tranh, bỏ qua phần còn lại.",
    href: "/study",
    cta: "Ôn từ vựng",
  },
  "reading:match-text": {
    label: "Ghép câu hỏi – câu trả lời",
    tip: "Nhìn từ để hỏi: 几/多少 → số, 哪儿 → nơi chốn, 谁 → người, 什么时候 → thời gian.",
    href: "/ngu-phap",
    cta: "Xem ngữ pháp",
  },
  "reading:fill-blank": {
    label: "Điền từ vào chỗ trống",
    tip: "Xác định chỗ trống cần loại từ gì (danh từ, động từ, lượng từ) trước khi chọn.",
    href: "/ngu-phap",
    cta: "Xem ngữ pháp",
  },
};

export function partInfo(section: MockSectionKind, type: MockPartType): PartInfo {
  return (
    PART_INFO[`${section}:${type}`] ?? {
      label: SECTION_VI[section].vi,
      tip: "",
      href: "/luyen-tap",
      cta: "Luyện tập",
    }
  );
}

export interface PartScore {
  section: MockSectionKind;
  /** Phần thứ mấy trong phần thi (1-based). */
  part: number;
  type: MockPartType;
  correct: number;
  total: number;
}

/** Số câu đúng từng phần của 1 lượt làm. */
export function partScores(paper: MockPaper, review: Map<number, MockReviewItem>): PartScore[] {
  return paper.sections.flatMap((s) =>
    s.parts.map((p, i) => ({
      section: s.kind,
      part: i + 1,
      type: p.type,
      correct: p.items.filter((it) => review.get(it.no)?.correct).length,
      total: p.items.length,
    })),
  );
}

/** Các phần yếu nhất (dưới 80% câu đúng), yếu trước. */
export function weakest<T extends { correct: number; total: number }>(parts: T[], n = 2): T[] {
  return parts
    .filter((p) => p.total > 0 && p.correct / p.total < 0.8)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, n);
}

/** Bài làm dở lưu trên máy — người làm thoát ra rồi quay lại vẫn làm tiếp được. */
const SAVED_KEY = (slug: string) => `hanni:mock-exam:${slug}`;

export interface SavedExam {
  answers: (MockAnswer | null)[];
  flags: number[];
  startedAt: number;
}

export function readSaved(slug: string, durationMin: number): SavedExam | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVED_KEY(slug)) ?? "null") as SavedExam | null;
    // Quá giờ làm bài thì bài dở đó coi như bỏ — không cho "làm tiếp" vô hạn.
    if (!s || Date.now() - s.startedAt > durationMin * 60_000) return null;
    return s;
  } catch {
    return null;
  }
}

export function writeSaved(slug: string, saved: SavedExam) {
  try {
    localStorage.setItem(SAVED_KEY(slug), JSON.stringify(saved));
  } catch {
    /* bỏ qua — chỉ mất khả năng làm tiếp */
  }
}

export function clearSaved(slug: string) {
  try {
    localStorage.removeItem(SAVED_KEY(slug));
  } catch {
    /* bỏ qua */
  }
}

/** Tóm tắt các bài đang làm dở thành 1 chuỗi ("slug:đã làm:phút còn lại|…")
 * — `useSyncExternalStore` cần giá trị so sánh được bằng `===`. */
export function savedSnapshot(exams: MockExamMeta[]): string {
  return exams
    .map((e) => {
      const s = readSaved(e.slug, e.durationMin);
      if (!s) return "";
      const answered = s.answers.filter((a) => a !== null && a !== undefined).length;
      const left = Math.max(1, Math.ceil((e.durationMin * 60_000 - (Date.now() - s.startedAt)) / 60_000));
      return `${e.slug}:${answered}:${left}`;
    })
    .filter(Boolean)
    .join("|");
}

export function parseSnapshot(snapshot: string): Map<string, { answered: number; minutesLeft: number }> {
  return new Map(
    snapshot
      .split("|")
      .filter(Boolean)
      .map((row) => {
        const [slug, answered, left] = row.split(":");
        return [slug, { answered: Number(answered), minutesLeft: Number(left) }] as const;
      }),
  );
}
