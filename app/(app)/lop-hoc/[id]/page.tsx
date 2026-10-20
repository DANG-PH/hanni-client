"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { Button, ErrorNote, LinkButton, ProgressBar, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import {
  addAssignment,
  deleteClassroom,
  dueLabel,
  inviteUrl,
  leaveClassroom,
  removeAssignment,
  removeMember,
  useClassroom,
  type ClassDetail,
  type MemberStats,
} from "@/lib/classrooms";
import { useLearnPath } from "@/lib/hooks";
import { HSK_LEVELS, hskLabel } from "@/lib/pos";
import type { MockExamMeta } from "@/lib/types";

type OwnerView = Extract<ClassDetail, { role: "owner" }>;
type MemberView = Extract<ClassDetail, { role: "member" }>;

/** "hôm nay" / "hôm qua" / "5 ngày trước" từ ngày học cuối (yyyy-mm-dd, theo ngày học của người đó). */
function lastStudied(date: string | null) {
  if (!date) return "Chưa học";
  const days = Math.round((Date.now() - new Date(`${date}T12:00:00+07:00`).getTime()) / 86_400_000);
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

export default function ClassroomPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useRequireAuth();
  const { data, error, isLoading } = useClassroom(user ? id : null);

  if (loading || !user || isLoading) return <Spinner />;
  if (error || !data)
    return (
      <div className="page-wrap space-y-4">
        <ErrorNote>{error instanceof Error ? error.message : "Không mở được lớp này."}</ErrorNote>
        <LinkButton href="/lop-hoc" variant="secondary">
          <Icon name="back" size={16} /> Về danh sách lớp
        </LinkButton>
      </div>
    );
  return data.role === "owner" ? <TeacherView data={data} /> : <StudentView data={data} />;
}

function Header({ data, children }: { data: ClassDetail; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Link href="/lop-hoc" className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary">
          <Icon name="back" size={14} /> Lớp học
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight break-words">{data.class.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          {data.class.hskLevel && <span>{hskLabel(data.class.hskLevel)}</span>}
          {data.class.hskLevel && <span aria-hidden>·</span>}
          <span>{data.class.memberCount} học viên</span>
          {data.role === "member" && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                Giáo viên <Avatar user={data.class.teacher} size={20} /> <b className="text-foreground">{data.class.teacher.displayName}</b>
              </span>
            </>
          )}
        </p>
      </div>
      {children}
    </div>
  );
}

function TeacherView({ data }: { data: OwnerView }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = inviteUrl(data.class.code);
  const shareText = `Vào lớp "${data.class.name}" trên Hanni để học tiếng Trung cùng lớp — mã lớp ${data.class.code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${shareText}: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Trình duyệt chặn clipboard — người dùng vẫn chép tay được mã ở trên.
    }
  }
  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: data.class.name, text: shareText, url });
    } catch {
      // Huỷ hộp thoại chia sẻ — không phải lỗi.
    }
  }

  return (
    <div className="page-wrap space-y-6">
      <Header data={data} />

      <section aria-label="Mời học viên" className="panel grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="text-center lg:pr-6 lg:text-left">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Mã lớp</p>
          <p className="mt-1 font-mono text-4xl font-extrabold tracking-[0.25em] text-primary">{data.class.code}</p>
        </div>
        <div className="min-w-0 space-y-3">
          <p className="text-sm leading-6 text-muted">
            Học viên mở đường dẫn (hoặc nhập mã ở <b className="text-foreground">Tài khoản → Lớp học</b>) là vào lớp. Bài bạn
            giao hiện ngay ở Trang chủ của họ.
          </p>
          <p className="truncate rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs">{url}</p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button onClick={() => void share()}>
              <Icon name="share" size={16} /> Gửi cho học viên
            </Button>
            <Button variant="secondary" onClick={() => void copy()}>
              <Icon name={copied ? "check" : "copy"} size={16} /> {copied ? "Đã chép" : "Chép đường dẫn"}
            </Button>
            {/* "Chia sẻ lên Classroom" bằng đường dẫn của Google — không cần khoá API. */}
            <a
              href={`https://classroom.google.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Vào lớp ${data.class.name} trên Hanni`)}`}
              target="_blank"
              rel="noreferrer"
              className="motion-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold shadow-[0_3px_0_0_var(--border)] hover:bg-surface-2"
            >
              <Icon name="book" size={16} /> Google Classroom
            </a>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Học viên", value: data.members.length, hint: "đã vào lớp" },
          { label: "Học tuần này", value: `${data.summary.activeThisWeek}/${data.members.length}`, hint: "có học trong 7 ngày" },
          { label: "Phút học TB", value: data.summary.avgMinutes7d, hint: "mỗi học viên, 7 ngày" },
          { label: "Bài đã giao", value: data.assignments.length, hint: "bài học + đề thi thử" },
        ].map((s) => (
          <div key={s.label} className="panel p-4">
            <p className="text-xs font-medium text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Điện thoại: tiến độ học viên lên trước (việc giáo viên mở trang để xem), giao bài sau. */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="order-2 space-y-5 xl:order-1">
          <AssignForm data={data} />
          <AssignmentList data={data} />
        </div>
        <div className="order-1 xl:order-2">
          <Members data={data} />
        </div>
      </div>

      {/* Thao tác không hoàn tác được để cuối trang — trước đây nằm ngay dưới tên lớp. */}
      <div className="border-t border-border pt-4">
        <Button
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(`Xoá lớp "${data.class.name}"? Học viên sẽ rời lớp, bài đã giao bị xoá (tiến độ học của họ vẫn giữ).`)) return;
            setBusy(true);
            await deleteClassroom(data.class.id);
            router.replace("/lop-hoc");
          }}
          className="text-xs hover:text-danger"
        >
          <Icon name="trash" size={15} /> Xoá lớp này
        </Button>
      </div>
    </div>
  );
}

