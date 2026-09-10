"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { Icon } from "@/components/icon";
import { api, apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import type { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const { user, loading, refresh } = useRequireAuth();
  const { data, mutate, error } = useSWR<UserSettings>(
    "/users/me/settings",
    (p: string) => apiFetch<UserSettings>(p),
  );
  const [form, setForm] = useState<UserSettings | null>(null);
  const [tz, setTz] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  useEffect(() => {
    if (user) setTz(user.timezone);
  }, [user]);

  if (loading || !user) return <Spinner />;
  if (error)
    return (
      <div className="page-wrap">
        <ErrorNote>
          Chưa tải được cài đặt.{" "}
          <button className="underline" onClick={() => void mutate()}>
            Thử lại
          </button>
        </ErrorNote>
      </div>
    );
  if (!form) return <Spinner />;

  function upd<K extends keyof UserSettings>(k: K, v: UserSettings[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    setSaved(false);
    const next = await api.patch<UserSettings>("/users/me/settings", {
      dailyGoalType: form!.dailyGoalType,
      dailyGoalValue: form!.dailyGoalValue,
      newCardsPerDay: form!.newCardsPerDay,
      srsScheduler: form!.srsScheduler,
      targetRetention: form!.targetRetention,
    });
    await mutate(next, { revalidate: false });
    if (tz && tz !== user!.timezone) {
      await api.patch("/users/me", { timezone: tz });
      await refresh();
    }
    setSaved(true);
  }

  return (
    <div className="page-wrap max-w-4xl! space-y-6">
      <PageHeading
        eyebrow="GÓC NHỎ CỦA RIÊNG BẠN"
        title="Cài đặt học tập"
        description="Chọn một nhịp học thoải mái để duy trì lâu dài."
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon name="target" className="text-primary" />
            Mục tiêu hằng ngày
          </h2>
          <p className="text-sm leading-6 text-muted">
            Bắt đầu vừa sức, tăng dần khi bạn đã quen.
          </p>
          <div className="flex gap-2">
            {(["WORDS", "MINUTES"] as const).map((t) => (
              <button
                key={t}
                onClick={() => upd("dailyGoalType", t)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  form.dailyGoalType === t
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2"
                }`}
              >
                {t === "WORDS" ? "Số từ ôn" : "Số phút"}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            Mục tiêu / ngày
            <input
              type="number"
              min={1}
              value={form.dailyGoalValue}
              onChange={(e) => upd("dailyGoalValue", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            Từ mới / ngày
            <input
              type="number"
              min={0}
              value={form.newCardsPerDay}
              onChange={(e) => upd("newCardsPerDay", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </Card>

        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon name="cards" className="text-primary" />
            Cách sắp lịch ôn
          </h2>
          <p className="text-sm leading-6 text-muted">
            Giúp bạn gặp lại từ vựng vào thời điểm phù hợp.
          </p>
          <div className="flex gap-2">
            {(["sm2", "fsrs"] as const).map((s) => (
              <button
                key={s}
                onClick={() => upd("srsScheduler", s)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  form.srsScheduler === s
                    ? "bg-primary text-primary-fg"
                    : "bg-surface-2"
                }`}
              >
                {s === "sm2" ? "SM-2 (kiểu Anki)" : "FSRS"}
              </button>
            ))}
          </div>
          {form.srsScheduler === "fsrs" && (
            <label className="block text-sm">
              Tỷ lệ nhớ mục tiêu: {Math.round(form.targetRetention * 100)}%
              <input
                type="range"
                min={0.8}
                max={0.97}
                step={0.01}
                value={form.targetRetention}
                onChange={(e) => upd("targetRetention", Number(e.target.value))}
                className="mt-1 w-full"
              />
            </label>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Múi giờ học tập</h2>
          <input
            aria-label="Múi giờ học tập"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted">
            Tên IANA, vd <code>Asia/Ho_Chi_Minh</code>. Streak tính theo múi giờ
            này.
          </p>
        </Card>
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button onClick={() => void save()}>Lưu thay đổi</Button>
        {saved && <span className="text-sm text-good">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
