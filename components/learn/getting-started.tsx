"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import useSWR from "swr";
import { Icon, type IconName } from "@/components/icon";
import { ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { GETTING_STARTED_HIDDEN_KEY as HIDDEN_KEY, TONE_TRIED_KEY } from "@/lib/getting-started";
import { usePracticeStats, useStudyStats } from "@/lib/hooks";
import type { MockAttempt } from "@/lib/types";


type Local = { hidden: boolean; toneTried: boolean; dictUsed: boolean };
const SERVER_LOCAL: Local = { hidden: true, toneTried: false, dictUsed: false };
let cached: { raw: string; value: Local } = { raw: "", value: SERVER_LOCAL };

function readLocal(): Local {
  let raw = "";
  try {
    raw = [HIDDEN_KEY, TONE_TRIED_KEY, "hanni:dict-history"].map((k) => localStorage.getItem(k) ?? "").join("|");
  } catch {
    /* bỏ qua — không đọc được thì coi như chưa làm gì */
  }
  if (raw !== cached.raw) {
    const [hidden, tone, dict] = raw.split("|");
    cached = { raw, value: { hidden: hidden === "1", toneTried: tone === "1", dictUsed: !!dict && dict !== "[]" } };
  }
  return cached.value;
}

function subscribe(onChange: () => void) {
  const events = ["storage", "hanni:dict-history", TONE_TRIED_KEY, HIDDEN_KEY];
  events.forEach((e) => window.addEventListener(e, onChange));
  return () => events.forEach((e) => window.removeEventListener(e, onChange));
}

/**
 * "Bắt đầu với Hanni" — 5 việc nên thử ở tuần đầu, mỗi việc 1 nút vào thẳng và tự đánh dấu khi đã làm
 * (2026-10-20 — user: bạn mới vào hỏi "web có gì để tôi học, hay gì, vào thế nào"). Ẩn khi xong hết hoặc bấm "Ẩn".
 */
export function GettingStarted({ lessonHref }: { lessonHref: string }) {
  const { user } = useAuth();
  const local = useSyncExternalStore(subscribe, readLocal, () => SERVER_LOCAL);
  const stats = useStudyStats();
  const pronunciation = usePracticeStats("PRONUNCIATION");
  // API → GET /mock-exams/attempts/me · server: modules/mock-exams/mock-exams.controller.ts → MockExamsService.history()
  const exams = useSWR<MockAttempt[]>(user ? "/mock-exams/attempts/me" : null, (p: string) => api.get<MockAttempt[]>(p));

  if (!user || local.hidden || !stats.data || !exams.data) return null;

  const steps: { icon: IconName; title: string; description: string; cta: string; href: string; done: boolean }[] = [
    {
      icon: "route",
      title: "Học bài đầu tiên",
      description: "5 phút: từ mới có âm Hán Việt, mẹo đoán thanh điệu",
      cta: "Vào bài",
      href: lessonHref,
      done: stats.data.inProgress + stats.data.learnedTotal > 0,
    },
    {
      icon: "mic",
      title: "Chấm phát âm một từ",
      description: "Đường giọng bạn vẽ chồng lên giọng chuẩn",
      cta: "Thử ngay",
      href: "/pronunciation",
      done: local.toneTried || (pronunciation.data?.totalAttempts ?? 0) > 0,
    },
    {
      icon: "target",
      title: "Làm thử 1 đề HSK",
      description: "Chấm điểm, chữa từng câu bằng tiếng Việt",
      cta: "Chọn đề",
      href: "/thi-thu-hsk",
      done: exams.data.length > 0,
    },
    {
      icon: "search",
      title: "Tra một từ",
      description: "Gõ tiếng Việt, pinyin hay chữ Hán đều ra",
      cta: "Tra thử",
      href: "/tu-dien",
      done: local.dictUsed,
    },
    {
      icon: "bell",
      title: "Bật nhắc học mỗi ngày",
      description: "Giữ chuỗi ngày đúng giờ bạn chọn",
      cta: "Bật nhắc",
      href: "/settings#nhac-hoc",
      done: user.settings?.reminderHour != null,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  function hide() {
    try {
      localStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      /* bỏ qua */
    }
    window.dispatchEvent(new Event(HIDDEN_KEY));
  }

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="getting-started">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="getting-started" className="text-base font-bold">
            Bắt đầu với Hanni
          </h2>
          <p className="mt-1 text-sm text-muted">5 việc nên thử trong tuần đầu — mỗi việc vài phút.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-bold text-primary">
            {doneCount}/{steps.length}
          </span>
          <button type="button" onClick={hide} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs text-muted hover:bg-surface-2 hover:text-foreground">
            Ẩn
          </button>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={(doneCount / steps.length) * 100} label="Đã thử" />
      </div>
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s) => (
          // Điện thoại: việc đã xong ẩn đi (đã có "N/5" + thanh tiến độ) — 5 thẻ xếp dọc cao ~600px.
          <li key={s.title} className={s.done ? "max-sm:hidden" : undefined}>
            <Link
              href={s.href}
              className={`flex h-full items-start gap-3 rounded-xl border p-3 transition-colors ${
                s.done ? "border-good/25 bg-good/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  s.done ? "bg-good text-white" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon name={s.done ? "check" : s.icon} size={16} />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">{s.description}</span>
                {!s.done && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    {s.cta} <Icon name="arrow" size={13} />
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
