"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PremiumModal } from "@/components/premium-modal";
import { getTopUpStatus } from "@/lib/payments";
import { usePremiumStatus } from "@/lib/premium";

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
  const [note, setNote] = useState("");

  // Vừa quay lại từ payOS qua returnUrl (?premium=<orderCode>) — cùng cách
  // đọc `?topup=` ở WalletCard, đọc thẳng window.location cho 1 khối nhỏ.
  useEffect(() => {
    const code = Number(
      new URLSearchParams(window.location.search).get("premium"),
    );
    if (!Number.isFinite(code) || code <= 0) return;
    window.history.replaceState({}, "", window.location.pathname);
    void getTopUpStatus(code)
      .then((order) => {
        if (order.status === "PAID") {
          setNote("Nâng cấp Premium thành công! Cảm ơn bạn đã ủng hộ Hanni.");
          void mutate();
        } else if (order.status === "PENDING") {
          setNote("Đang chờ xác nhận thanh toán — thử tải lại trang sau ít phút.");
        } else {
          setNote("Giao dịch đã huỷ hoặc hết hạn.");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !data) return null;

  return (
    <>
      <Card>
        {data.active ? (
          <div className="flex items-center gap-3">
            <span className="icon-tile bg-accent/10 text-accent">
              <Icon name="crown" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                Hanni Premium
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
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
                  Trợ lý AI không giới hạn + khung avatar độc quyền — không
                  khoá bài học nào.
                </p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Icon name="crown" size={17} />
              Nâng cấp ngay
            </Button>
          </div>
        )}
        {note && <p className="mt-3 text-sm text-good">{note}</p>}
      </Card>

      {open && (
        <PremiumModal plans={data.plans} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
