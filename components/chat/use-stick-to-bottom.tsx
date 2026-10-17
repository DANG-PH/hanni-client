"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Icon } from "@/components/icon";

/** Cách đáy ít hơn ngần này (px) vẫn coi là "đang ở tin mới nhất". */
const NEAR_BOTTOM = 80;

/**
 * Cuộn khung chat như app chat phổ biến: đang ở cuối thì tự cuộn theo tin mới;
 * đang đọc tin cũ thì KHÔNG kéo tuột xuống mà đếm số tin mới để hiện nút
 * "Xuống tin mới". Tin do chính mình gửi luôn kéo xuống.
 *
 * - `lastItemKey`: đổi khi có tin MỚI ở cuối (id tin cuối) — tải thêm tin cũ ở
 *   trên không đổi giá trị này nên không làm giật khung.
 * - `contentKey`: đổi khi tin cuối dài thêm (AI đang trả lời từng đoạn) — chỉ
 *   bám theo nếu đang ở cuối, không tính là tin mới.
 */
export function useStickToBottom(
  ref: RefObject<HTMLElement | null>,
  { lastItemKey, lastIsMine = false, contentKey }: { lastItemKey: unknown; lastIsMine?: boolean; contentKey?: unknown },
) {
  const [atBottom, setAtBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const atBottomRef = useRef(true);
  const firstKey = useRef(true);

  const scrollToBottom = useCallback(
    (smooth = false) => {
      const el = ref.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
      atBottomRef.current = true;
      setAtBottom(true);
      setUnseen(0);
    },
    [ref],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
      atBottomRef.current = near;
      setAtBottom(near);
      if (near) setUnseen(0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref]);

  useEffect(() => {
    if (lastItemKey === undefined || lastItemKey === null) return;
    // Lần đầu có dữ liệu (mở hội thoại): luôn xuống tin mới nhất.
    if (firstKey.current || lastIsMine || atBottomRef.current) {
      firstKey.current = false;
      requestAnimationFrame(() => scrollToBottom(false));
    } else {
      setUnseen((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi có tin mới
  }, [lastItemKey]);

  useEffect(() => {
    if (contentKey === undefined || !atBottomRef.current) return;
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [contentKey, ref]);

  return { atBottom, unseen, scrollToBottom };
}

/** Nút nổi ở đáy khung chat khi đang đọc tin cũ (kèm số tin mới chưa xem). */
export function JumpToLatest({ unseen, onClick }: { unseen: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg hover:border-primary/40"
    >
      <Icon name="arrow" size={14} className="rotate-90 text-primary" />
      Xuống tin mới
      {unseen > 0 && (
        <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-primary-fg">
          {unseen > 99 ? "99+" : unseen}
        </span>
      )}
    </button>
  );
}
