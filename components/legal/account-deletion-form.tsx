"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { Button, ErrorNote } from "@/components/ui";
import { api } from "@/lib/api";

/**
 * Yêu cầu xoá tài khoản cho người không đăng nhập được (quên mật khẩu, mất máy…) → `POST /reports` loại
 * `account-deletion`, lưu DB, admin xoá tay. CH Play bắt trang web phải nhận được yêu cầu xoá mà không cần mở app.
 * Ô `website` ẩn để bẫy bot.
 */
export function AccountDeletionForm() {
  const [form, setForm] = useState({ contact: "", note: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("sending");
    setError(null);
    try {
      // API → POST /reports · server: modules/reports/reports.controller.ts → ReportsService.create()
      await api.post("/reports", { kind: "account-deletion", reason: "account-deletion", ...form });
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa gửi được, thử lại sau ít phút nhé.");
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="flex items-start gap-3 rounded-xl bg-good/10 p-5 text-sm leading-6">
        <Icon name="check" size={20} className="mt-0.5 shrink-0 text-good" />
        <p>
          <b>Đã nhận yêu cầu xoá tài khoản {form.contact}.</b> Hanni xoá tài khoản và dữ liệu đi kèm trong vòng 7 ngày.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-xs font-medium text-muted">
        Email của tài khoản cần xoá
        <input
          required
          type="email"
          maxLength={200}
          value={form.contact}
          onChange={set("contact")}
          className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
        />
      </label>
      <label className="text-xs font-medium text-muted">
        Ghi chú (không bắt buộc)
        <textarea
          maxLength={1000}
          rows={3}
          value={form.note}
          onChange={set("note")}
          className="field mt-1 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
        />
      </label>
      {/* Bẫy bot: người dùng thật không thấy ô này. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden="true" />
      {error && <ErrorNote>{error}</ErrorNote>}
      <div>
        <Button type="submit" variant="danger" disabled={state === "sending"}>
          {state === "sending" ? "Đang gửi…" : "Gửi yêu cầu xoá"}
        </Button>
      </div>
    </form>
  );
}
