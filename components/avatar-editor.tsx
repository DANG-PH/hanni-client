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
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const avatarUnavailable = !!user.avatarUrl && failedAvatar === user.avatarUrl && !preview;

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
      // API → POST /users/me/avatar · server: modules/users/users.controller.ts → UsersService.setAvatarFile()
      await api.upload("/users/me/avatar", fd);
      await Promise.resolve(onChange());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Tải ảnh thất bại");
    } finally {
      setPreview(null);
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
      // API → DELETE /users/me/avatar · server: modules/users/users.controller.ts → UsersService.clearAvatar()
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
        className="group grid shrink-0 justify-items-center gap-2 rounded-xl text-xs font-semibold text-primary disabled:opacity-70"
      >
        <span
          className="block overflow-hidden rounded-full ring-2 ring-border transition group-hover:ring-primary/40"
          style={{ width: size, height: size }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Avatar user={user} size={size} onImageError={() => setFailedAvatar(user.avatarUrl ?? null)} />
          )}
        </span>
        <span>{busy ? "Đang tải…" : "Đổi ảnh"}</span>
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
      {error ? (
        <p className="max-w-24 text-center text-xs text-danger" role="status">{error}</p>
      ) : avatarUnavailable && (
        <p className="max-w-24 text-center text-xs text-muted">Ảnh chưa tải được</p>
      )}
    </div>
  );
}
