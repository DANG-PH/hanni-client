"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { addWordToSrs, suspendWord } from "@/lib/hooks";
import { Icon } from "./icon";
import { Button, LinkButton } from "./ui";

/**
 * Nút "Lưu để ôn tập" trên trang từ điển công khai — đây là chỗ NỐI tra cứu
 * vào hệ thống học: tra xong một từ thì đưa thẳng vào hàng đợi SRS, không
 * phải nhớ rồi tự đi tìm lại ở `/study`. Dùng lại đúng `addWordToSrs()` mà
 * bản chép video đã dùng, không dựng luồng riêng.
 *
 * Client component NHỎ cố tình nhúng trong trang Server Component: phần nội
 * dung từ vẫn nằm sẵn trong HTML cho Google, chỉ riêng hành động cá nhân này
 * mới cần JS. Khách chưa đăng nhập thấy lời mời tạo tài khoản thay vì nút.
 */
export function SaveWordButton({
  wordId,
  simplified,
}: {
  wordId: string;
  simplified: string;
}) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<
    "idle" | "saving" | "saved" | "hiding" | "hidden" | "error"
  >("idle");

  if (loading) return null;

  if (!user) {
    return (
      <LinkButton href="/register" variant="secondary">
        <Icon name="plus" size={16} />
        Tạo tài khoản để lưu từ này
      </LinkButton>
    );
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-good">
        <Icon name="check" size={16} />
        Đã thêm vào danh sách ôn tập
      </span>
    );
  }

  if (state === "hidden") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-good">
        <Icon name="check" size={16} />
        Đã ẩn khỏi lượt ôn — bỏ ẩn được ở trang Tiến độ
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        disabled={state === "saving"}
        onClick={() => {
          setState("saving");
          addWordToSrs(wordId)
            .then(() => setState("saved"))
            .catch(() => setState("error"));
        }}
      >
        <Icon name="cards" size={16} />
        {state === "saving" ? "Đang lưu…" : "Lưu để ôn tập"}
      </Button>
      {/* Tra từ điển là lúc hay gặp từ mình đã biết sẵn (rất phổ biến với
       * người Việt nhờ âm Hán Việt). Cho đánh dấu ngay tại đây thay vì phải
       * đợi gặp lại nó trong lượt ôn rồi mới ẩn được. */}
      <Button
        variant="ghost"
        disabled={state === "hiding"}
        onClick={() => {
          setState("hiding");
          suspendWord(wordId, true)
            .then(() => setState("hidden"))
            .catch(() => setState("error"));
        }}
      >
        <Icon name="check" size={16} />
        {state === "hiding" ? "Đang ẩn…" : "Tôi đã biết từ này"}
      </Button>
      {state === "error" && (
        <span className="text-sm text-muted">
          Chưa lưu được {simplified}. Thử lại sau nhé.
        </span>
      )}
    </div>
  );
}
