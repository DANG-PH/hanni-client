"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PremiumModal } from "@/components/premium-modal";
import { getOrderStatus } from "@/lib/payments";
import { usePremiumStatus } from "@/lib/premium";

/** Hỏi lại trạng thái đơn tối đa 10 lần, cách nhau 3 giây (~30 giây chờ webhook payOS). */
const STATUS_POLL_TRIES = 10;
const STATUS_POLL_MS = 3000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Thẻ Premium ở `/account` — hiện trạng thái nếu đang Premium, ngược lại
 * hiện lời mời nâng cấp (bấm mở `PremiumModal`, xem quyền lợi + bảng giá).
 * Xem `hanni-server/CLAUDE.md` mục Premium cho lý do KHÔNG khoá nội dung
 * học nào, chỉ mở thêm tiện ích.
 */
export function PremiumSection() {
  const { data, isLoading, mutate } = usePremiumStatus();
  const [open, setOpen] = useState(false);
  // Bấm "Huỷ" ở trang payOS → quay về qua cancelUrl (`&cancelled=1`): biết ngay từ URL, không cần hỏi server.
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("premium") && params.get("cancelled")
      ? { text: "Bạn đã huỷ thanh toán — chưa bị trừ tiền.", ok: false }
      : null;
  });

  // Vừa quay lại từ payOS (returnUrl `?premium=<mã đơn>`, cancelUrl thêm `&cancelled=1` — xem
  // `PaymentsService.createPremiumCheckout` ở server) — đọc thẳng window.location cho 1 khối nhỏ,
  // khỏi bọc cả trang trong <Suspense>.
  // payOS đưa trình duyệt về NGAY khi chuyển khoản xong, còn webhook báo đã nhận tiền (thứ thật sự
  // gia hạn Premium) có thể tới sau vài giây — nên đơn còn PENDING thì hỏi lại vài lần thay vì bắt
  // người dùng tự tải lại trang.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = Number(params.get("premium"));
    if (!Number.isFinite(code) || code <= 0) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (params.get("cancelled")) return; // lời nhắn đã đặt sẵn lúc khởi tạo state
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      void getOrderStatus(code)
        .then((order) => {
          if (order.status === "PAID") {
            setNote({ text: "Nâng cấp Premium thành công! Cảm ơn bạn đã ủng hộ Hanni.", ok: true });
            void mutate();
          } else if (order.status === "PENDING" && ++tries < STATUS_POLL_TRIES) {
            setNote({ text: "Đang chờ ngân hàng xác nhận thanh toán…", ok: true });
            timer = setTimeout(check, STATUS_POLL_MS);
          } else if (order.status === "PENDING") {
            setNote({ text: "Chưa nhận được xác nhận thanh toán — thử tải lại trang sau ít phút.", ok: false });
          } else {
            setNote({ text: "Giao dịch đã huỷ hoặc hết hạn.", ok: false });
          }
        })
        .catch(() => {});
    };
    check();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !data) return null;

  return (
    <>
      <Card>
        {data.active ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="icon-tile bg-accent/10 text-accent">
              <Icon name="crown" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                Hanni Premium
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  ĐANG DÙNG
                </span>
              </h2>
              <p className="mt-1 text-sm text-muted">
                {data.lifetime
                  ? "Gói trọn đời — dùng mãi mãi."
                  : `Còn hiệu lực đến ${formatDate(data.until!)}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="icon-tile bg-accent/10 text-accent">
                <Icon name="crown" />
              </span>
              <div>
                <h2 className="font-semibold">Nâng cấp Premium</h2>
                <p className="mt-1 text-sm text-muted">
                  Hanni Coach nhận xét bằng AI, quét ảnh 100 lượt/ngày, trợ lý
                  AI không giới hạn — không khoá bài học nào.
                </p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Icon name="crown" size={17} />
              Nâng cấp ngay
            </Button>
          </div>
        )}
        {note && <p className={`mt-3 text-sm ${note.ok ? "text-good" : "text-muted"}`}>{note.text}</p>}
      </Card>

      {open && (
        <PremiumModal plans={data.plans} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
