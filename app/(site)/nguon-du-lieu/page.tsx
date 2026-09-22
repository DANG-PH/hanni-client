import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nguồn dữ liệu — Hanni",
  description:
    "Ghi công các nguồn dữ liệu mở (từ vựng, âm đọc, nghĩa tiếng Việt) mà Hanni sử dụng, theo đúng giấy phép Creative Commons CC BY-SA 4.0.",
};

function SourceCard({
  name,
  url,
  license,
  children,
}: {
  name: string;
  url: string;
  license: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {name}
          </a>
        </h2>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
          {license}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}

export default function NguonDuLieuPage() {
  return (
    <div className="page-wrap max-w-3xl! space-y-8 py-12!">
      <section className="reveal text-center">
        <p className="eyebrow">MINH BẠCH VỀ DỮ LIỆU</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Nguồn dữ liệu &amp; ghi công
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          Từ vựng, âm đọc và audio phát âm của Hanni lấy từ các nguồn mở dưới
          đây, được chia sẻ lại đúng theo giấy phép gốc.
        </p>
      </section>

      <div className="space-y-4">
        <SourceCard
          name="krmanik/HSK-3.0"
          url="https://github.com/krmanik/HSK-3.0"
          license="CC BY-SA 4.0"
        >
          Tác giả: Mani. Bản 2025-11 — cung cấp đại cương thi chính thức (cấp
          + pinyin + từ loại), bản dịch tiếng Anh theo từng cấp, chữ phồn thể,
          và 10.900 file audio phát âm. Danh sách từ + phân cấp gốc dựa trên
          đại cương HSK 3.0 do CLEC/CTI (Bộ Giáo dục Trung Quốc) phát hành.
          Nghĩa tiếng Anh dựa trên CC-CEDICT (CC BY-SA 4.0) và danh sách Pleco
          HSK 3.0 (MIT). Tần suất từ: SUBTLEX-CH / BCC corpus (CC BY-SA 4.0).
        </SourceCard>

        <SourceCard
          name="ph0ngp/CVDICT — Từ điển Hán Việt"
          url="https://github.com/ph0ngp/CVDICT"
          license="CC BY-SA 4.0"
        >
          Tác giả: Phong Phan. Nghĩa tiếng Việt trong Hanni dịch từ CC-CEDICT
          bằng mô hình AI, có rà soát một phần bằng tay — vẫn có thể còn sai
          sót, mọi góp ý đều được hoan nghênh.
        </SourceCard>

        <SourceCard
          name="Unihan Database"
          url="https://www.unicode.org/charts/unihan.html"
          license="Unicode License V3"
        >
          Tác giả: Unicode Consortium. Cung cấp âm Hán Việt tra theo từng ký
          tự (field kVietnamese) — dùng để hiện thêm âm đọc Hán Việt bên cạnh
          từ vựng (vd. 学生 đọc Hán Việt là &quot;học sinh&quot;), giúp người
          Việt liên tưởng nhanh hơn nhờ từ vựng tiếng Việt vay mượn gốc Hán.
          Hanni bù thêm một số ký tự thông dụng còn thiếu và sửa vài âm đọc
          hiếm gặp, soạn tay dựa trên cách dùng tiếng Việt hiện đại.
        </SourceCard>
      </div>

      <div className="panel p-6">
        <h2 className="font-semibold">Bộ dữ liệu phái sinh của Hanni</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Bộ từ vựng tổng hợp (~10.900 từ, 9 cấp) do Hanni ghép từ các nguồn
          trên, được phát hành lại theo đúng giấy phép{" "}
          <strong className="text-foreground">CC BY-SA 4.0</strong> (điều
          khoản share-alike). Mã nguồn ứng dụng Hanni không bị ràng buộc bởi
          giấy phép này.
        </p>
      </div>

      <p className="text-center text-xs leading-6 text-muted">
        Có thắc mắc về nguồn dữ liệu hoặc muốn báo lỗi? Quay lại{" "}
        <Link href="/" className="text-primary hover:underline">
          trang chủ
        </Link>{" "}
        để liên hệ với Hanni. Hoặc dùng thử ngay:{" "}
        <Link href="/tu-dien" className="text-primary hover:underline">
          tra từ điển
        </Link>{" "}
        ·{" "}
        <Link href="/hoc-thu" className="text-primary hover:underline">
          học thử 8 từ
        </Link>
      </p>
    </div>
  );
}
