"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import useSWR from "swr";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { parseSnapshot, partInfo, practiceHref, savedSnapshot, weakest } from "@/lib/mock-exam";
import type { MockAnalysis, MockAttempt, MockExamMeta, MockPracticeSetMeta } from "@/lib/types";

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

function subscribeSaved(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** Bài đang làm dở trên máy này — đọc sau khi hydrate (server không có
 * localStorage), như thẻ "Đang làm… Tiếp tục" của Hanzii. */
function useInProgress(exams: MockExamMeta[]) {
  const snapshot = useSyncExternalStore(subscribeSaved, () => savedSnapshot(exams), () => "");
  return useMemo(() => parseSnapshot(snapshot), [snapshot]);
}

const ALL_LEVELS = [1, 2, 3, 4, 5, 6];
const SECTION_ICON = { listening: "headphones", reading: "book", writing: "pencil" } as const;
const SECTION_VI = { listening: "nghe", reading: "đọc", writing: "viết" } as const;

export function MockExamList({
  exams: initial,
  sets = [],
}: {
  exams: MockExamMeta[];
  /** Bộ "luyện từng dạng bài" — hiện theo cấp đang chọn. */
  sets?: MockPracticeSetMeta[];
}) {
  const exams = useExams(initial);
  const inProgress = useInProgress(exams);
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
                  ? "chip-on shadow-[0_3px_0_0_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                  : has
                    ? "border-border bg-surface hover:border-primary/40"
                    : "border-dashed border-border bg-surface opacity-60"
              }`}
            >
              <span className="text-sm font-extrabold">HSK {l}</span>
              <span className={`text-xs ${selected ? "text-primary" : "text-muted"}`}>
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
          const doing = inProgress.get(e.slug);
          return (
            <li
              key={e.slug}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name="book" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link href={`/thi-thu-hsk/${e.slug}`} className="font-bold hover:text-primary">
                    {e.title}
                  </Link>
                  {doing ? (
                    <span className="rounded-full bg-warn/15 px-2 py-0.5 text-xs font-bold text-warn">Đang làm dở</span>
                  ) : done ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        passed ? "bg-good/15 text-good" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {passed ? "Đạt" : "Chưa đạt"}
                    </span>
                  ) : null}
                </div>
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
                {doing ? (
                  <div className="mt-2 max-w-sm">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-warn"
                        style={{ width: `${(doing.answered / Math.max(1, e.questionCount)) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Đã làm {doing.answered}/{e.questionCount} câu · còn khoảng {doing.minutesLeft} phút
                    </p>
                  </div>
                ) : done ? (
                  <p className="mt-1.5 text-xs">
                    <strong>
                      Cao nhất {e.best}/{e.maxScore}
                    </strong>
                    <span className="text-muted"> · đã làm {e.attempts ?? 1} lần</span>
                  </p>
                ) : null}
              </div>
              <LinkButton
                href={`/thi-thu-hsk/${e.slug}`}
                variant={done && !doing ? "secondary" : "primary"}
                className="h-10 w-full px-5! sm:w-auto"
              >
                {doing ? "Làm tiếp" : done ? "Làm lại" : "Làm bài"}
              </LinkButton>
            </li>
          );
        })}
      </ul>
      {exams.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
          Chưa tải được danh sách đề. Bạn thử tải lại trang nhé.
        </p>
      )}

      {/* Luyện từng dạng bài của cấp đang chọn. Mọi cấp đều nằm sẵn trong HTML
       * (cấp khác chỉ `hidden`) — Google đọc được hết các trang dạng bài. */}
      {sets.length > 0 && (
        <section aria-labelledby="practice-sets" className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h3 id="practice-sets" className="text-sm font-bold">
            Luyện từng dạng bài
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Chỉ luyện đúng dạng câu mình hay sai — gom từ mọi đề cùng cấp, làm câu nào chữa câu đó.
          </p>
          {[...new Set(sets.map((x) => x.level))].map((l) => (
            <div key={l} hidden={l !== level}>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {sets
                  .filter((x) => x.level === l)
                  .map((x) => (
                    <li key={x.slug}>
                      <Link
                        href={`/thi-thu-hsk/dang-bai/${x.slug}`}
                        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Icon name={SECTION_ICON[x.section]} size={15} className="shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-semibold">
                            {SECTION_SHORT[x.section]} {x.part}
                          </span>{" "}
                          · {partInfo(x.section, x.type).label}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{x.count} câu</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
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
          <span className="icon-tile shrink-0">
            <Icon name="target" />
          </span>
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

const SECTION_SHORT = { listening: "Nghe", reading: "Đọc", writing: "Viết" } as const;

/** Điểm mạnh/yếu từng phần + lịch sử làm bài (Hanbeego "Phân tích điểm mạnh,
 * yếu", Migii "Lịch sử luyện tập"). Khách thì mời đăng nhập để được ghi lại. */
export function MockExamInsights({ exams: initial }: { exams: MockExamMeta[] }) {
  const { user, loading } = useAuth();
  const exams = useExams(initial);
  const { data: analysis } = useSWR<MockAnalysis>(user ? "/mock-exams/analysis/me" : null, (p: string) =>
    apiFetch<MockAnalysis>(p),
  );
  const { data: attempts } = useSWR<MockAttempt[]>(user ? "/mock-exams/attempts/me" : null, (p: string) =>
    apiFetch<MockAttempt[]>(p),
  );
  if (loading) return null;

  const heading = (
    <h2 id="insights" className="font-bold">
      Phân tích điểm mạnh, yếu
    </h2>
  );
  if (!user)
    return (
      <section aria-labelledby="insights" className="panel p-5">
        {heading}
        <p className="mt-2 text-sm leading-6 text-muted">
          Đăng nhập để Hanni ghi lại điểm từng phần qua mỗi lần làm và chỉ ra dạng câu bạn hay sai.
        </p>
        <Link
          href="/login?next=/thi-thu-hsk"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Đăng nhập <Icon name="arrow" size={14} />
        </Link>
      </section>
    );
  if (!analysis || !attempts) return <div className="skeleton h-40 w-full rounded-2xl" />;
  if (analysis.attempts === 0)
    return (
      <section aria-labelledby="insights" className="panel p-5">
        {heading}
        <p className="mt-2 text-sm text-muted">Làm ít nhất 1 đề để xem phân tích điểm mạnh, điểm yếu của bạn.</p>
      </section>
    );

  const weak = weakest(analysis.parts, 1)[0];
  const titleOf = (slug: string) => exams.find((e) => e.slug === slug)?.title ?? slug;
  // Làm cả đề HSK 1 lẫn HSK 2 thì tách theo cấp — trộn chung ra 2 dòng "Nghe 1".
  const levels = [...new Set(analysis.parts.map((p) => p.level))].sort((a, b) => a - b);
  const levelTag = (level: number) => (levels.length > 1 ? `HSK ${level} · ` : "");
  return (
    <section aria-labelledby="insights" className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {heading}
        <p className="text-xs text-muted">Cộng dồn {analysis.attempts} lượt làm</p>
      </div>
      {levels.map((level) => (
        <div key={level} className="mt-3">
          {levels.length > 1 && <h3 className="mb-2 text-xs font-bold text-muted">HSK {level}</h3>}
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {analysis.parts
              .filter((p) => p.level === level)
              .map((p) => {
                const ratio = p.correct / Math.max(1, p.total);
                return (
                  <li key={`${p.level}-${p.section}-${p.part}`}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="min-w-0">
                        <span className="font-semibold">
                          {SECTION_SHORT[p.section]} {p.part}
                        </span>
                        <span className="text-muted"> · {partInfo(p.section, p.type).label}</span>
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">{Math.round(ratio * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${ratio >= 0.8 ? "bg-good" : ratio >= 0.6 ? "bg-warn" : "bg-danger"}`}
                        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
      {weak ? (
        <div className="mt-4 rounded-2xl border border-warn/30 bg-warn/8 p-3 text-sm">
          <p className="font-semibold">
            Yếu nhất: {levelTag(weak.level)}
            {SECTION_SHORT[weak.section]} {weak.part} · {partInfo(weak.section, weak.type).label}
          </p>
          <p className="mt-1 leading-6 text-muted">{partInfo(weak.section, weak.type).tip}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={practiceHref(weak.level, weak.section, weak.part)}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Luyện riêng dạng này <Icon name="arrow" size={14} />
            </Link>
            <Link
              href={partInfo(weak.section, weak.type).href}
              className="inline-flex items-center gap-1 font-semibold text-muted hover:text-primary"
            >
              {partInfo(weak.section, weak.type).cta} <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-good">Phần nào cũng đúng từ 80% trở lên — đều tay!</p>
      )}
      <h3 className="mt-5 text-sm font-bold">Lịch sử làm bài</h3>
      <ul className="mt-1 divide-y divide-border">
        {attempts.slice(0, 5).map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
            <Link href={`/thi-thu-hsk/${a.examSlug}`} className="min-w-0 flex-1 truncate hover:text-primary">
              {titleOf(a.examSlug)}
            </Link>
            <span className="shrink-0 text-xs text-muted">
              {new Date(a.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                a.passed ? "bg-good/15 text-good" : "bg-danger/10 text-danger"
              }`}
            >
              {a.score}/{a.maxScore}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
