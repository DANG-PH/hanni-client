"use client";

import { useState } from "react";
import { mutate } from "swr";
import { Icon } from "@/components/icon";
import { api } from "@/lib/api";
import { useLevels } from "@/lib/hooks";

/** Đổi cấp HSK của lộ trình chính — LƯU ở server (`courseLevel`) chứ không
 * chỉ đổi khung nhìn: trước đây mỗi trang tự đoán cấp, người muốn học HSK1
 * vẫn bị flashcard đưa sang HSK4 (lỗi thật user báo). */
export function LevelPicker({
  current,
  levels,
}: {
  current: number;
  levels: number[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const info = useLevels();
  const nameOf = (lvl: number) =>
    lvl === 7 ? "Cao cấp" : (info.data?.find((l) => l.level === lvl)?.nameVi ?? "");

  async function choose(lvl: number) {
    if (lvl === current) return setOpen(false);
    setSaving(lvl);
    try {
      await api.patch("/users/me/settings", { courseLevel: lvl });
      await mutate(
        (key) => typeof key === "string" && (key.startsWith("/learn") || key.startsWith("/users/me/settings")),
      );
      setOpen(false);
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="motion-button inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold hover:border-primary/40"
      >
        HSK {current === 7 ? "7–9" : current}
        <span className="font-normal text-muted">{nameOf(current)}</span>
        <Icon name="chevron" size={14} className="rotate-90 text-muted" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Chọn cấp HSK"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Bạn muốn học cấp nào?</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              Lộ trình, bài học và ôn tập sẽ theo đúng cấp bạn chọn. Đổi lại lúc nào cũng được.
            </p>
            <ul className="mt-4 grid gap-2">
              {levels.map((lvl) => (
                <li key={lvl}>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => void choose(lvl)}
                    className={`motion-button flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
                      lvl === current
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {lvl === 7 ? "7–9" : lvl}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        HSK {lvl === 7 ? "7–9" : lvl} · {nameOf(lvl)}
                      </span>
                      <span className="block text-xs text-muted">
                        {lvl === 1
                          ? "Mới bắt đầu — chưa biết tiếng Trung"
                          : lvl <= 3
                            ? "Đã biết giao tiếp cơ bản"
                            : lvl <= 6
                              ? "Trung cấp — đọc, viết đoạn văn"
                              : "Cao cấp — học thuật, chuyên môn"}
                      </span>
                    </span>
                    {saving === lvl ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                    ) : lvl === current ? (
                      <Icon name="check" size={18} className="text-primary" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
