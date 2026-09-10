"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { api, ApiError } from "@/lib/api";
import { resizeImage } from "@/lib/image";
import type { Me } from "@/lib/types";

/**
 * Avatar bấm được để đổi ảnh: click -> chọn tệp -> nén 512px -> upload.
 * Dùng chung cho trang Tài khoản và Cài đặt.
 */
export function AvatarEditor({
  user,
  size = 80,
  onChange,
}: {
  user: Pick<Me, "id" | "displayName" | "email" | "avatarUrl">;
  size?: number;
  onChange: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function pick(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp ảnh.");
      return;
    }
    setError(null);
    setBusy(true);
    const local = URL.createObjectURL(file);
    setPreview(local);
    try {
      const blob = await resizeImage(file, 512);
      const fd = new FormData();
      fd.append("file", blob, "avatar.webp");
      await api.upload("/users/me/avatar", fd);
      await Promise.resolve(onChange());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tải ảnh thất bại");
      setPreview(null);
    } finally {
      setBusy(false);
      URL.revokeObjectURL(local);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      await api.del("/users/me/avatar");
      await Promise.resolve(onChange());
    } catch {
      setError("Không xoá được ảnh");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Đổi ảnh đại diện"
        className="group relative shrink-0 overflow-hidden rounded-full ring-2 ring-border transition hover:ring-primary/40 disabled:opacity-70"
        style={{ width: size, height: size }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <Avatar user={user} size={size} />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
          {busy ? "Đang tải…" : "Đổi ảnh"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
        }}
      />
      {user.avatarUrl && !busy && (
        <button
          type="button"
          onClick={() => void remove()}
          className="text-xs text-muted hover:text-danger"
        >
          Xoá ảnh
        </button>
      )}
      {error && <p className="max-w-[10rem] text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