function AssignForm({ data }: { data: OwnerView }) {
  const [kind, setKind] = useState<"LESSON" | "MOCK_EXAM">("LESSON");
  const [level, setLevel] = useState(data.class.hskLevel ?? 1);
  const [target, setTarget] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const path = useLearnPath(level);
  const exams = useSWR<MockExamMeta[]>("/mock-exams", (p: string) => apiFetch<MockExamMeta[]>(p));
  const lessons = path.data?.level === level ? path.data.lessons : [];
  const levelExams = (exams.data ?? []).filter((e) => e.level === level);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!target) {
      setNote({ ok: false, text: kind === "LESSON" ? "Chọn bài học muốn giao trước nhé." : "Chọn đề thi muốn giao trước nhé." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      // Hạn nộp: hết ngày đã chọn theo giờ Việt Nam.
      const dueAt = due ? new Date(`${due}T23:59:00+07:00`).toISOString() : undefined;
      await addAssignment(
        data.class.id,
        kind === "LESSON" ? { kind, lessonId: target, dueAt } : { kind, examSlug: target, dueAt },
      );
      setTarget("");
      setDue("");
      setNote({ ok: true, text: "Đã giao bài — học viên bật thông báo sẽ nhận được ngay." });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Chưa giao được bài." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-5 sm:p-6" aria-labelledby="giao-bai">
      <h2 id="giao-bai" className="flex items-center gap-2 font-bold">
        <Icon name="flag" size={18} className="text-primary" /> Giao bài
      </h2>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Loại bài">
        {(
          [
            ["LESSON", "Bài học", "cards"],
            ["MOCK_EXAM", "Đề thi thử", "target"],
          ] as const
        ).map(([k, label, icon]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => {
              setKind(k);
              setTarget("");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
              kind === k ? "chip-on" : "border-border bg-surface text-muted hover:text-foreground"
            }`}
          >
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <label className="text-xs font-medium text-muted">
          Cấp
          <select
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value));
              setTarget("");
            }}
            className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
          >
            {HSK_LEVELS.map((l) => (
              <option key={l} value={l}>
                {hskLabel(l)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-xs font-medium text-muted">
          {kind === "LESSON" ? "Bài học" : "Đề thi thử"}
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">— Chọn —</option>
            {kind === "LESSON"
              ? lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    Bài {l.orderIndex}: {l.title} ({l.wordCount} từ)
                  </option>
                ))
              : levelExams.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.title} · {e.questionCount} câu · {e.durationMin} phút
                  </option>
                ))}
          </select>
        </label>
      </div>
      {kind === "MOCK_EXAM" && levelExams.length === 0 && (
        <p className="text-xs text-muted">Đề thi thử hiện có cho HSK 1–3.</p>
      )}
      <label className="block text-xs font-medium text-muted">
        Hạn nộp (không bắt buộc)
        <input
          type="date"
          value={due}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDue(e.target.value)}
          className="field mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
        />
      </label>
      {note && <p className={`text-xs ${note.ok ? "text-good" : "text-danger"}`}>{note.text}</p>}
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? "Đang giao…" : "Giao cho cả lớp"}
      </Button>
    </form>
  );
}

function AssignmentList({ data }: { data: OwnerView }) {
  const [open, setOpen] = useState<string | null>(null);
  const names = new Map(data.members.map((m) => [m.id, m.displayName]));
  if (data.assignments.length === 0)
    return (
      <p className="panel p-5 text-sm text-muted">
        Chưa giao bài nào. Giao một bài học là cách nhanh nhất để cả lớp bắt đầu — học viên thấy bài ngay ở Trang chủ.
      </p>
    );
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="da-giao">
      <h2 id="da-giao" className="mb-3 font-bold">
        Bài đã giao
      </h2>
      <ul className="divide-y divide-border">
        {data.assignments.map((a) => {
          const due = dueLabel(a.dueAt);
          const total = data.members.length;
          const pending = data.members.filter((m) => !a.doneUserIds.includes(m.id));
          return (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="icon-tile mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center">
                  <Icon name={a.kind === "LESSON" ? "cards" : "target"} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={a.href} className="block text-sm font-semibold break-words hover:text-primary">
                    {a.label}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {a.doneCount}/{total} đã xong
                    {due && <span className={due.overdue ? "text-danger" : ""}> · {due.text}</span>}
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={total ? (a.doneCount / total) * 100 : 0} label="Học viên đã xong" color="bg-good" />
                  </div>
                  {pending.length > 0 && total > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpen(open === a.id ? null : a.id)}
                      className="mt-1.5 text-xs font-semibold text-primary"
                    >
                      {open === a.id ? "Ẩn" : `Xem ${pending.length} bạn chưa làm`}
                    </button>
                  )}
                  {open === a.id && (
                    <p className="mt-1 text-xs leading-5 text-muted">{pending.map((m) => names.get(m.id)).join(", ")}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Xoá bài giao"
                  onClick={() => {
                    if (window.confirm(`Xoá bài giao "${a.label}"?`)) void removeAssignment(data.class.id, a.id);
                  }}
                  className="rounded-lg p-2 text-muted hover:bg-danger/8 hover:text-danger"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExamCell({ m }: { m: MemberStats }) {
  if (!m.bestExam) return <span className="text-muted">—</span>;
  return (
    <Link href={`/thi-thu-hsk/${m.bestExam.slug}`} className="hover:text-primary">
      <b className={m.bestExam.passed ? "text-good" : ""}>
        {m.bestExam.score}/{m.bestExam.maxScore}
      </b>
      <span className="block text-xs text-muted">{m.bestExam.title}</span>
    </Link>
  );
}

function Members({ data }: { data: OwnerView }) {
  const [sort, setSort] = useState<"recent" | "minutes" | "lessons">("recent");
  const order = (m: MemberStats) =>
    sort === "minutes" ? -m.minutes7d : sort === "lessons" ? -m.lessonsCompleted : -(m.lastStudiedOn ? Date.parse(m.lastStudiedOn) : 0);
  const members = [...data.members].sort((a, b) => order(a) - order(b));
  const kick = (m: MemberStats) => {
    if (window.confirm(`Cho ${m.displayName} rời lớp? Tiến độ học của bạn ấy vẫn giữ nguyên.`)) void removeMember(data.class.id, m.id);
  };

  return (
    <section className="panel min-w-0 p-5 sm:p-6" aria-labelledby="hoc-vien">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="hoc-vien" className="font-bold">
          Tiến độ học viên
        </h2>
        <label className="flex items-center gap-2 text-xs whitespace-nowrap text-muted">
          Xếp theo
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="field h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="recent">Học gần nhất</option>
            <option value="minutes">Phút học tuần này</option>
            <option value="lessons">Bài đã xong</option>
          </select>
        </label>
      </div>
      {members.length === 0 ? (
        <p className="rounded-xl bg-surface-2/60 p-4 text-sm leading-6 text-muted">
          Chưa có học viên nào. Gửi mã <b className="font-mono text-foreground">{data.class.code}</b> hoặc đường dẫn ở trên cho lớp —
          ai vào lớp sẽ hiện ở đây cùng chuỗi ngày, phút học, bài đã xong và điểm thi thử.
        </p>
      ) : (
        <>
          {/* Máy tính: bảng; điện thoại: thẻ từng người (bảng 8 cột không vừa 390px). */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Học viên</th>
                  <th className="px-2 py-2 font-medium">Học lần cuối</th>
                  <th className="px-2 py-2 text-right font-medium">Chuỗi</th>
                  <th className="px-2 py-2 text-right font-medium">Phút / 7 ngày</th>
                  <th className="px-2 py-2 text-right font-medium">Bài xong</th>
                  <th className="px-2 py-2 text-right font-medium">Từ</th>
                  <th className="px-2 py-2 font-medium">Thi thử tốt nhất</th>
                  <th className="py-2 pl-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link href={`/u/${m.id}`} className="flex items-center gap-2 hover:text-primary">
                        <Avatar user={m} size={30} />
                        <span className="max-w-44 truncate font-semibold">{m.displayName}</span>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-xs">
                      {lastStudied(m.lastStudiedOn)}
                      <span className="block text-xs text-muted">{m.daysActive7d}/7 ngày học</span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{m.currentStreak}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{m.minutes7d}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{m.lessonsCompleted}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{m.wordsStudied}</td>
                    <td className="px-2 py-2.5 text-xs">
                      <ExamCell m={m} />
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button type="button" aria-label={`Cho ${m.displayName} rời lớp`} onClick={() => kick(m)} className="rounded-lg p-1.5 text-muted hover:text-danger">
                        <Icon name="close" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {members.map((m) => (
              <li key={m.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Avatar user={m} size={32} />
                  <Link href={`/u/${m.id}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {m.displayName}
                  </Link>
                  <span className="text-xs text-muted">{lastStudied(m.lastStudiedOn)}</span>
                  <button type="button" aria-label={`Cho ${m.displayName} rời lớp`} onClick={() => kick(m)} className="rounded-lg p-1.5 text-muted hover:text-danger">
                    <Icon name="close" size={14} />
                  </button>
                </div>
                <dl className="mt-2 grid grid-cols-4 gap-1 text-center text-xs text-muted">
                  {[
                    ["Chuỗi", m.currentStreak],
                    ["Phút/7n", m.minutes7d],
                    ["Bài xong", m.lessonsCompleted],
                    ["Từ", m.wordsStudied],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-surface-2/70 py-1.5">
                      <dd className="text-sm font-bold text-foreground tabular-nums">{v}</dd>
                      <dt>{k}</dt>
                    </div>
                  ))}
                </dl>
                {m.bestExam && (
                  <p className="mt-2 text-xs">
                    Thi thử tốt nhất: <ExamCell m={m} />
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function StudentView({ data }: { data: MemberView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const pending = data.assignments.filter((a) => !a.done);
  const done = data.assignments.filter((a) => a.done);

  return (
    <div className="page-wrap space-y-6">
      <Header data={data} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-5 sm:p-6" aria-labelledby="bai-tap">
          <h2 id="bai-tap" className="mb-3 flex items-center gap-2 font-bold">
            <Icon name="flag" size={18} className="text-primary" /> Bài tập của lớp
          </h2>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-muted">Giáo viên chưa giao bài nào. Trong lúc chờ, cứ học tiếp lộ trình ở Trang chủ nhé.</p>
          ) : (
            <ul className="space-y-2">
              {[...pending, ...done].map((a) => {
                const due = dueLabel(a.dueAt);
                return (
                  <li key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${a.done ? "border-border opacity-70" : "border-primary/25 bg-primary/4"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${a.done ? "bg-good/15 text-good" : "bg-primary/10 text-primary"}`}>
                      <Icon name={a.done ? "check" : a.kind === "LESSON" ? "cards" : "target"} size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold break-words">{a.label}</span>
                      <span className={`block text-xs ${due?.overdue && !a.done ? "text-danger" : "text-muted"}`}>
                        {a.done ? "Đã xong" : due ? due.text : "Không có hạn"}
                      </span>
                    </span>
                    {!a.done && (
                      <LinkButton href={a.href} className="shrink-0 px-3! text-xs">
                        Làm ngay
                      </LinkButton>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-5 sm:p-6" aria-labelledby="bang-tuan">
          <h2 id="bang-tuan" className="flex items-center gap-2 font-bold">
            <Icon name="trophy" size={18} className="text-primary" /> Phút học tuần này
          </h2>
          <p className="mb-3 text-xs text-muted">7 ngày gần nhất, cả lớp.</p>
          <ol className="space-y-1.5">
            {data.classmates.map((m, i) => (
              <li key={m.id} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${m.isMe ? "bg-primary/8" : ""}`}>
                <span className="w-5 text-center text-xs font-bold text-muted tabular-nums">{i + 1}</span>
                <Avatar user={m} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {m.displayName}
                  {m.isMe && <span className="text-muted"> (bạn)</span>}
                </span>
                <span className="text-xs text-muted tabular-nums">
                  <Icon name="flame" size={12} className="inline" /> {m.currentStreak}
                </span>
                <span className="w-14 text-right text-sm font-bold tabular-nums">{m.minutes7d}′</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-border p-4 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Giáo viên thấy tiến độ học của bạn trong lớp này (chuỗi ngày, phút học, bài đã xong, số từ, điểm thi thử) — không thấy
          email. Rời lớp là giáo viên không xem được nữa.
        </p>
        <Button
          variant="ghost"
          disabled={busy}
          className="shrink-0 text-xs hover:text-danger"
          onClick={async () => {
            if (!window.confirm(`Rời lớp "${data.class.name}"?`)) return;
            setBusy(true);
            await leaveClassroom(data.class.id);
            router.replace("/lop-hoc");
          }}
        >
          <Icon name="logout" size={15} /> Rời lớp
        </Button>
      </div>
    </div>
  );
}
