"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Button, Card, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { Icon } from "@/components/icon";
import { api, apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { TIMEZONES, detectTimezone } from "@/lib/timezones";
import type { Me, UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const { user, loading, refresh } = useRequireAuth();
  const { data, mutate, error } = useSWR<UserSettings>(
    user ? "/users/me/settings" : null,
    (path: string) => apiFetch<UserSettings>(path),
  );

  if (loading || !user) return <Spinner />;
  return (
    <div className="page-wrap space-y-7">
      <PageHeading
        eyebrow="NHỊP HỌC CỦA BẠN"
        title="Cài đặt học tập"
        description="Một mục tiêu vừa sức, một thói quen bền lâu."
      >
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary"
        >
          <Icon name="back" size={16} />
          Tài khoản của tôi
        </Link>
      </PageHeading>
      {error && !data ? (
        <ErrorNote>
          Chưa tải được cài đặt.{" "}
          <button
            className="font-semibold underline"
            onClick={() => void mutate()}
          >
            Thử lại
          </button>
        </ErrorNote>
      ) : !data ? (
        <Spinner />
      ) : (
        <SettingsForm
          key={user.id}
          user={user}
          initialSettings={data}
          onSaved={async (next) => {
            await mutate(next, { revalidate: false });
          }}
          refreshUser={refresh}
        />
      )}
    </div>
  );
}

function SettingsForm({
  user,
  initialSettings,
  onSaved,
  refreshUser,
}: {
  user: Me;
  initialSettings: UserSettings;
  onSaved: (settings: UserSettings) => Promise<void>;
  refreshUser: () => Promise<void>;
}) {
  const [form, setForm] = useState(initialSettings);
  const [timezone, setTimezone] = useState(user.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  function update<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    setSaved(false);
    if (
      !Number.isInteger(form.dailyGoalValue) ||
      form.dailyGoalValue < 1 ||
      !Number.isInteger(form.newCardsPerDay) ||
      form.newCardsPerDay < 0
    ) {
      setSaveError(
        "Mục tiêu cần là số nguyên lớn hơn 0; số từ mới không được âm.",
      );
      return;
    }
    setSaving(true);
    try {
      const next = await api.patch<UserSettings>("/users/me/settings", {
        dailyGoalType: form.dailyGoalType,
        dailyGoalValue: form.dailyGoalValue,
        newCardsPerDay: form.newCardsPerDay,
        srsScheduler: form.srsScheduler,
        targetRetention: form.targetRetention,
      });
      setForm(next);
      await onSaved(next);
      if (timezone && timezone !== user.timezone) {
        await api.patch("/users/me", { timezone });
      }
      await refreshUser();
      setSaved(true);
    } catch {
      setSaveError(
        "Chưa lưu được đầy đủ thay đổi. Vui lòng kiểm tra kết nối và thử lại.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="grid items-start gap-6 lg:grid-cols-[1fr_280px]"
    >
      <div className="space-y-5">
        <fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
          <Card>
            <div className="mb-6 flex items-start gap-3">
              <span className="icon-tile">
                <Icon name="target" />
              </span>
              <div>
                <h2 className="font-semibold">Mục tiêu hằng ngày</h2>
                <p className="mt-1 text-sm text-muted">
                  Chọn nhịp học phù hợp với thời gian của bạn.
                </p>
              </div>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3">
              {(["WORDS", "MINUTES"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  aria-pressed={form.dailyGoalType === type}
                  onClick={() => update("dailyGoalType", type)}
                  className={`motion-button flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${form.dailyGoalType === type ? "border-primary/35 bg-primary/5 text-primary" : "border-border bg-surface text-muted hover:bg-surface-2"}`}
                >
                  <Icon name={type === "WORDS" ? "cards" : "clock"} size={17} />
                  {type === "WORDS" ? "Theo số từ ôn" : "Theo số phút"}
                </button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Mục tiêu mỗi ngày{" "}
                <span className="font-normal text-muted">
                  ({form.dailyGoalType === "WORDS" ? "từ" : "phút"})
                </span>
                <input
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={form.dailyGoalValue}
                  onChange={(event) =>
                    update("dailyGoalValue", Number(event.target.value))
                  }
                  className="field mt-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Số từ mới mỗi ngày
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={form.newCardsPerDay}
                  onChange={(event) =>
                    update("newCardsPerDay", Number(event.target.value))
                  }
                  className="field mt-2"
                />
                <span className="mt-2 block text-xs font-normal text-muted">
                  Đặt bằng 0 nếu bạn chỉ muốn ôn từ đã học.
                </span>
              </label>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-start gap-3">
              <span className="icon-tile">
                <Icon name="refresh" />
              </span>
              <div>
                <h2 className="font-semibold">Cách sắp lịch ôn</h2>
                <p className="mt-1 text-sm text-muted">
                  Gặp lại từ vựng vào thời điểm phù hợp.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "sm2",
                    title: "Tiêu chuẩn",
                    description: "Ôn tập theo mức độ ghi nhớ sau mỗi lượt học.",
                  },
                  {
                    value: "fsrs",
                    title: "Linh hoạt",
                    description:
                      "Điều chỉnh lịch ôn theo tỷ lệ nhớ bạn mong muốn.",
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={form.srsScheduler === option.value}
                  onClick={() => update("srsScheduler", option.value)}
                  className={`motion-button rounded-xl border p-4 text-left ${form.srsScheduler === option.value ? "border-primary/35 bg-primary/5" : "border-border hover:bg-surface-2"}`}
                >
                  <span className="flex items-center justify-between text-sm font-semibold">
                    {option.title}
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${form.srsScheduler === option.value ? "border-primary bg-primary text-primary-fg" : "border-border"}`}
                    >
                      {form.srsScheduler === option.value && (
                        <Icon name="check" size={12} />
                      )}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-muted">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
            {form.srsScheduler === "fsrs" && (
              <label className="mt-6 block text-sm">
                <span className="flex justify-between gap-2">
                  <span>Tỷ lệ ghi nhớ mong muốn</span>
                  <strong className="text-primary">
                    {Math.round(form.targetRetention * 100)}%
                  </strong>
                </span>
                <input
                  type="range"
                  min={0.8}
                  max={0.97}
                  step={0.01}
                  value={form.targetRetention}
                  onChange={(event) =>
                    update("targetRetention", Number(event.target.value))
                  }
                  className="mt-4 w-full accent-primary"
                />
                <span className="mt-2 block text-xs leading-5 text-muted">
                  Tỷ lệ càng cao, bạn sẽ gặp lại từ thường xuyên hơn.
                </span>
              </label>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex items-start gap-3">
              <span className="icon-tile">
                <Icon name="clock" />
              </span>
              <div>
                <h2 className="font-semibold">Múi giờ học tập</h2>
                <p className="mt-1 text-sm text-muted">
                  Dùng để tính ngày học và chuỗi ngày liên tiếp.
                </p>
              </div>
            </div>
            <label
              htmlFor="study-timezone"
              className="mb-2 block text-sm font-medium"
            >
              Múi giờ của bạn
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                id="study-timezone"
                required
                value={timezone}
                onChange={(event) => {
                  setTimezone(event.target.value);
                  setSaved(false);
                }}
                className="field min-w-0 flex-1"
              >
                {!TIMEZONES.some((item) => item.value === timezone) && (
                  <option value={timezone}>{timezone || "Chọn múi giờ"}</option>
                )}
                {TIMEZONES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} — {item.value}
                  </option>
                ))}
              </select>
              <Button
                variant="secondary"
                onClick={() => {
                  const detected = detectTimezone();
                  if (detected) {
                    setTimezone(detected);
                    setSaved(false);
                  }
                }}
              >
                Tự phát hiện
              </Button>
            </div>
          </Card>
        </fieldset>
        {saveError && <ErrorNote>{saveError}</ErrorNote>}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
          <Button type="submit" disabled={saving}>
            <Icon
              name={saving ? "refresh" : "check"}
              size={17}
              className={saving ? "animate-spin" : ""}
            />
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
          {saved && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-sm text-good"
            >
              <Icon name="check" size={16} />
              Đã lưu cài đặt của bạn
            </p>
          )}
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="border-primary/15 bg-primary/5!">
          <Icon name="spark" className="mb-4 text-primary" size={25} />
          <h2 className="font-semibold">Đều đặn là đủ tốt</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Bắt đầu với một mục tiêu nhỏ. Khi việc học đã trở thành thói quen,
            bạn có thể quay lại đây để tăng dần nhịp học.
          </p>
          <Link
            href="/progress"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Xem tiến độ của tôi <Icon name="arrow" size={16} />
          </Link>
        </Card>
        <p className="px-2 text-xs leading-5 text-muted">
          Cài đặt được lưu vào tài khoản để áp dụng cho những lần học tiếp theo.
        </p>
      </aside>
    </form>
  );
}
