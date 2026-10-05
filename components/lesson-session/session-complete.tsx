"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { ShareButton } from "@/components/share-button";
import { LinkButton } from "@/components/ui";
import type { LessonCompleteResult, LessonSession } from "@/lib/types";
import { shortMeaning } from "./steps";

function formatDuration(ms: number) {
  const s = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function SessionComplete({
  session,
  durationMs,
  accuracy,
  result,
  saveError,
  isGuest,
}: {
  session: LessonSession;
  durationMs: number;
  accuracy: number;
  result: LessonCompleteResult | null;
  saveError: boolean;
  isGuest: boolean;
}) {
  const next = result?.nextLesson ?? session.nextLesson;
  const total = session.words.length;
  const pct = Math.round(accuracy * 100);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main
        className="mx-auto w-full max-w-xl flex-1 px-4 py-10 text-center"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/12 text-primary">
          <Icon name="trophy" size={40} />
        </span>
        <p className="mt-5 text-[11px] font-bold tracking-wider text-primary">
          HOÀN THÀNH BÀI {session.lesson.orderIndex}/{session.lesson.totalLessons}
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {session.lesson.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {pct >= 90
            ? "Gần như tuyệt đối — bạn nhớ rất nhanh!"
            : pct >= 60
              ? "Làm tốt lắm. Những từ còn sai Hanni sẽ nhắc bạn ôn lại đúng lúc."
              : "Bài đầu luôn khó nhất. Hanni sẽ đưa những từ này quay lại để bạn ôn."}
        </p>

        <dl className="mt-7 grid grid-cols-3 gap-3">
          {[
            { label: "Từ mới", value: String(result?.newWords ?? total) },
            { label: "Chính xác", value: `${pct}%` },
            { label: "Thời gian", value: formatDuration(durationMs) },
          ].map((s) => (
            <div key={s.label} className="panel px-2 py-4">
              <dt className="text-[11px] text-muted">{s.label}</dt>
              <dd className="mt-1 text-xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>

        {result && result.currentStreak > 0 && (
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-4 py-2 text-sm font-semibold text-danger">
            <Icon name="flame" size={16} /> Chuỗi {result.currentStreak} ngày học
          </p>
        )}
        {saveError && (
          <p className="mt-5 text-sm text-danger">
            Chưa lưu được kết quả bài này — bạn kiểm tra kết nối mạng nhé.
          </p>
        )}

        <ul className="mt-7 flex flex-wrap justify-center gap-2">
          {session.words.map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-left"
            >
              <span lang="zh" className="hanzi text-lg">
                {w.simplified}
              </span>{" "}
              <span className="text-xs text-muted">
                {shortMeaning(w.meaningVi ?? "")}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-3">
          {isGuest ? (
            <>
              <LinkButton href="/register?next=/learn">
                Lưu tiến độ — tạo tài khoản miễn phí
                <Icon name="arrow" size={16} />
              </LinkButton>
              {next && (
                <LinkButton href={`/bai-hoc/${next.id}`} variant="secondary">
                  Học tiếp bài {next.orderIndex}: {next.title}
                </LinkButton>
              )}
              <p className="text-xs text-muted">
                Đã có tài khoản?{" "}
                <Link href="/login?next=/learn" className="text-primary hover:underline">
                  Đăng nhập để lưu
                </Link>{" "}
                · Toàn bộ bài học miễn phí.
              </p>
            </>
          ) : (
            <>
              {next ? (
                <LinkButton href={`/bai-hoc/${next.id}`}>
                  Học bài tiếp theo: {next.title}
                  <Icon name="arrow" size={16} />
                </LinkButton>
              ) : (
                <LinkButton href="/learn">
                  Bạn đã học hết cấp này — xem lộ trình
                  <Icon name="arrow" size={16} />
                </LinkButton>
              )}
              <LinkButton href="/learn" variant="secondary">
                Về lộ trình
              </LinkButton>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <ShareButton
            title="Hanni — học tiếng Trung kiểu người Việt"
            text={`Mình vừa học xong ${total} từ tiếng Trung (${session.lesson.title}) trên Hanni — học qua âm Hán Việt, nhớ nhanh hơn hẳn. Thử bài 1 miễn phí nhé:`}
            path="/"
          />
        </div>
      </main>
    </div>
  );
}
