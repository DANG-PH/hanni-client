import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nguồn dữ liệu — Hanni" };

const SOURCES = [
  {
    name: "krmanik/HSK-3.0 (bản 2025-11)",
    url: "https://github.com/krmanik/HSK-3.0",
    license: "CC BY-SA 4.0",
    use: "Đại cương HSK 3.0 chính thức (cấp, pinyin, từ loại), nghĩa tiếng Anh theo cấp, chữ phồn thể và 10.900 file audio phát âm.",
  },
  {
    name: "CVDICT — Từ điển Hán Việt",
    url: "https://github.com/ph0ngp/CVDICT",
    license: "CC BY-SA 4.0",
    use: "Nghĩa tiếng Việt (dịch từ CC-CEDICT bằng AI, rà soát một phần bằng tay).",
  },
  {
    name: "CC-CEDICT · Pleco · SUBTLEX-CH / BCC",
    url: "https://www.mdbg.net/chinese/dictionary?page=cc-cedict",
    license: "CC BY-SA 4.0 / MIT",
    use: "Nghĩa tiếng Anh và tần suất từ (dùng gián tiếp qua krmanik/HSK-3.0).",
  },
];

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Nguồn dữ liệu</h1>
      <p className="text-muted">
        Dữ liệu từ vựng của Hanni được xây dựng từ các nguồn mở dưới đây. Danh sách
        từ và phân cấp bám theo đại cương HSK 3.0 chính thức (CLEC/CTI, 2025). Phần
        dữ liệu từ vựng tổng hợp lại được chia sẻ theo giấy phép{" "}
        <strong>CC BY-SA 4.0</strong>.
      </p>

      <div className="space-y-3">
        {SOURCES.map((s) => (
          <div
            key={s.name}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {s.name}
              </a>
              <span className="text-xs text-muted">{s.license}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{s.use}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Nếu bạn là tác giả một nguồn và muốn điều chỉnh cách ghi công, liên hệ với
        chúng tôi.
      </p>
    </div>
  );
}
