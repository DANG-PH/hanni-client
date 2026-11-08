"use client";

/**
 * BẢN ĐỒ TRANG — LỚP HỌC (/lop-hoc) — lớp tôi dạy / lớp tôi học, tạo lớp, nhập mã
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
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
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { JoinClassForm } from "@/components/classrooms/join-class-form";
import { Icon, type IconName } from "@/components/icon";
import { Button, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { createClassroom, useMyClassrooms } from "@/lib/classrooms";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";

const CLASS_ACTIONS = [
  { id: "nhap-ma-lop", role: "Học viên", label: "Nhập mã lớp", icon: "users" },
  { id: "tao-lop", role: "Giáo viên", label: "Tạo lớp mới", icon: "plus" },
] as const satisfies ReadonlyArray<{ id: string; role: string; label: string; icon: IconName }>;

type ClassAction = (typeof CLASS_ACTIONS)[number]["id"];

export default function ClassroomsPage() {
  const { user, loading } = useRequireAuth();
  const { data, error, isLoading, mutate } = useMyClassrooms();

  const [action, setAction] = useState<ClassAction>("nhap-ma-lop");
  const ready = !loading && !!user && !isLoading;
  useEffect(() => {
    if (!ready) return;
    function readAction() {
      const hash = window.location.hash.slice(1);
      if (hash === "nhap-ma-lop" || hash === "tao-lop") {
        setAction(hash);
        return hash;
      }
      setAction("nhap-ma-lop");
    }
    const initial = readAction();
    if (initial) document.getElementById(initial)?.scrollIntoView({ block: "start", behavior: "instant" });
    window.addEventListener("hashchange", readAction);
    return () => window.removeEventListener("hashchange", readAction);
  }, [ready]);

  function selectAction(next: ClassAction) {
    setAction(next);
    if (window.location.hash !== `#${next}`) {
      window.history.replaceState(window.history.state, "", `#${next}`);
    }
  }

  if (!ready) return <Spinner />;

  const owned = data?.owned ?? [];
  const joined = data?.joined ?? [];
  const count = owned.length + joined.length;

  return (
    <div className="page-wrap max-w-6xl! space-y-6">
      <PageHeading
        scene="classroom"
        featured
        icon="users"
        title="Lớp học"
        description="Xem bài được giao trong lớp bạn học, hoặc quản lý các lớp bạn dạy."
      >
        <a href="#nhap-ma-lop" className="motion-button inline-flex items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">Vào lớp bằng mã</a>
        <a href="#tao-lop" className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"><Icon name="plus" size={16} /> Tạo lớp</a>
      </PageHeading>

      {error && (
        <ErrorNote>
          Chưa tải được danh sách lớp.{" "}
          <button type="button" className="min-h-10 font-semibold underline" onClick={() => void mutate()}>
            Thử lại
          </button>
        </ErrorNote>
      )}

      <div className="grid gap-5">
        {count > 0 && (
          <section className="panel min-w-0 overflow-hidden shadow-none" aria-labelledby="my-classrooms">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <h2 id="my-classrooms" className="font-bold">Lớp của tôi</h2>
              <p className="mt-1 text-sm text-muted">{joined.length} lớp đang học · {owned.length} lớp đang dạy</p>
            </div>
            <div className="divide-y divide-border">
              {joined.length > 0 && (
                <section aria-labelledby="lop-hoc" className="p-4 sm:p-5">
                  <h3 id="lop-hoc" className="mb-2 text-xs font-bold tracking-wide text-muted">ĐANG HỌC</h3>
                  <ul className="divide-y divide-border">
                    {joined.map((c) => (
                      <li key={c.id}>
                        <Link href={`/lop-hoc/${c.id}`} className="flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 hover:bg-primary/5">
                          <Avatar user={c.teacher} size={36} />
                          <span className="min-w-0 flex-1">
                            <strong className="block break-words text-sm">{c.name}</strong>
                            <span className="mt-1 block break-words text-xs leading-5 text-muted">
                              {c.teacher.displayName} · {c.memberCount} học viên
                            </span>
                            {c.pendingCount > 0 && (
                              <span className="mt-1 block text-xs font-semibold text-primary">{c.pendingCount} bài cần làm</span>
                            )}
                          </span>
                          <Icon name="chevron" size={16} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {owned.length > 0 && (
                <section aria-labelledby="lop-day" className="min-w-0 p-4 sm:p-5">
                  <h3 id="lop-day" className="mb-2 text-xs font-bold tracking-wide text-muted">ĐANG DẠY</h3>
                  <ul className="divide-y divide-border">
                    {owned.map((c) => (
                      <li key={c.id}>
                        <Link href={`/lop-hoc/${c.id}`} className="flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 hover:bg-primary/5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
                            <Icon name="users" size={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block break-words text-sm">{c.name}</strong>
                            <span className="mt-1 block text-xs leading-5 text-muted">
                              {c.hskLevel ? `${hskLabel(c.hskLevel)} · ` : ""}{c.memberCount} học viên · {c.assignmentCount} bài đã giao
                            </span>
                            <span className="mt-1 block text-xs text-muted">Mã lớp <b className="ml-1 font-mono text-foreground">{c.code}</b></span>
                          </span>
                          <Icon name="chevron" size={16} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </section>
        )}

        <section className="panel mx-auto w-full max-w-3xl min-w-0 p-4 shadow-none sm:p-5" aria-labelledby="class-actions-heading">
          <h2 id="class-actions-heading" className="mb-3 font-bold">Tham gia hoặc tạo lớp</h2>
          <div role="group" aria-label="Chọn thao tác lớp học" className="grid grid-cols-2 gap-2">
            {CLASS_ACTIONS.map(({ id, role, label, icon }) => {
              const active = action === id;
              return (
                <button
                  key={id}
                  id={id}
                  type="button"
                  aria-pressed={active}
                  aria-controls={`${id}-form`}
                  onClick={() => selectAction(id)}
                  className={`flex min-h-16 min-w-0 scroll-mt-24 items-center gap-2 rounded-xl border p-2.5 text-left sm:gap-3 sm:p-3 ${
                    active ? "border-primary/30 bg-primary/7 text-primary" : "border-border bg-surface text-foreground hover:bg-surface-2"
                  }`}
                >
                  <Icon name={icon} size={18} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-muted">{role}</span>
                    <strong className="block text-sm leading-5">{label}</strong>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <div id="nhap-ma-lop-form" className="space-y-3" hidden={action !== "nhap-ma-lop"}>
              <p className="text-sm leading-6 text-muted">Nhập mã 6 ký tự do giáo viên gửi để xem lớp trước khi tham gia.</p>
              <JoinClassForm />
              <details className="text-xs leading-5 text-muted">
                <summary className="min-h-8 cursor-pointer font-semibold text-foreground">Giáo viên xem được gì?</summary>
                Giáo viên có thể xem tiến độ học và bài được giao của bạn trong lớp. Email và mật khẩu được giữ riêng tư.
              </details>
            </div>
            <div id="tao-lop-form" className="space-y-3" hidden={action !== "tao-lop"}>
              <p className="text-sm leading-6 text-muted">Đặt tên lớp để nhận mã mời, giao bài HSK và theo dõi tiến độ học viên.</p>
              <CreateClassForm />
              <Link href="/hop-tac" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Xem cách quản lý lớp <Icon name="arrow" size={15} />
              </Link>
            </div>
          </div>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
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
