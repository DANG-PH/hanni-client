"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { JoinClassForm } from "@/components/classrooms/join-class-form";
import { Icon, type IconName } from "@/components/icon";
import { Button, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { createClassroom, useMyClassrooms } from "@/lib/classrooms";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";

/** 4 bước của cả luồng — người mới vào trang (chưa có lớp nào) thấy ngay ai làm gì. */
const FLOW: { icon: IconName; who: string; text: string }[] = [
  { icon: "plus", who: "Giáo viên", text: "Tạo lớp, nhận mã 6 ký tự" },
  { icon: "share", who: "Giáo viên", text: "Gửi mã hoặc đường dẫn qua Zalo, Messenger" },
  { icon: "user", who: "Học viên", text: "Vào lớp — bài được giao hiện ở Trang chủ" },
  { icon: "chart", who: "Giáo viên", text: "Xem ai đã làm bài, ai học đều mỗi ngày" },
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
        description="Ai cũng tạo được lớp — người tạo là giáo viên của lớp đó. Học viên vào lớp bằng mã giáo viên gửi. Miễn phí."
      />

      {error && <ErrorNote>Chưa tải được danh sách lớp.</ErrorNote>}

      {isNew && (
        <ol aria-label="Lớp học hoạt động thế nào" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((step, i) => (
            <li key={step.text} className="panel flex items-start gap-3 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-muted">{step.who}</span>
                <span className="mt-0.5 block text-sm leading-6 font-semibold">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

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
            <p className="eyebrow">{isNew ? "Tôi là học viên" : "Vào thêm lớp"}</p>
            <h2 id="vai-hoc-vien" className="mt-1 text-lg font-bold">
              Có mã lớp từ giáo viên?
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Nhập mã hoặc mở đường dẫn giáo viên gửi. Vào lớp thì giáo viên thấy tiến độ học của bạn (chuỗi ngày, phút học,
              bài đã xong, điểm thi thử) — không thấy email.
            </p>
          </div>
          <JoinClassForm />
        </section>

        <section id="tao-lop" aria-labelledby="vai-giao-vien" className="panel scroll-mt-24 space-y-4 p-5 sm:p-6">
          <div>
            <p className="eyebrow">{isNew ? "Tôi là giáo viên" : "Tạo thêm lớp"}</p>
            <h2 id="vai-giao-vien" className="mt-1 text-lg font-bold">
              Dạy tiếng Trung? Tạo lớp miễn phí
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Không cần đăng ký gói giáo viên. Giao bài từ lộ trình HSK hoặc đề thi thử, xem tiến độ từng học viên.{" "}
              <Link href="/hop-tac" className="font-semibold text-primary hover:underline">
                Xem giáo viên làm được gì
              </Link>
            </p>
          </div>
          <CreateClassForm />
        </section>
      </div>
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
    if (busy || name.trim().length < 2) return;
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
      <Button type="submit" disabled={busy || name.trim().length < 2} className="w-full sm:w-auto">
        <Icon name="plus" size={16} />
        {busy ? "Đang tạo…" : "Tạo lớp"}
      </Button>
    </form>
  );
}
