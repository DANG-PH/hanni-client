"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { Icon } from "@/components/icon";

/** Cao tối đa của ô nhập (~5 dòng), quá thì ô tự cuộn bên trong. */
const MAX_HEIGHT = 132;

/**
 * Ô soạn tin dùng chung cho tin nhắn, trợ lý AI và luyện nói AI — theo cách các
 * app chat phổ biến (Messenger, Zalo, Telegram) làm:
 * - Ô tự giãn theo nội dung tới ~5 dòng; Enter gửi, Shift+Enter xuống dòng
 *   (không gửi khi đang gõ dở bằng bộ gõ tiếng Việt/tiếng Trung).
 * - Giới hạn đúng số ký tự server nhận (`maxLength`); bộ đếm hiện khi bắt đầu
 *   gõ, chuyển màu cảnh báo khi gần chạm giới hạn. Trước đó ô nhập không giới
 *   hạn trong khi server chặn ở 1.000–2.000 ký tự, gõ dài là báo lỗi.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  maxLength,
  placeholder,
  disabled = false,
  busy = false,
  before,
  after,
  inputRef,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  placeholder: string;
  /** Khoá cả ô nhập (vd đang dịch). */
  disabled?: boolean;
  /** Đang gửi: vẫn cho gõ tiếp nhưng chưa cho gửi. */
  busy?: boolean;
  /** Nút phụ bên trái / phải ô nhập (gợi ý, dịch…). */
  before?: ReactNode;
  after?: ReactNode;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
}) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? ownRef;
  const counterId = useId();
  const length = value.length;
  const canSend = value.trim().length > 0 && length <= maxLength && !busy && !disabled;
  const tone = length >= maxLength ? "text-danger" : length >= maxLength * 0.9 ? "text-warn" : "text-muted";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, ref]);

  return (
    <form
      className={`border-t border-border bg-surface p-3 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
    >
      <div className="flex items-end gap-2">
        {before}
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSubmit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={length > 0 ? counterId : undefined}
          className="field block min-h-11 min-w-0 flex-1 resize-none py-2.5 leading-6"
        />
        {after}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Gửi"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg transition-opacity disabled:opacity-45"
        >
          <Icon name="arrow" size={18} />
        </button>
      </div>
      {length > 0 && (
        <p id={counterId} aria-live="polite" className={`mt-1.5 text-right text-xs tabular-nums ${tone}`}>
          {length >= maxLength
            ? `Đã tới giới hạn ${maxLength.toLocaleString("vi-VN")} ký tự`
            : `${length.toLocaleString("vi-VN")}/${maxLength.toLocaleString("vi-VN")} ký tự · Shift+Enter để xuống dòng`}
        </p>
      )}
    </form>
  );
}
