"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Button, Card, ErrorNote } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { buyFrame, equipFrame, useFrameShop } from "@/lib/shop";
import type { AvatarFrame } from "@/lib/types";

/**
 * Cửa hàng khung avatar ở `/account` — sink xu THỨ HAI sau lá chắn streak,
 * thuần trang trí (không ảnh hưởng học tập/xếp hạng). Xem lý do không dùng
 * cơ chế rương/random reward ở `hanni-server/CLAUDE.md` mục "Cửa hàng
 * trang trí". Khung đang dùng hiện luôn trên hồ sơ công khai `/u/[id]`.
 */
export function FrameShop() {
  const { user } = useAuth();
  const { data, mutate, isLoading } = useFrameShop();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleBuy(frame: AvatarFrame) {
    if (busyKey) return;
    setBusyKey(frame.key);
    setError("");
    try {
      await buyFrame(frame.key);
      await mutate();
    } catch {
      setError("Chưa mở khoá được khung này. Kiểm tra lại số dư rồi thử lại.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleEquip(key: string | null) {
    if (busyKey) return;
    setBusyKey(key ?? "none");
    setError("");
    try {
      await equipFrame(key);
      await mutate();
    } catch {
      setError("Chưa đổi được khung. Thử lại sau nhé.");
    } finally {
      setBusyKey(null);
    }
  }

  if (isLoading || !user) return null;

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="icon-tile bg-lavender/10 text-lavender">
          <Icon name="spark" />
        </span>
        <div>
          <h2 className="font-semibold">Cửa hàng trang trí</h2>
          <p className="mt-1 text-sm text-muted">
            Mở khoá khung avatar bằng xu — hiện trên hồ sơ công khai của bạn.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data?.frames.map((frame) => {
          const busy = busyKey === frame.key || busyKey === "none";
          return (
            <div
              key={frame.key}
              className="flex items-center gap-3 rounded-2xl border border-border p-3"
            >
              <Avatar user={user} size={44} frameColors={frame.colors} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{frame.name}</p>
                {frame.equipped ? (
                  <p className="text-xs font-medium text-good">Đang dùng</p>
                ) : frame.owned ? (
                  <p className="text-xs text-muted">Đã sở hữu</p>
                ) : frame.premiumOnly ? (
                  <p className="text-xs font-medium text-accent">
                    Chỉ dành cho Premium
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-xs font-medium text-accent">
                    <Icon name="spark" size={12} />
                    {frame.price.toLocaleString("vi-VN")} xu
                  </p>
                )}
              </div>
              {frame.equipped ? (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void handleEquip(null)}
                >
                  Bỏ khung
                </Button>
              ) : frame.owned ? (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleEquip(frame.key)}
                >
                  Dùng
                </Button>
              ) : frame.premiumOnly ? null : (
                <Button
                  variant="secondary"
                  disabled={busy || (data?.balance ?? 0) < frame.price}
                  onClick={() => void handleBuy(frame)}
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
    </Card>
  );
}
