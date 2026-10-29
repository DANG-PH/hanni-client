/**
 * Cáo Hanni — 12 biểu cảm, mỗi cái 6 hình vẽ riêng (repo hanni-mascot, bản v11; ảnh ở `public/mascot/`).
 * Mỗi biểu cảm gắn với 1 tình huống, KHÔNG dùng làm hình trang trí (đợt 17/10 user thấy cáo "xuất hiện quá nhiều"
 * khi nó nằm ở vòng tải): cáo phản ứng theo việc người học đang làm.
 * WebP động tự lặp nên không cần JS; máy bật giảm chuyển động thì hiện ảnh tĩnh (`.still.webp`).
 */
export type MascotEmote =
  | "e00-nghi" // trợ lý đang mở, chờ câu hỏi
  | "e01-chao" // lần đầu mở trợ lý, trang chủ khách
  | "e02-suy-nghi" // vừa gửi câu hỏi, AI chưa trả lời
  | "e04-vui-mung" // trả lời đúng, xong bài, thi đạt
  | "e05-co-len" // trả lời sai, thi chưa đạt
  | "e09-lang-nghe" // đang bật micro
  | "e10-doc-mau" // AI đang trả lời
  | "e11-a-ha" // mẹo Hán Việt, mẹo nhớ
  | "e16-doc-sach" // bài đọc
  | "e19-tim-kiem" // đang tìm / không tìm thấy
  | "e39-ghi-chu" // AI đang viết (bài đọc, nhận xét)
  | "e42-cham-chu"; // đang gõ câu hỏi

/** Có bản 512px cho chỗ hiện to (màn xong bài, kết quả thi, trang chủ). */
const LARGE: ReadonlySet<MascotEmote> = new Set(["e01-chao", "e04-vui-mung", "e05-co-len"]);

export function mascotSrc(emote: MascotEmote, size = 96) {
  return `/mascot/${emote}${size > 128 && LARGE.has(emote) ? "@512" : ""}.webp`;
}

/** Tải trước biểu cảm sắp đổi sang (vd đúng/sai trong bài học) để lúc đổi không bị trống. */
export function preloadMascots(emotes: MascotEmote[], size = 96) {
  if (typeof window === "undefined") return;
  for (const emote of emotes) new window.Image().src = mascotSrc(emote, size);
}

export function Mascot({
  emote,
  size = 96,
  alt = "",
  priority = false,
  className = "",
}: {
  emote: MascotEmote;
  size?: number;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <picture className={`block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <source media="(prefers-reduced-motion: reduce)" srcSet={`/mascot/${emote}.still.webp`} />
      {/* <img> thường: next/image không giữ được ảnh động + ảnh tĩnh theo giảm chuyển động. */}
      <img
        src={mascotSrc(emote, size)}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </picture>
  );
}
