"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { createClassroom, useMyClassrooms } from "@/lib/classrooms";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";

/**
 * Lớp học (2026-10-19): giáo viên tạo lớp → gửi mã/đường dẫn → học viên vào lớp →
 * giáo viên xem tiến độ từng người và giao bài. Tham khảo Duolingo for Schools
 * (miễn phí, lớp + giao bài + xem tiến độ) — Hanbeego chỉ bán sỉ Premium cho giáo viên.
 */
export default function ClassroomsPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const { data, error, isLoading } = useMyClassrooms();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loading || !user || isLoading) return <Spinner />;

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (busy || name.trim().length < 2) return;
    setBusy("create");
    setMessage(null);
    try {
      const created = await createClassroom({ name: name.trim(), ...(level ? { hskLevel: level } : {}) });
      router.push(`/lop-hoc/${created.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Chưa tạo được lớp, thử lại nhé.");
      setBusy(null);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    const clean = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (busy || clean.length !== 6) {
      setMessage("Mã lớp gồm 6 ký tự (chữ và số), giáo viên gửi cho bạn.");
      return;
    }
    // Sang trang vào lớp để xem trước lớp + điều giáo viên sẽ thấy, rồi mới bấm vào.
    router.push(`/lop/${clean}`);
  }

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];

  return (
    <div className="page-wrap space-y-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">LỚP HỌC</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Học cùng giáo viên, cả lớp cùng tiến</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Giáo viên tạo lớp, giao bài học hoặc đề thi thử và theo dõi tiến độ từng học viên. Học viên vào lớp bằng
            mã giáo viên gửi. Miễn phí cho cả hai bên.
          </p>
        </div>
        <Link href="/hop-tac" className="text-sm font-semibold text-primary hover:underline">
          Trung tâm muốn dùng cho nhiều lớp? →
        </Link>
      </div>

      {(error || message) && <ErrorNote>{message ?? "Chưa tải được danh sách lớp."}</ErrorNote>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="lop-day" className="panel space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
              <Icon name="users" size={20} />
            </span>
            <div>
              <h2 id="lop-day" className="font-bold">
                Lớp tôi dạy
              </h2>
              <p className="text-xs text-muted">Tạo lớp rồi gửi mã cho học viên qua Zalo, Messenger, Google Classroom.</p>
            </div>
          </div>
          {owned.length > 0 && (
            <ul className="space-y-2">
              {owned.map((c) => (
                <li key={c.id}>
                  <Link href={`/lop-hoc/${c.id}`} className="hover-card flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
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
          )}
          <form onSubmit={onCreate} className="space-y-3 rounded-xl bg-surface-2/60 p-4">
            <p className="text-sm font-semibold">{owned.length ? "Tạo thêm lớp" : "Tạo lớp đầu tiên"}</p>
            <label className="block text-xs font-medium text-muted" htmlFor="class-name">
              Tên lớp
            </label>
            <input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="vd: HSK 1 — tối thứ 3, 5"
              className="field h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
            />
            <label className="block text-xs font-medium text-muted" htmlFor="class-level">
              Cấp HSK của lớp (để gợi ý bài khi giao)
            </label>
            <select
              id="class-level"
              value={level}
              onChange={(e) => setLevel(e.target.value ? Number(e.target.value) : "")}
              className="field h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            >
              <option value="">Chưa chọn</option>
              {HSK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {hskLabel(l)}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy !== null || name.trim().length < 2} className="w-full sm:w-auto">
              <Icon name="plus" size={16} />
              {busy === "create" ? "Đang tạo…" : "Tạo lớp"}
            </Button>
          </form>
        </section>

        <section aria-labelledby="lop-hoc" className="panel space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
              <Icon name="book" size={20} />
            </span>
            <div>
              <h2 id="lop-hoc" className="font-bold">
                Lớp tôi học
              </h2>
              <p className="text-xs text-muted">Bài giáo viên giao hiện ngay ở Trang chủ của bạn.</p>
            </div>
          </div>
          {joined.length > 0 && (
            <ul className="space-y-2">
              {joined.map((c) => (
                <li key={c.id}>
                  <Link href={`/lop-hoc/${c.id}`} className="hover-card flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <Avatar user={c.teacher} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{c.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {c.teacher.displayName} · {c.memberCount} học viên
                      </span>
                    </span>
                    {c.pendingCount > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-fg">
                        {c.pendingCount} bài cần làm
                      </span>
                    )}
                    <Icon name="arrow" size={16} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={onJoin} className="space-y-3 rounded-xl bg-surface-2/60 p-4">
            <label className="block text-sm font-semibold" htmlFor="class-code">
              Vào lớp bằng mã
            </label>
            <div className="flex gap-2">
              <input
                id="class-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={9}
                autoCapitalize="characters"
                placeholder="vd: HN4K7P"
                className="field h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 font-mono text-sm tracking-widest uppercase"
              />
              <Button type="submit" disabled={busy !== null}>
                Vào lớp
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted">
              Hoặc mở đường dẫn giáo viên gửi. Vào lớp thì giáo viên thấy tiến độ học của bạn (chuỗi ngày, phút học, bài đã
              xong, điểm thi thử) — không thấy email.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
