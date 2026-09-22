"use client";

import { Fragment, useState } from "react";
import { Icon } from "@/components/icon";
import { Button, Card, ErrorNote } from "@/components/ui";
import { buyTitle, equipTitle, useTitleShop } from "@/lib/shop";
import type { Title } from "@/lib/types";

/**
 * Cửa hàng danh hiệu ở `/account` — sink xu THỨ BA (sau lá chắn streak +
 * khung avatar), hiện dạng chữ cạnh tên trên hồ sơ công khai. Cùng nguyên
 * tắc với `FrameShop`: mua đứt bằng xu, không dùng cơ chế rương/random.
 */
export function TitleShop({ bare = false }: { bare?: boolean } = {}) {
  // `bare`: nhúng vào thẻ "Ví & cửa hàng" gộp (không tự dựng Card/tiêu đề
  // riêng nữa) — xem components/cosmetic-shop.tsx.
  const Wrapper = bare ? Fragment : Card;
  const { data, mutate, isLoading } = useTitleShop();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(title: Title) {
    if (busyKey) return;
    setBusyKey(title.key);
    setError("");
    try {
      await buyTitle(title.key);
      await mutate();
    } catch {
      setError(
        "Chưa mở khoá được danh hiệu này. Kiểm tra lại số dư rồi thử lại.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleEquip(key: string | null) {
    if (busyKey) return;
    setBusyKey(key ?? "none");
    setError("");
    try {
      await equipTitle(key);
      await mutate();
    } catch {
      setError("Chưa đổi được danh hiệu. Thử lại sau nhé.");
    } finally {
      setBusyKey(null);
    }
  }

  if (isLoading) return null;

  return (
    <Wrapper>
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.titles.map((title) => {
          const busy = busyKey === title.key || busyKey === "none";
          return (
            <div
              key={title.key}
              className="flex items-center gap-3 rounded-2xl border border-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{title.label}</p>
                {title.equipped ? (
                  <p className="text-xs font-medium text-good">Đang dùng</p>
                ) : title.owned ? (
                  <p className="text-xs text-muted">Đã sở hữu</p>
                ) : (
                  <p className="flex items-center gap-1 text-xs font-medium text-accent">
                    <Icon name="spark" size={12} />
                    {title.price.toLocaleString("vi-VN")} xu
                  </p>
                )}
              </div>
              {title.equipped ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void handleEquip(null)}
                >
                  Bỏ dùng
                </Button>
              ) : title.owned ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleEquip(title.key)}
                >
                  Dùng
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled={busy || (data?.balance ?? 0) < title.price}
                  onClick={() => void handleBuy(title)}
                >
                  {busy ? "Đang mở…" : "Mở khoá"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </Wrapper>
  );
}
