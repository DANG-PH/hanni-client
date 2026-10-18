"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ApiError } from "@/lib/api";
import { createPremiumCheckout, useTopUpConfigured } from "@/lib/payments";
import { usePremiumStatus } from "@/lib/premium";
import type { PremiumPlan } from "@/lib/types";

type IconName = Parameters<typeof Icon>[0]["name"];

/** Quyền lợi — CHỈ ghi đúng những gì THẬT SỰ đã có code (không hứa suông), xem
 * `hanni-server/CLAUDE.md` mục Premium. Mỗi ô ghi rõ bản thường được bao nhiêu
 * để so sánh ngay tại chỗ (bảng 3 cột cũ chữ 12px khó đọc trên điện thoại). */
const BENEFITS: { icon: IconName; title: string; desc: string; free: string; premium: string }[] = [
  { icon: "chart", title: "Hanni Coach", desc: "AI đọc báo cáo tuần/tháng/quý, chỉ ra phần yếu, mẹo nhớ từ hay quên theo âm Hán Việt.", free: "Không có", premium: "Mọi kỳ báo cáo" },
  { icon: "camera", title: "Quét ảnh học từ", desc: "Thực đơn, biển hiệu, sách, món ăn — ra từ vựng kèm Hán Việt, lưu thẳng vào ôn tập.", free: "3 ảnh/ngày", premium: "100 ảnh/ngày" },
  { icon: "spark", title: "Trợ lý AI Hanni", desc: "Hỏi ngữ pháp, từ vựng, nhờ giải thích câu sai trong đề thi thử.", free: "15 lượt/ngày", premium: "Không giới hạn" },
  { icon: "mic", title: "Luyện nói với AI", desc: "Đóng vai tình huống đời thường, có gợi ý câu và nhận xét cuối buổi.", free: "15 lượt/ngày", premium: "Không giới hạn" },
  { icon: "pencil", title: "AI chấm câu, mẹo nhớ, dịch câu", desc: "Đặt câu với từ mới để AI sửa, mẹo nhớ theo âm Hán Việt, phân tích câu ngay ở ô tra từ điển.", free: "10 lượt/ngày", premium: "200 lượt/ngày" },
  { icon: "flame", title: "Xu x2", desc: "Gấp đôi xu từ minigame và nhiệm vụ ngày — đổi lá chắn giữ chuỗi ngày học.", free: "x1", premium: "x2" },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Không mua Premium thì học được gì?", a: "Tất cả bài học: 9 cấp HSK, từ điển, ngữ pháp, ôn tập, đề thi thử. Premium chỉ mở thêm tiện ích AI ở trên." },
  { q: "Có tự động trừ tiền gia hạn không?", a: "Không. Bạn trả 1 lần cho đúng thời hạn đã chọn, hết hạn app tự về bản thường — dữ liệu học vẫn giữ nguyên." },
  { q: "Đang Premium mà mua thêm thì sao?", a: "Thời gian mới được cộng nối tiếp vào hạn hiện tại, không mất ngày nào." },
  { q: "Thanh toán bằng cách nào?", a: "Qua cổng payOS: quét mã VietQR bằng app ngân hàng bất kỳ. Premium kích hoạt tự động ngay khi giao dịch thành công." },
];

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
  const configured = useTopUpConfigured();
  const status = usePremiumStatus();
  const panel = useRef<HTMLDivElement>(null);
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = plans.find((p) => p.key === selectedKey) ?? null;
  const ready = configured.data?.configured === true;

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
      const res = await createPremiumCheckout(selected.key);
      // Điều hướng ra ngoài (trang thanh toán payOS), quay về /account?premium=<mã đơn>.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chưa tạo được link thanh toán, thử lại nhé.");
      setBusy(false);
    }
  }

  return (
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
        className="relative flex max-h-[92dvh] w-full max-w-[880px] flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl outline-none sm:rounded-3xl"
        style={{ animation: "reveal-in 420ms var(--motion-ease) both" }}
      >
        <header className="relative shrink-0 border-b border-border bg-gradient-to-br from-accent/20 via-accent/5 to-transparent px-5 pb-5 pt-6 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground"
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
                  ? "Mở thêm tiện ích AI — mọi bài học vẫn miễn phí."
                  : "Kiểm tra lại trước khi sang trang thanh toán."}
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          {step === "choose" ? (
            <>
              <section aria-label="Quyền lợi Premium" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-center gap-3 rounded-2xl border border-border p-3 sm:items-start sm:p-3.5">
                    <span className="icon-tile shrink-0 bg-accent/10 text-accent">
                      <Icon name={b.icon} size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{b.title}</p>
                      <p className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{b.desc}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs sm:mt-1.5">
                        <span className="text-muted line-through decoration-muted/50">{b.free}</span>
                        <Icon name="arrow" size={12} className="text-muted" />
                        <span className="font-semibold text-accent">{b.premium}</span>
                      </p>
                    </div>
                  </div>
                ))}
                <p className="flex items-center gap-2 rounded-2xl bg-good/10 px-3.5 py-3 text-xs font-medium leading-5 text-good">
                  <Icon name="check" size={15} className="shrink-0" />
                  9 cấp HSK, từ điển, ngữ pháp, ôn tập, đề thi thử — bản thường cũng có đủ, không khoá bài nào.
                </p>
              </section>

              <section aria-labelledby="premium-plans" className="mt-6">
                <h3 id="premium-plans" className="text-sm font-semibold">Chọn gói</h3>
                <div role="radiogroup" aria-labelledby="premium-plans" className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {featured.map((plan) => {
                    const on = plan.key === selectedKey;
                    const pm = perMonth(plan);
                    const save = saving(plan);
                    return (
                      <button
                        key={plan.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSelectedKey(plan.key)}
                        className={`relative rounded-2xl border-2 p-4 text-left transition-colors ${
                          on ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                            {plan.badge}
                          </span>
                        )}
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{durationLabel(plan)}</span>
                          <span
                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                              on ? "border-accent bg-accent text-white" : "border-border"
                            }`}
                          >
                            {on && <Icon name="check" size={11} />}
                          </span>
                        </span>
                        <span className="mt-2 block text-xl font-bold">{formatVnd(plan.priceVnd)}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {pm ? `≈ ${formatVnd(pm)}/tháng` : plan.months === null ? "Trả 1 lần, dùng mãi" : "Trả theo từng tháng"}
                        </span>
                        {save > 0 && (
                          <span className="mt-2 inline-block rounded-full bg-good/10 px-2 py-0.5 text-[11px] font-semibold text-good">
                            Tiết kiệm {save}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {others.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted">Gói khác:</span>
                    {others.map((plan) => {
                      const on = plan.key === selectedKey;
                      return (
                        <button
                          key={plan.key}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setSelectedKey(plan.key)}
                          className={`rounded-full border px-3 py-1.5 font-medium transition-colors ${
                            on ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted hover:border-accent/40"
                          }`}
                        >
                          {durationLabel(plan)} · {formatVnd(plan.priceVnd)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section aria-label="Câu hỏi thường gặp" className="mt-6 divide-y divide-border rounded-2xl border border-border">
                {FAQ.map((f) => (
                  <details key={f.q} className="group px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                      {f.q}
                      <Icon name="chevron" size={15} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-sm leading-6 text-muted">{f.a}</p>
                  </details>
                ))}
              </section>
            </>
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

                <h3 className="mt-6 text-sm font-semibold">Thanh toán thế nào?</h3>
                <ol className="mt-3 space-y-3">
                  {[
                    "Bấm “Thanh toán qua payOS” — trang thanh toán của payOS mở ra.",
                    "Quét mã VietQR bằng app ngân hàng bất kỳ (hoặc chuyển khoản đúng nội dung trên trang).",
                    "Xong là Premium tự kích hoạt, trang tự quay về Hanni.",
                  ].map((t, i) => (
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
                {error && (
                  <div className="mt-4">
                    <ErrorNote>{error}</ErrorNote>
                  </div>
                )}
              </>
            )
          )}
        </div>

        <footer className="shrink-0 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-4">
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
                    Thanh toán qua payOS
                  </>
                )}
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
