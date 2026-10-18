"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { generateMnemonic } from "@/lib/ai-tools";

/** Mẹo nhớ theo âm Hán Việt do AI viết — đã có thì hiện luôn (ai cũng xem được), chưa có
 * thì người đã đăng nhập bấm tạo; tạo 1 lần là lưu lại cho mọi người. */
export function WordMnemonic({ wordId, initial }: { wordId: string; initial: string | null }) {
  const { user, loading } = useAuth();
  const path = usePathname();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await generateMnemonic(wordId);
      setText(res.mnemonicVi);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa tạo được mẹo nhớ, thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  if (text)
    return (
      <div className="rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-accent">
          <Icon name="spark" size={14} /> Mẹo nhớ
        </p>
        <p className="mt-1 text-sm leading-6">{text}</p>
        <p className="mt-1 text-[11px] text-muted">AI gợi ý từ âm Hán Việt và nghĩa từng chữ.</p>
      </div>
    );

  if (loading) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {user ? (
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 px-3.5 text-sm font-semibold text-accent hover:bg-accent/10 disabled:opacity-60"
        >
          <Icon name="spark" size={16} />
          {busy ? "AI đang nghĩ mẹo nhớ…" : "Tạo mẹo nhớ bằng AI"}
        </button>
      ) : (
        <a
          href={`/login?next=${encodeURIComponent(path)}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 px-3.5 text-sm font-semibold text-accent hover:bg-accent/10"
        >
          <Icon name="spark" size={16} /> Đăng nhập để tạo mẹo nhớ bằng AI
        </a>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
