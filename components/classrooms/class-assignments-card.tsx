"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { dueLabel, useMyAssignments } from "@/lib/classrooms";

/** Bài giáo viên giao mà mình CHƯA làm — ngay trên lộ trình ở Trang chủ (chỉ hiện khi có). */
export function ClassAssignmentsCard() {
  const { data } = useMyAssignments();
  if (!data?.length) return null;
  const shown = data.slice(0, 3);
  return (
    <section aria-labelledby="class-tasks" className="panel border-primary/25 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="class-tasks" className="flex items-center gap-2 text-sm font-bold">
          <Icon name="flag" size={16} className="text-primary" /> Bài tập của lớp
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg">{data.length}</span>
        </h2>
        <Link href="/lop-hoc" className="text-xs font-semibold text-primary hover:underline">
          Lớp học →
        </Link>
      </div>
      <ul className="space-y-2">
        {shown.map((a) => {
          const due = dueLabel(a.dueAt);
          return (
            <li key={a.id} className="flex flex-col gap-2 rounded-xl bg-surface-2/60 p-3 sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold break-words">{a.label}</span>
                <span className={`block text-xs ${due?.overdue ? "text-danger" : "text-muted"}`}>
                  {a.className}
                  {due ? ` · ${due.text}` : ""}
                </span>
              </span>
              <LinkButton href={a.href} className="shrink-0 self-start px-3! text-xs sm:self-auto">
                Làm ngay
              </LinkButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
