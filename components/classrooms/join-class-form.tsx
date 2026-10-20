"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

/** Ô "Vào lớp bằng mã" — dùng ở `/lop-hoc` và trang Tài khoản (như Duolingo: Cài đặt → nhập mã lớp).
 * Không vào lớp ngay: sang `/lop/[mã]` xem trước lớp + điều giáo viên sẽ thấy rồi mới bấm vào. */
export function JoinClassForm({ id = "class-code" }: { id?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (clean.length !== 6) {
      setError("Mã lớp gồm 6 ký tự (chữ và số) — giáo viên gửi cho bạn.");
      return;
    }
    router.push(`/lop/${clean}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="block text-xs font-medium text-muted" htmlFor={id}>
        Mã lớp
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          maxLength={9}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="vd: HN4K7P"
          className="field h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 font-mono text-sm tracking-widest uppercase"
        />
        <Button type="submit">Vào lớp</Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
