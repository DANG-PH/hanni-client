"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PremiumModal } from "@/components/premium-modal";
import { getOrderStatus } from "@/lib/payments";
import { usePremiumStatus } from "@/lib/premium";

/** Hỏi lại trạng thái đơn tối đa 10 lần, cách nhau 3 giây — mỗi lần server tự hỏi lại payOS/MoMo nếu đơn còn PENDING. */
const STATUS_POLL_TRIES = 10;
const STATUS_POLL_MS = 3000;

/** Đọc tham số quay về từ cổng thanh toán. Cổng tự nối thêm tham số của họ (payOS: code, status, cancel…; MoMo:
 * resultCode, orderId…) — nếu cổng nối bằng "?" thay vì "&" thì giá trị `premium` thành "12?code=00", nên lấy phần số
 * đầu (parseInt) thay vì Number(). */
function readReturn(search: string) {
  const params = new URLSearchParams(search);
  const code = Number.parseInt(params.get("premium") ?? "", 10);
  if (!Number.isFinite(code) || code <= 0) return null;
  const momoResult = params.get("resultCode");
  return {
    code,
    // payOS: cancelUrl có `&cancelled=1` (server tự thêm) + `cancel=true`; MoMo: resultCode 1006 = người dùng huỷ.
    cancelled: !!params.get("cancelled") || params.get("cancel") === "true" || momoResult === "1006",
    // MoMo báo lỗi khác (thẻ bị từ chối, hết hạn…) — chỉ để hiện lời nhắn, KHÔNG dùng để cộng Premium (tham số trên URL
    // không có chữ ký; server mới là nơi xác nhận).
    failed: momoResult !== null && momoResult !== "0" && momoResult !== "1006",
  };
}

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
  // Bấm "Huỷ" ở trang payOS/MoMo → biết ngay từ URL, không cần hỏi server.
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(() => {
    if (typeof window === "undefined") return null;
    const back = readReturn(window.location.search);
    if (back?.cancelled) return { text: "Bạn đã huỷ thanh toán — chưa bị trừ tiền.", ok: false };
    if (back?.failed) return { text: "Thanh toán MoMo chưa thành công — chưa bị trừ tiền, thử lại nhé.", ok: false };
    return null;
  });

  // LUỒNG — vừa quay lại từ cổng thanh toán (`/account?premium=<mã đơn>`, xem `PaymentsService.createPremiumCheckout`
  // ở server). Đọc thẳng window.location cho 1 khối nhỏ, khỏi bọc cả trang trong <Suspense>.
  // Cổng đưa trình duyệt về NGAY khi trả xong, còn webhook có thể tới sau (hoặc không tới) — nên hỏi
  // GET /payments/orders/:mã; đơn còn PENDING thì SERVER tự hỏi lại payOS/MoMo rồi mới trả lời. Vẫn PENDING thì hỏi lại
  // vài lần; quá 30 giây thì job đối soát 5 phút/lần ở server sẽ tự cộng Premium.
  useEffect(() => {
    const back = readReturn(window.location.search);
    if (!back) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (back.cancelled || back.failed) return; // lời nhắn đã đặt sẵn lúc khởi tạo state
    const code = back.code;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      void getOrderStatus(code)
        .then((order) => {
          if (order.status === "PAID" && order.sandbox) {
            setNote({ text: "Thanh toán thử MoMo thành công (tiền ảo) — bản thử nghiệm không kích hoạt Premium.", ok: false });
          } else if (order.status === "PAID") {
            setNote({ text: "Nâng cấp Premium thành công! Cảm ơn bạn đã ủng hộ Hanni.", ok: true });
            void mutate();
          } else if (order.status === "PENDING" && ++tries < STATUS_POLL_TRIES) {
            setNote({ text: "Đang chờ ngân hàng xác nhận thanh toán…", ok: true });
            timer = setTimeout(check, STATUS_POLL_MS);
          } else if (order.status === "PENDING") {
            setNote({ text: "Chưa nhận được xác nhận thanh toán — Hanni tự kiểm tra lại mỗi 5 phút, tải lại trang sau ít phút nhé.", ok: false });
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
