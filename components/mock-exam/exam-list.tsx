"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MockExamMeta } from "@/lib/types";

/** Danh sách đề render sẵn từ server (Google đọc được), rồi tải lại kèm cookie
 * để gắn điểm cao nhất của người đang đăng nhập. Cùng khoá SWR với màn kết quả
 * (`mutate("/mock-exams")`) nên vừa nộp bài quay lại là thấy điểm mới. */
function useExams(initial: MockExamMeta[]) {
  const { data } = useSWR<MockExamMeta[]>("/mock-exams", (p: string) => apiFetch<MockExamMeta[]>(p), {
    fallbackData: initial,
    revalidateOnFocus: false,
  });
  return data ?? initial;
}

const ALL_LEVELS = [1, 2, 3, 4, 5, 6];
const SECTION_ICON = { listening: "headphones", reading: "book", writing: "pencil" } as const;
const SECTION_VI = { listening: "nghe", reading: "đọc", writing: "viết" } as const;

export function MockExamList({ exams: initial }: { exams: MockExamMeta[] }) {
  const exams = useExams(initial);
  const levels = new Set(exams.map((e) => e.level));
  const [level, setLevel] = useState(() => Math.min(...(levels.size ? [...levels] : [1])));
  const list = exams.filter((e) => e.level === level);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Cấp HSK">
        {ALL_LEVELS.map((l) => {
          const has = levels.has(l);
          const selected = l === level;
          return (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={!has}
              onClick={() => setLevel(l)}
              className={`motion-button flex shrink-0 flex-col items-start rounded-2xl border-2 px-4 py-2 text-left disabled:cursor-not-allowed ${
                selected
                  ? "border-primary bg-primary text-primary-fg shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_62%,#000)]"
                  : has
                    ? "border-border bg-surface hover:border-primary/40"
                    : "border-dashed border-border bg-surface opacity-60"
              }`}
            >
              <span className="text-sm font-extrabold">HSK {l}</span>
              <span className={`text-[10px] ${selected ? "text-primary-fg/80" : "text-muted"}`}>
                {has ? `${exams.filter((e) => e.level === l).length} đề` : "Sắp có"}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {list.map((e) => {
          const done = e.best !== undefined && e.best !== null;
          const passed = done && (e.best ?? 0) >= e.passScore;
          return (
            <li
              key={e.slug}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-surface p-4 sm:flex-nowrap"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="book" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/thi-thu-hsk/${e.slug}`} className="font-bold hover:text-primary">
                  {e.title}
                </Link>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {e.sections.map((s) => (
                    <span key={s.kind} className="inline-flex items-center gap-1">
                      <Icon name={SECTION_ICON[s.kind]} size={13} />
                      {s.count} câu {SECTION_VI[s.kind]}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={13} />
                    {e.durationMin} phút
                  </span>
                  <span>
                    {e.maxScore} điểm · đạt {e.passScore}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {done && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      passed ? "bg-good/15 text-good" : "bg-danger/10 text-danger"
                    }`}
                    title={`Đã làm ${e.attempts ?? 1} lần`}
                  >
                    Cao nhất {e.best}/{e.maxScore}
                  </span>
                )}
                <LinkButton href={`/thi-thu-hsk/${e.slug}`} variant={done ? "secondary" : "primary"} className="h-10 px-5!">
                  {done ? "Làm lại" : "Làm bài"}
                </LinkButton>
              </div>
            </li>
          );
        })}
      </ul>
      {exams.length === 0 && (
        <p className="rounded-3xl border border-border bg-surface p-6 text-center text-sm text-muted">
          Chưa tải được danh sách đề. Bạn thử tải lại trang nhé.
        </p>
      )}
    </div>
  );
}

/** Thẻ bên phải: người đã đăng nhập thấy tiến độ luyện đề; khách thấy lời mời
 * làm thử ngay (không cần tài khoản). */
export function MockExamProgress({ exams: initial }: { exams: MockExamMeta[] }) {
  const { user } = useAuth();
  const exams = useExams(initial);
  const done = exams.filter((e) => e.best !== undefined && e.best !== null);
  const passed = done.filter((e) => (e.best ?? 0) >= e.passScore);
  const next = exams.find((e) => e.best === undefined || e.best === null) ?? exams[0];

  return (
    <div className="panel flex flex-col p-5">
      {user ? (
        <>
          <p className="text-sm font-bold">Tiến độ luyện đề</p>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Đề đã làm", `${done.length}/${exams.length}`],
              ["Đề đã đạt", `${passed.length}`],
              [
                "Điểm cao nhất",
                done.length ? `${Math.max(...done.map((e) => e.best ?? 0))}` : "—",
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Image src="/anhloading.png" alt="" width={72} height={60} className="h-14 w-auto" />
          <p className="text-sm leading-6">
            <strong>Làm thử ngay</strong>, không cần tài khoản. Đăng nhập để lưu điểm từng đề.
          </p>
        </div>
      )}
      {next && (
        <LinkButton href={`/thi-thu-hsk/${next.slug}`} className="mt-4 lg:mt-auto">
          {user && done.length ? "Làm đề tiếp theo" : `Làm ${next.title}`}
          <Icon name="arrow" size={16} />
        </LinkButton>
      )}
    </div>
  );
}
