import type {
  MockAnswer,
  MockExamMeta,
  MockItem,
  MockPaper,
  MockPart,
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
    label: "Nghe, đối chiếu tranh",
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
  "reading:judge-text": {
    label: "Đọc đoạn, xét câu ★",
    tip: "Câu ★ thường chỉ khác đoạn văn ở 1 chi tiết (giờ, số, người, nơi chốn) — đối chiếu từng chi tiết, đừng đoán theo cảm giác.",
    href: "/study",
    cta: "Ôn từ vựng",
  },
  "reading:fill-blank": {
    label: "Điền từ vào chỗ trống",
    tip: "Xác định chỗ trống cần loại từ gì (danh từ, động từ, lượng từ) trước khi chọn.",
    href: "/ngu-phap",
    cta: "Xem ngữ pháp",
  },
  "listening:judge-text": {
    label: "Nghe đoạn văn, xét câu ★",
    tip: "Đọc câu ★ TRƯỚC khi nghe để biết cần bắt chi tiết nào (giờ, nơi, ai, làm gì) — câu ★ hay chỉ đổi đúng 1 chi tiết so với lời nghe.",
    href: "/listening",
    cta: "Luyện nghe",
  },
  "reading:choose-text": {
    label: "Đọc đoạn văn, trả lời câu hỏi",
    tip: "Đọc câu hỏi ★ trước rồi mới tìm trong đoạn văn — đáp án đúng thường nói lại ý của đoạn bằng từ khác, ít khi chép nguyên văn.",
    href: "/study",
    cta: "Ôn từ vựng",
  },
  "writing:order": {
    label: "Sắp xếp từ thành câu",
    tip: "Tìm chủ ngữ + động từ chính trước; thời gian, nơi chốn đứng TRƯỚC động từ, kết quả/bổ ngữ đứng SAU; 把/被 đi ngay trước động từ chính.",
    href: "/ngu-phap",
    cta: "Xem ngữ pháp",
  },
  "reading:order": {
    label: "Sắp xếp 3 câu thành đoạn văn",
    tip: "Câu mở đầu thường nêu chủ ngữ/nhân vật và không bắt đầu bằng 但是, 所以, 然后, 结果; các từ nối đó báo câu đứng sau.",
    href: "/ngu-phap",
    cta: "Xem ngữ pháp",
  },
  "writing:write-sentence": {
    label: "Nhìn tranh, dùng từ đặt câu",
    tip: "Câu đơn giản mà đúng là đủ: chủ ngữ + (thời gian, nơi chốn) + động từ + tân ngữ, có từ cho sẵn và dấu câu. Câu dài dễ sai ngữ pháp.",
    href: "/tu-dien",
    cta: "Tra từ, xem câu ví dụ",
  },
  "writing:pinyin-char": {
    label: "Viết chữ theo pinyin",
    tip: "Chữ đồng âm rất nhiều — nhớ chữ theo TỪ (出租车, 终于) chứ đừng nhớ rời; âm Hán Việt giúp phân biệt: 出 xuất, 初 sơ, 除 trừ.",
    href: "/writing",
    cta: "Luyện viết chữ",
  },
};

export const SECTION_SHORT: Record<MockSectionKind, string> = { listening: "Nghe", reading: "Đọc", writing: "Viết" };
const SECTION_SLUG: Record<MockSectionKind, string> = { listening: "nghe", reading: "doc", writing: "viet" };

/** Trang "luyện từng dạng bài" của 1 phần đề (cùng slug với server). */
export function practiceHref(level: number, section: MockSectionKind, part: number): string {
  return `/thi-thu-hsk/dang-bai/hsk${level}-${SECTION_SLUG[section]}-${part}`;
}

/** Câu hỏi soạn sẵn gửi trợ lý AI cho 1 câu đã chữa (màn kết quả đề + luyện
 * từng dạng): nội dung câu, đáp án đúng và đáp án mình chọn — trợ lý trả lời
 * đúng chỗ vướng, khỏi phải hỏi lại. */
