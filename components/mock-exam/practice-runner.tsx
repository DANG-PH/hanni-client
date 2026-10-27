"use client";

import Link from "next/link";
import { useState } from "react";
import { askAssistant } from "@/components/assistant-widget";
import { Icon } from "@/components/icon";
import { Button, LinkButton } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { assistantPrompt } from "@/lib/mock-exam";
import type { MockAnswer, MockPracticeSet, MockReviewItem } from "@/lib/types";
import { ExamItem, SharedBoard } from "./exam-items";

/**
 * Luyện từng dạng bài (như Migii HSK): các câu cùng 1 phần đề gom từ mọi đề
 * cùng cấp, làm câu nào chấm + chữa câu đó ngay (`POST /mock-exams/practice/
 * check`) — không đồng hồ, không lưu lượt làm. Câu render sẵn từ server (trang
 * công khai, Google đọc được đề), tương tác chạy sau khi hydrate.
 */
export function PracticeRunner({ set }: { set: MockPracticeSet }) {
  const { user } = useAuth();
  const [pinyin, setPinyin] = useState(set.showPinyin);
  const [answers, setAnswers] = useState<Record<string, MockAnswer | null>>({});
  const [reviews, setReviews] = useState<Record<string, MockReviewItem>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [round, setRound] = useState(0);
  const key = (examSlug: string, no: number) => `${examSlug}:${no}`;
  const done = Object.keys(reviews).length;
  const right = Object.values(reviews).filter((r) => r.correct).length;

  async function check(examSlug: string, no: number, v: MockAnswer | null) {
    const k = key(examSlug, no);
    setAnswers((a) => ({ ...a, [k]: v }));
    // Câu sắp xếp chưa đủ mảnh thì chưa chấm.
    if (v === null) return;
    setChecking((c) => ({ ...c, [k]: true }));
    setFailed((f) => ({ ...f, [k]: false }));
    try {
      // API → POST /mock-exams/practice/check · server: modules/mock-exams/mock-exams.controller.ts → MockExamsService.practiceCheck()
      const r = await api.post<MockReviewItem>("/mock-exams/practice/check", { examSlug, no, answer: v });
      setReviews((rv) => ({ ...rv, [k]: r }));
    } catch {
      setFailed((f) => ({ ...f, [k]: true }));
    } finally {
      setChecking((c) => ({ ...c, [k]: false }));
    }
  }

  function restart() {
    setAnswers({});
    setReviews({});
    setFailed({});
    setRound((r) => r + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur lg:top-20">
        <p className="min-w-0 flex-1 text-sm">
          Đã làm <strong>{done}</strong>/{set.count} câu
          {done > 0 && (
            <span className="text-muted">
              {" "}
              · đúng <strong className="text-good">{right}</strong>
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setPinyin(!pinyin)}
          aria-pressed={pinyin}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            pinyin ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface text-muted"
          }`}
        >
          Pinyin
        </button>
        {done > 0 && (
          <Button variant="ghost" onClick={restart} className="h-8 px-3! text-xs!">
            <Icon name="refresh" size={14} /> Làm lại
          </Button>
        )}
      </div>

      {set.groups.map((g) => {
        const first = g.part.items[0]?.no;
        const last = g.part.items[g.part.items.length - 1]?.no;
        // Nhãn tranh của bộ tranh dùng chung chỉ có sau khi chữa ít nhất 1 câu.
        const labels = g.part.items.map((it) => reviews[key(g.examSlug, it.no)]?.pictureLabels).find(Boolean);
        return (
          <section key={`${g.examSlug}-${first}`} className="space-y-3">
            <h2 className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold">
              {g.examTitle}
              <span className="font-normal text-muted">
                · câu {first}
                {last !== first ? `–${last}` : ""}
              </span>
              <Link href={`/thi-thu-hsk/${g.examSlug}`} className="ml-auto text-xs font-semibold text-primary hover:underline">
                Làm cả đề
              </Link>
            </h2>
            <SharedBoard part={g.part} pinyin={pinyin} labels={g.part.type === "match-picture" ? labels : undefined} />
            {g.part.items.map((item) => {
              const k = key(g.examSlug, item.no);
              const review = reviews[k];
              // Câu tự viết (HSK 4 viết phần 2): gõ chỉ lưu, bấm nút mới chấm — chấm theo từng phím gõ thì chữ đầu tiên
              // đã bị chấm sai và khoá câu.
              const typed = g.part.type === "write-sentence";
              return (
                <div key={`${k}-${round}`}>
                  <ExamItem
                    id={`${g.examSlug}-q-${item.no}`}
                    part={g.part}
                    item={item}
                    section={set.section}
                    given={answers[k] ?? null}
                    onChange={
                      review || checking[k]
                        ? undefined
                        : typed
                          ? (v) => setAnswers((a) => ({ ...a, [k]: v }))
                          : (v) => void check(g.examSlug, item.no, v)
                    }
                    review={review}
                    pinyin={pinyin}
                    onAsk={
                      user && review
                        ? () =>
                            askAssistant(
                              assistantPrompt({
                                title: g.examTitle,
                                section: set.section,
                                officialPart: set.part,
                                part: g.part,
                                item,
                                review,
                                picked: answers[k] ?? null,
                              }),
                            )
                        : undefined
                    }
                  />
                  {typed && !review && (
                    <Button
                      className="mt-2"
                      disabled={!answers[k] || checking[k]}
                      onClick={() => void check(g.examSlug, item.no, answers[k] ?? null)}
                    >
                      {checking[k] ? "Đang chấm…" : "Chấm câu này"}
                    </Button>
                  )}
                  {failed[k] && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-danger">
                      Chưa chấm được — kiểm tra kết nối.
                      <button
                        type="button"
                        onClick={() => void check(g.examSlug, item.no, answers[k] ?? null)}
                        className="font-semibold underline"
                      >
                        Thử lại
                      </button>
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        {done === set.count ? (
          <p className="font-bold">
            Xong {set.count} câu — đúng {right}/{set.count}
            {right === set.count ? ". Dạng này bạn vững rồi!" : "."}
          </p>
        ) : (
          <p className="text-sm text-muted">Còn {set.count - done} câu chưa làm.</p>
        )}
        <div className="mt-3 grid gap-2 sm:flex sm:justify-center">
          <LinkButton href="/thi-thu-hsk">
            Làm đề thi thử đầy đủ <Icon name="arrow" size={16} />
          </LinkButton>
          {done > 0 && (
            <Button variant="ghost" onClick={restart}>
              <Icon name="refresh" size={16} /> Làm lại dạng này
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
