"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { Overlay } from "@/components/overlay";
import { ApiError } from "@/lib/api";
import { createPremiumCheckout, usePaymentsConfigured } from "@/lib/payments";
import { usePremiumStatus } from "@/lib/premium";
import type { PaymentProvider, PremiumPlan } from "@/lib/types";

type IconName = Parameters<typeof Icon>[0]["name"];

/** Các tiện ích bổ sung và hạn mức của hai phiên bản, xem `hanni-server/CLAUDE.md` mục Premium. */
const BENEFITS: { icon: IconName; title: string; summary: string; desc: string; free: string; premium: string }[] = [
  { icon: "camera", title: "Quét ảnh học từ", summary: "Quét ảnh học từ", desc: "Thực đơn, biển hiệu, sách, món ăn — ra từ vựng kèm Hán Việt, lưu thẳng vào ôn tập.", free: "3 ảnh/ngày", premium: "100 ảnh/ngày" },
  { icon: "spark", title: "Trợ lý AI Hanni", summary: "Trợ lý AI Hanni", desc: "Hỏi ngữ pháp, từ vựng, nhờ giải thích câu sai trong đề thi thử.", free: "15 lượt/ngày", premium: "Không giới hạn" },
  { icon: "mic", title: "Luyện nói với AI", summary: "Luyện nói với AI", desc: "Đóng vai tình huống đời thường, có gợi ý câu và nhận xét cuối buổi.", free: "15 lượt/ngày", premium: "Không giới hạn" },
  { icon: "pencil", title: "AI chấm câu, mẹo nhớ, dịch câu", summary: "Sửa câu, dịch & mẹo nhớ", desc: "Đặt câu với từ mới để AI sửa, mẹo nhớ theo âm Hán Việt, phân tích câu ngay ở ô tra từ điển.", free: "10 lượt/ngày", premium: "200 lượt/ngày" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Không mua Premium thì học được gì?", a: "Tất cả bài học: 9 cấp HSK, từ điển, ngữ pháp, ôn tập, đề thi thử. Premium chỉ mở thêm tiện ích AI ở trên." },
  { q: "Có tự động trừ tiền gia hạn không?", a: "Không. Bạn trả 1 lần cho đúng thời hạn đã chọn, hết hạn app tự về bản thường — dữ liệu học vẫn giữ nguyên." },
  { q: "Đang Premium mà mua thêm thì sao?", a: "Thời gian mới được cộng nối tiếp vào hạn hiện tại, không mất ngày nào." },
  { q: "Thanh toán bằng cách nào?", a: "Quét mã QR bằng app ngân hàng bất kỳ (app MoMo cũng quét được) — số tiền và nội dung đã điền sẵn, không cần nhập thẻ. Giao dịch do đối tác thanh toán payOS xử lý; Premium tự kích hoạt ngay khi chuyển khoản thành công." },
];

/** Cách thanh toán của từng cổng — hiện ở bước xác nhận. */
const PAY_STEPS: Record<PaymentProvider, string[]> = {
  payos: [
    "Bấm “Thanh toán” — trang thanh toán hiện mã QR với số tiền đã điền sẵn.",
    "Mở app ngân hàng bất kỳ (hoặc app MoMo), quét mã và xác nhận chuyển khoản. Mã có hiệu lực 15 phút.",
    "Xong là Premium tự kích hoạt, trang tự quay về Hanni.",
  ],
  momo: [
    "Bấm “Thanh toán qua MoMo” — trang thanh toán của MoMo mở ra.",
    "Chọn ví MoMo (quét mã bằng app MoMo), thẻ ATM nội địa hoặc thẻ quốc tế.",
    "Xong là trang tự quay về Hanni và Premium tự kích hoạt.",
  ],
};

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function durationLabel(p: PremiumPlan): string {
  if (p.months === null) return "Trọn đời";
  if (p.months % 12 === 0) return `${p.months / 12} năm`;
  return `${p.months} tháng`;
}

/** Cộng tháng kẹp về ngày cuối tháng đích (31/1 + 1 tháng = 28/2) — khớp
 * `addMonthsClamped()` ở server để ngày hết hạn hiện ra đúng ngày sẽ ghi. */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

export function PremiumModal({
  plans,
  onClose,
}: {
  plans: PremiumPlan[];
  onClose: () => void;
}) {
  const configured = usePaymentsConfigured();
  const status = usePremiumStatus();
  const panel = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const planGroup = useId();
  const shortest = plans
    .filter((p) => p.months !== null)
    .sort((a, b) => a.months! - b.months!)[0];
  // 3 gói chính (ngắn nhất + gói có nhãn), còn lại thu vào "Gói khác" — 5 gói xếp
  // dọc như bản cũ thì phải cuộn mới so được giá.
  const featured = plans.filter((p) => p.badge || p.key === shortest?.key);
  const others = plans.filter((p) => !featured.includes(p));
  const defaultPlan = plans.find((p) => p.badge) ?? plans[0];
  const [selectedKey, setSelectedKey] = useState(defaultPlan?.key ?? "");
  const [step, setStep] = useState<"choose" | "confirm">("choose");
  const [picked, setPicked] = useState<PaymentProvider>("payos");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = plans.find((p) => p.key === selectedKey) ?? null;
  const ready = configured.data?.configured === true;
  // Cổng đang nhận tiền thật. Server cũ chỉ trả { configured } (= payOS). MoMo chưa có khoá thật thì vẫn hiện nhưng khoá
  // lại với nhãn "Sắp ra mắt" — người dùng biết sắp có, và biết hiện tại quét mã QR bằng app MoMo vẫn trả được.
  const isOpen = (p: PaymentProvider) => (p === "payos" ? (configured.data?.payos ?? ready) : configured.data?.momo === true);
  const provider = isOpen(picked) ? picked : "payos";
  const momoSandbox = configured.data?.momoSandbox === true;
  const payLabel = provider === "momo" ? "Thanh toán qua MoMo" : "Thanh toán";

  useEffect(() => {
    panel.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    content.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  function perMonth(p: PremiumPlan): number | null {
    return p.months && p.months > 1 ? Math.round(p.priceVnd / p.months / 100) * 100 : null;
  }

  function saving(p: PremiumPlan): number {
    const base = shortest && p.months ? (shortest.priceVnd / shortest.months!) * p.months : p.originalPriceVnd;
    return base && base > p.priceVnd ? Math.round((1 - p.priceVnd / base) * 100) : 0;
  }

  function validity(p: PremiumPlan): string {
    if (p.months === null) return "Dùng mãi mãi, không cần gia hạn.";
    const s = status.data;
    const extending = !!s?.active && !s.lifetime && !!s.until;
    const end = addMonths(extending ? new Date(s!.until!) : new Date(), p.months);
    const date = end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return extending ? `Cộng nối tiếp hạn hiện tại — dùng tới ${date}.` : `Từ hôm nay tới ${date}.`;
  }

  async function pay() {
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await createPremiumCheckout(selected.key, provider);
      // Điều hướng ra ngoài (trang thanh toán payOS/MoMo), quay về /account?premium=<mã đơn>.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa tạo được link thanh toán, thử lại nhé.");
      setBusy(false);
    }
  }

  return (
    <Overlay>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-title"
          tabIndex={-1}
          className="relative flex max-h-[94dvh] w-full max-w-[1040px] flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl outline-none sm:rounded-2xl"
          style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
        >
          <header className="relative shrink-0 border-b border-accent/15 bg-linear-to-br from-accent/15 via-accent/5 to-transparent px-4 py-4 sm:px-7 sm:py-5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground sm:right-3 sm:top-3"
            >
              <Icon name="close" size={17} />
            </button>
            <div className="flex items-center gap-3 pr-10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
                <Icon name="crown" size={22} />
              </span>
              <div className="min-w-0">
                <h2 id="premium-title" className="text-lg font-bold sm:text-xl">
                  {step === "choose" ? "Hanni Premium" : "Xác nhận gói"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {step === "choose"
                    ? "Thêm tiện ích AI. Mọi bài học vẫn miễn phí."
                    : "Kiểm tra lại trước khi sang trang thanh toán."}
                </p>
              </div>
            </div>
          </header>

          <div ref={content} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-5">
            {step === "choose" ? (
              <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.3fr)] lg:gap-x-5">
                <section aria-labelledby="premium-benefits" className="rounded-2xl border border-accent/20 bg-linear-to-br from-[#fff7e7] to-[#fffcf5] px-3 py-3 sm:px-4 sm:py-4">
                  <h3 id="premium-benefits" className="text-sm font-semibold">Quyền lợi trong mọi gói</h3>
                  <div className="mt-2 flex items-center gap-2.5 border-b border-accent/15 pb-2.5">
                    <Image
                      src="/illustrations/hanni/coach-report.webp"
                      alt=""
                      width={180}
                      height={120}
                      sizes="(min-width: 1024px) 76px, 48px"
                      className="h-auto w-12 shrink-0 lg:w-[76px]"
                    />
                    <div className="min-w-0">
                      <h4 id="premium-coach" className="text-sm font-bold text-accent">Hanni Coach</h4>
                      <p className="mt-0.5 text-xs leading-5 text-muted">Nhận xét tuần, tháng, quý và gợi ý ôn từ.</p>
                    </div>
                  </div>
                  <ul className="mt-2 space-y-2 lg:space-y-3">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit.title} className="flex items-start gap-2 text-xs leading-5">
                        <Icon name={benefit.icon} size={15} className="mt-0.5 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">{benefit.summary}</span>
                        <strong className="shrink-0 font-semibold text-accent">{benefit.premium}</strong>
                      </li>
                    ))}
                  </ul>
                </section>

                <fieldset className="min-w-0">
                  <legend className="font-semibold">Chọn gói</legend>
                  <div className="mt-2.5 grid gap-2 md:grid-cols-3 md:gap-3">
                    {featured.map((plan) => {
                      const on = plan.key === selectedKey;
                      const recommended = plan.key === defaultPlan?.key && plan.badge;
                      const pm = perMonth(plan);
                      const save = saving(plan);
                      return (
                        <label
                          key={plan.key}
                          className={`relative grid min-h-16 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-2xl border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent md:flex md:min-h-32 md:flex-col md:items-stretch md:gap-2.5 md:p-4 ${
                            on ? "border-accent bg-accent/8 ring-1 ring-inset ring-accent" : "border-border bg-surface hover:border-accent/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name={planGroup}
                            value={plan.key}
                            checked={on}
                            onChange={() => setSelectedKey(plan.key)}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 md:absolute md:top-4 md:right-4 ${
                              on ? "border-accent bg-accent text-white" : "border-border"
                            }`}
                          >
                            {on && <Icon name="check" size={11} />}
                          </span>
                          <span className="min-w-0 md:pr-6">
                            <span className="block text-sm font-semibold">{durationLabel(plan)}</span>
                            {recommended ? (
                              <span className="mt-0.5 inline-block rounded-md bg-accent/12 px-1.5 py-0.5 text-xs font-semibold text-accent">
                                {plan.badge}
                              </span>
                            ) : save > 0 && (
                              <span className="mt-0.5 block text-xs font-medium text-accent">Tiết kiệm {save}%</span>
                            )}
                          </span>
                          <span className="text-right md:mt-auto md:min-h-12 md:text-left">
                            <span className="block text-lg leading-tight font-bold whitespace-nowrap tabular-nums md:text-2xl">
                              {formatVnd(plan.priceVnd)}
                            </span>
                            {pm !== null && <span className="mt-0.5 block text-xs whitespace-nowrap text-muted">≈ {formatVnd(pm)}/tháng</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {others.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="sr-only">Gói khác</span>
                      {others.map((plan) => {
                        const on = plan.key === selectedKey;
                        return (
                          <label
                            key={plan.key}
                            className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3 py-1.5 font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                              on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name={planGroup}
                              value={plan.key}
                              checked={on}
                              onChange={() => setSelectedKey(plan.key)}
                              className="sr-only"
                            />
                            {durationLabel(plan)} · {formatVnd(plan.priceVnd)}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                <details className="group rounded-2xl border border-border lg:col-span-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold sm:px-4">
                    So sánh quyền lợi
                    <Icon name="chevron" size={15} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <ul className="divide-y divide-border border-t border-border px-3 sm:px-4">
                    {BENEFITS.map((benefit) => (
                      <li key={benefit.title} className="flex gap-2.5 py-3">
                        <Icon name={benefit.icon} size={17} className="mt-0.5 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{benefit.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-muted">{benefit.desc}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                            <span className="text-muted">Bản thường {benefit.free}</span>
                            <Icon name="arrow" size={12} className="text-muted" />
                            <span className="font-semibold text-accent">Premium {benefit.premium}</span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>

                <details className="group rounded-2xl border border-border lg:col-span-2">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold sm:px-4">
                    Câu hỏi thường gặp
                    <Icon name="chevron" size={15} className="shrink-0 text-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <dl className="divide-y divide-border border-t border-border px-3 sm:px-4">
                    {FAQ.map((f) => (
                      <div key={f.q} className="py-3">
                        <dt className="text-sm font-semibold">{f.q}</dt>
                        <dd className="mt-1 text-xs leading-5 text-muted">{f.a}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
            ) : (
              selected && (
                <>
                  <div className="rounded-2xl border-2 border-accent bg-accent/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Hanni Premium · {durationLabel(selected)}</p>
                        <p className="mt-1 text-xs text-muted">{validity(selected)}</p>
                      </div>
                      <p className="shrink-0 text-xl font-bold">{formatVnd(selected.priceVnd)}</p>
                    </div>
                  </div>

                  <section aria-labelledby="pay-method" className="mt-6">
                    <h3 id="pay-method" className="text-sm font-semibold">Cách thanh toán</h3>
                    <div role="radiogroup" aria-labelledby="pay-method" className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {(["payos", "momo"] as const).map((p) => {
                        const open = isOpen(p);
                        const on = open && p === provider;
                        return (
                          <button
                            key={p}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={!open}
                            onClick={() => setPicked(p)}
                            className={`flex min-h-[64px] items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors ${
                              on
                                ? "border-accent bg-accent/5"
                                : open
                                  ? "border-border hover:border-accent/40"
                                  : "cursor-not-allowed border-dashed border-border bg-surface-2/50"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                                on ? "border-accent bg-accent text-white" : "border-border"
                              }`}
                            >
                              {on && <Icon name="check" size={11} />}
                            </span>
                            <span className="min-w-0">
                              <span className={`flex flex-wrap items-center gap-1.5 text-sm font-semibold ${open ? "" : "text-muted"}`}>
                                {p === "payos" ? "Quét mã QR ngân hàng" : "Ví MoMo · thẻ ATM · thẻ Visa"}
                                {!open && (
                                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted">Sắp ra mắt</span>
                                )}
                                {open && p === "momo" && momoSandbox && (
                                  <span className="rounded-full bg-warn/10 px-2 py-0.5 text-xs font-bold text-warn">Thử nghiệm</span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-muted">
                                {p === "payos"
                                  ? "Dùng app ngân hàng bất kỳ hoặc app MoMo để quét."
                                  : open
                                    ? "Thanh toán trên trang của MoMo."
                                    : "Đang hoàn thiện. Có ví MoMo? Chọn quét mã QR rồi quét bằng app MoMo."}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <h3 className="mt-6 text-sm font-semibold">Thanh toán thế nào?</h3>
                  <ol className="mt-3 space-y-3">
                    {PAY_STEPS[provider].map((t, i) => (
                      <li key={t} className="flex gap-3 text-sm leading-6">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
                          {i + 1}
                        </span>
                        {t}
                      </li>
                    ))}
                  </ol>

                  <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["lock", "Không lưu thẻ, không tự gia hạn"],
                        ["check", "Kích hoạt tự động ngay"],
                        ["refresh", "Hết hạn tự về bản thường, giữ nguyên dữ liệu"],
                      ] as const
                    ).map(([icon, text]) => (
                      <li key={text} className="flex items-center gap-2 rounded-xl bg-surface-2/60 px-3 py-2.5 text-xs font-medium">
                        <Icon name={icon} size={15} className="shrink-0 text-good" />
                        {text}
                      </li>
                    ))}
                  </ul>
                  {provider === "momo" && momoSandbox && (
                    <p className="mt-4 rounded-xl bg-warn/10 px-3.5 py-3 text-xs leading-5 text-warn">
                      Đang dùng bản thử của MoMo (tiền ảo). Thẻ ATM thử: 9704 0000 0000 0018 · NGUYEN VAN A · 03/07 ·
                      mã OTP: OTP.
                    </p>
                  )}
                  {error && (
                    <div className="mt-4">
                      <ErrorNote>{error}</ErrorNote>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          <footer className="shrink-0 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-4">
            {status.data?.lifetime ? (
              <p className="py-2 text-center text-sm text-muted">Bạn đang có Premium trọn đời — không cần mua thêm.</p>
            ) : !configured.isLoading && !ready ? (
              <div className="flex flex-col items-center gap-1 py-1 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-sm">
                  <span className="font-semibold">Sắp mở bán.</span>{" "}
                  <span className="text-muted">Trong lúc chờ, mọi bài học vẫn miễn phí.</span>
                </p>
                <Button disabled className="w-full justify-center sm:w-auto">
                  <Icon name="clock" size={16} />
                  Sắp mở bán
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {step === "confirm" ? (
                  <Button variant="secondary" onClick={() => setStep("choose")} disabled={busy}>
                    <Icon name="back" size={16} />
                    Đổi gói
                  </Button>
                ) : (
                  selected && (
                    <p className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{durationLabel(selected)}</span>
                      <span className="text-muted"> · {formatVnd(selected.priceVnd)}</span>
                    </p>
                  )
                )}
                <Button
                  className={`justify-center ${step === "confirm" ? "flex-1" : ""}`}
                  disabled={!selected || busy || configured.isLoading}
                  onClick={() => (step === "choose" ? setStep("confirm") : void pay())}
                >
                  {step === "choose" ? (
                    <>
                      Tiếp tục
                      <Icon name="arrow" size={16} />
                    </>
                  ) : busy ? (
                    "Đang mở trang thanh toán…"
                  ) : (
                    <>
                      <Icon name="lock" size={16} />
                      {payLabel}
                    </>
                  )}
                </Button>
              </div>
            )}
          </footer>
        </div>
      </div>
    </Overlay>
  );
}
