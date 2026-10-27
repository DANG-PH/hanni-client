"use client";

/**
 * BẢN ĐỒ TRANG — LỚP HỌC (/lop-hoc) — lớp tôi dạy / lớp tôi học, tạo lớp, nhập mã
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   POST /classrooms      ← createClassroom() ở lib/classrooms.ts (← chính trang này)
 *                           → server: modules/classrooms/classrooms.controller.ts → ClassroomsService.create()
 *   GET /classrooms/mine  ← useMyClassrooms() ở lib/classrooms.ts (← chính trang này)
 *                           → server: modules/classrooms/classrooms.controller.ts → ClassroomsService.mine()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(app)/layout.tsx.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { JoinClassForm } from "@/components/classrooms/join-class-form";
import { Icon } from "@/components/icon";
import { Button, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { createClassroom, useMyClassrooms } from "@/lib/classrooms";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";

/** 4 bước của cả luồng — người mới vào trang (chưa có lớp nào) thấy ngay ai làm gì. */
const FLOW: { who: string; text: string }[] = [
  { who: "Giáo viên", text: "tạo lớp, nhận mã 6 ký tự" },
  { who: "Giáo viên", text: "gửi mã hoặc đường dẫn qua Zalo, Messenger" },
  { who: "Học viên", text: "vào lớp — bài được giao hiện ở Trang chủ" },
  { who: "Giáo viên", text: "xem ai đã làm bài, ai học đều mỗi ngày" },
];

/**
 * Lớp học (2026-10-19, làm lại 2026-10-20 — user: "ai được tạo lớp? chưa hiểu luồng"): AI CŨNG tạo được
 * lớp, người tạo là giáo viên của lớp đó — vai trò theo từng lớp, không theo tài khoản, không cần duyệt
 * hay gói giáo viên (như Google Classroom với tài khoản cá nhân, Duolingo for Schools). Học viên vào lớp
 * bằng mã/đường dẫn giáo viên gửi. Chưa có lớp nào thì trang chia đúng 2 vai.
 */
export default function ClassroomsPage() {
  const { user, loading } = useRequireAuth();
  const { data, error, isLoading } = useMyClassrooms();

  if (loading || !user || isLoading) return <Spinner />;

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const isNew = owned.length + joined.length === 0;

  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        icon="users"
        title="Lớp học"
        description="Vào lớp của giáo viên bằng mã, hoặc tự mở lớp để giao bài — miễn phí."
      />

      {error && <ErrorNote>Chưa tải được danh sách lớp.</ErrorNote>}

      {owned.length > 0 && (
        <section aria-labelledby="lop-day" className="space-y-3">
          <h2 id="lop-day" className="font-bold">
            Lớp bạn dạy
          </h2>
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {owned.map((c) => (
              <li key={c.id}>
                <Link href={`/lop-hoc/${c.id}`} className="hover-card panel flex items-center gap-3 p-4">
                  <span className="icon-tile flex h-10 w-10 shrink-0 items-center justify-center">
                    <Icon name="users" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {c.hskLevel ? `${hskLabel(c.hskLevel)} · ` : ""}
                      {c.memberCount} học viên · {c.assignmentCount} bài đã giao
                    </span>
                  </span>
                  <span className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-xs font-bold tracking-widest">{c.code}</span>
                  <Icon name="arrow" size={16} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {joined.length > 0 && (
        <section aria-labelledby="lop-hoc" className="space-y-3">
          <h2 id="lop-hoc" className="font-bold">
            Lớp bạn học
          </h2>
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {joined.map((c) => (
              <li key={c.id}>
                <Link href={`/lop-hoc/${c.id}`} className="hover-card panel flex items-center gap-3 p-4">
                  <Avatar user={c.teacher} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{c.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      Giáo viên {c.teacher.displayName} · {c.memberCount} học viên
                    </span>
                  </span>
                  {c.pendingCount > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-fg">
                      {c.pendingCount} bài cần làm
                    </span>
                  )}
                  <Icon name="arrow" size={16} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section aria-labelledby="vai-hoc-vien" className="panel space-y-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow">{isNew ? "Học viên" : "Vào thêm lớp"}</p>
            <h2 id="vai-hoc-vien" className="mt-1 text-lg font-bold">
              Có mã lớp từ giáo viên?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">Nhập mã 6 ký tự giáo viên gửi qua Zalo, Messenger.</p>
          </div>
          <JoinClassForm />
          <p className="flex items-start gap-1.5 text-xs leading-5 text-muted">
            <Icon name="info" size={14} className="mt-0.5 shrink-0" />
            Vào lớp thì giáo viên thấy chuỗi ngày, phút học, bài đã xong, điểm thi thử của bạn — không thấy email.
          </p>
        </section>

        <section id="tao-lop" aria-labelledby="vai-giao-vien" className="panel scroll-mt-24 space-y-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow">{isNew ? "Giáo viên" : "Mở thêm lớp"}</p>
            <h2 id="vai-giao-vien" className="mt-1 text-lg font-bold">
              Dạy tiếng Trung? Mở lớp miễn phí
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Giao bài từ lộ trình HSK hoặc đề thi thử, xem ai đã làm, ai học đều.{" "}
              <Link href="/hop-tac" className="font-semibold text-primary hover:underline">
                Xem màn giáo viên
              </Link>
            </p>
          </div>
          <CreateClassForm />
        </section>
      </div>

      {isNew && (
        <section aria-labelledby="cach-hoat-dong" className="rounded-2xl border border-border p-4 sm:p-5">
          <h2 id="cach-hoat-dong" className="text-sm font-bold">
            Lớp học hoạt động thế nào
          </h2>
          <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map((step, i) => (
              <li key={step.text} className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 text-sm leading-5">
                  <span className="font-semibold">{step.who}:</span> {step.text}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2) {
      setError("Đặt tên lớp trước nhé (ít nhất 2 ký tự), vd: HSK 1 — tối thứ 3, 5.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createClassroom({ name: name.trim(), ...(level ? { hskLevel: level } : {}) });
      router.push(`/lop-hoc/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa tạo được lớp, thử lại nhé.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label className="block min-w-0 text-xs font-medium text-muted">
          Tên lớp
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="vd: HSK 1 — tối thứ 3, 5"
            className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Cấp HSK
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value ? Number(e.target.value) : "")}
            className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">Chưa chọn</option>
            {HSK_LEVELS.map((l) => (
              <option key={l} value={l}>
                {hskLabel(l)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        <Icon name="plus" size={16} />
        {busy ? "Đang tạo…" : "Tạo lớp"}
      </Button>
    </form>
  );
}