export function assistantPrompt({
  title,
  section,
  officialPart,
  part,
  item,
  review,
  picked,
}: {
  title: string;
  section: MockSectionKind;
  /** Phần đề chính thức (1-based). */
  officialPart: number;
  part: MockPart;
  item: MockItem;
  review: MockReviewItem;
  picked: MockAnswer | null;
}): string {
  const describe = (v: MockAnswer | null) => {
    if (v === null) return "bỏ trống";
    if (typeof v === "string") return `"${v}"`;
    if (typeof v === "boolean")
      return part.type === "judge"
        ? v
          ? "✓ (khớp với tranh)"
          : "✗ (không khớp tranh)"
        : v
          ? "✓ (câu ★ đúng)"
          : "✗ (câu ★ sai)";
    if (item.choices) return `chữ ${item.choices[v]}`;
    const option = item.options?.[v] ?? part.options?.[v];
    const picture = review.pictureLabels?.[v];
    return `${String.fromCharCode(65 + v)}${option ? ` (${option.zh})` : picture ? ` (tranh: ${picture})` : ""}`;
  };
  const sentence = review.transcript?.length
    ? `Lời thoại: ${review.transcript.map((l) => l.zh).join(" ")}`
    : item.pieces
      ? `Các từ cần sắp xếp: ${item.pieces.map((x) => x.zh).join(" / ")}`
      : item.blank
        ? `Câu: ${item.blank.before.zh}（${item.pinyin ?? " "}）${item.blank.after.zh}`
        : item.text
          ? `Đoạn: ${item.text.zh}`
          : "";
  const star = item.statement ?? item.question;
  return [
    `Giải thích giúp mình câu ${item.no} — ${title}, phần ${SECTION_SHORT[section]} ${officialPart} (${partInfo(section, part.type).label}).`,
    sentence.slice(0, 400),
    star ? `★ ${star.zh}` : "",
    part.type === "judge" && review.pictureLabels?.[0] ? `Tranh: ${review.pictureLabels[0]}.` : "",
    `Đáp án đúng: ${describe(review.answer)}. Mình chọn: ${describe(picked)}.`,
    "Vì sao đáp án đúng là vậy, dựa vào từ khoá nào? Ngắn gọn thôi nhé.",
  ]
    .filter(Boolean)
    .join("\n");
}

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

/** Thứ tự phần đề CHÍNH THỨC (0-based) của từng phần dữ liệu — nửa sau
 * `continues` (HSK 2 câu 16–20) chung số với nửa trước. */
export function officialIndexes(parts: MockPaper["sections"][number]["parts"]): number[] {
  let n = -1;
  return parts.map((p) => (p.continues ? Math.max(n, 0) : ++n));
}

/** Số câu đúng từng phần (theo phần đề chính thức) của 1 lượt làm. */
export function partScores(paper: MockPaper, review: Map<number, MockReviewItem>): PartScore[] {
  return paper.sections.flatMap((s) => {
    const official = officialIndexes(s.parts);
    const out: PartScore[] = [];
    s.parts.forEach((p, i) => {
      const correct = p.items.filter((it) => review.get(it.no)?.correct).length;
      const last = out[out.length - 1];
      if (p.continues && last) {
        last.correct += correct;
        last.total += p.items.length;
      } else
        out.push({ section: s.kind, part: official[i] + 1, type: p.type, correct, total: p.items.length });
    });
    return out;
  });
}

/** Bỏ dấu câu + khoảng trắng — câu sắp xếp chỉ chấm thứ tự từ (giống server). */
export const normalizeSentence = (s: string) => s.replace(/[\s\p{P}]/gu, "");

/** Đáp án `v` có đúng với câu đã chữa `r` không — dùng khi luyện lại câu sai
 * (chấm ngay trên máy). Câu sắp xếp nhận cả các thứ tự khác cũng đúng. */
export function isRightAnswer(r: Pick<MockReviewItem, "answer" | "alternatives">, v: MockAnswer | null): boolean {
  if (v === null) return false;
  if (typeof r.answer === "string")
    return (
      typeof v === "string" &&
      [r.answer, ...(r.alternatives ?? [])].some((a) => normalizeSentence(a) === normalizeSentence(v))
    );
  return v === r.answer;
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
