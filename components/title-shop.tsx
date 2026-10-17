"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button, ErrorNote } from "@/components/ui";
import { equipTitle, useTitleShop } from "@/lib/shop";

/**
 * Danh hiệu ở trang Huy hiệu — hiện cạnh tên trên hồ sơ công khai và bảng xếp
 * hạng. Mở theo huy hiệu đã đạt (chuỗi ngày, số từ đã thuộc, cấp HSK…), không
 * mua bằng xu: thay cho cửa hàng khung/danh hiệu mua bằng xu (bỏ 2026-10-17, user
 * nhận xét "vô nghĩa với việc học"). Chưa đạt thì ghi rõ cần đạt huy hiệu nào.
 */
export function TitlePicker() {
  const { data, mutate, isLoading } = useTitleShop();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function equip(key: string | null) {
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

  if (isLoading || !data) return null;
  const owned = data.titles.filter((t) => t.owned).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Đã mở <strong className="text-foreground">{owned}</strong>/{data.titles.length} danh hiệu. Chọn 1 danh hiệu
        để hiện cạnh tên bạn trên hồ sơ và bảng xếp hạng.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.titles.map((title) => (
          <div
            key={title.key}
            className={`flex items-center gap-3 rounded-2xl border p-3 ${
              title.equipped ? "border-primary/40 bg-primary/5" : "border-border"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                title.owned ? "bg-accent/10 text-accent" : "bg-surface-2 text-muted"
              }`}
            >
              <Icon name={title.owned ? "trophy" : "lock"} size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${title.owned ? "" : "text-muted"}`}>{title.label}</p>
              <p className="text-xs leading-5 text-muted">
                {title.equipped ? "Đang dùng" : title.owned ? "Đã mở" : `Cần: ${title.requirement}`}
              </p>
            </div>
            {title.owned &&
              (title.equipped ? (
                <Button variant="ghost" className="shrink-0" disabled={!!busyKey} onClick={() => void equip(null)}>
                  Bỏ
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="shrink-0"
                  disabled={!!busyKey}
                  onClick={() => void equip(title.key)}
                >
                  Dùng
                </Button>
              ))}
          </div>
        ))}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}
