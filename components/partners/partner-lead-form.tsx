"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { Button, ErrorNote } from "@/components/ui";
import { api } from "@/lib/api";

const KINDS = [
  ["center", "Trung tâm ngoại ngữ"],
  ["teacher", "Giáo viên / giảng viên"],
  ["tutor", "Gia sư"],
  ["other", "Khác (trường, câu lạc bộ, nhà sáng tạo nội dung…)"],
] as const;

/** Form liên hệ hợp tác → `POST /partners/leads` (lưu DB, admin đọc). Ô `website` ẩn để bẫy bot. */
export function PartnerLeadForm() {
  const [form, setForm] = useState({ name: "", kind: "center", contact: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("sending");
    setError(null);
    try {
      await api.post("/partners/leads", form);
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
          <b>Đã nhận thông tin của bạn.</b> Hanni sẽ liên hệ lại qua {form.contact}. Trong lúc chờ, bạn có thể tạo lớp và
          dùng thử ngay — mọi thứ đều miễn phí.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-muted">
        Tên của bạn / trung tâm
        <input
          required
          minLength={2}
          maxLength={80}
          value={form.name}
          onChange={set("name")}
          className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
        />
      </label>
      <label className="text-xs font-medium text-muted">
        Bạn là
        <select value={form.kind} onChange={set("kind")} className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground">
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-muted sm:col-span-2">
        Email, số điện thoại hoặc Zalo để Hanni liên hệ lại
        <input
          required
          minLength={5}
          maxLength={120}
          value={form.contact}
          onChange={set("contact")}
          className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
        />
      </label>
      <label className="text-xs font-medium text-muted sm:col-span-2">
        Bạn cần gì? (số học viên, cấp HSK, cách bạn muốn dùng Hanni…)
        <textarea
          maxLength={1000}
          rows={4}
          value={form.message}
          onChange={set("message")}
          className="field mt-1 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
        />
      </label>
      {/* Bẫy bot: người dùng thật không thấy ô này. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden="true" />
      {error && (
        <div className="sm:col-span-2">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Đang gửi…" : "Gửi thông tin"}
        </Button>
        <p className="mt-2 text-[11px] leading-5 text-muted">Chỉ dùng để liên hệ lại về hợp tác, không chia sẻ cho bên khác.</p>
      </div>
    </form>
  );
}
