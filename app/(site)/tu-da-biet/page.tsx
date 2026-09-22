/**
 * "Từ tiếng Trung bạn đã biết sẵn" — hook thu hút NGƯỜI CHƯA HỌC tiếng Trung.
 *
 * Khác mọi trang khác ở chỗ nhắm vào người chưa từng học: thay vì mời họ bắt
 * đầu từ số 0 (nghe rất nản), cho thấy họ ĐÃ biết sẵn hàng trăm từ nhờ tiếng
 * Việt — 电话 đọc Hán Việt là "điện thoại", 世界 là "thế giới", 机会 là "cơ
 * hội". Tất cả đều là từ dùng hàng ngày.
 *
 * Đây là nội dung không từ điển Trung-Việt nào khác dựng được (cần cùng lúc
 * âm Hán Việt + nghĩa tiếng Việt + phép so khớp), nên vừa là hook chia sẻ
 * vừa là trang SEO nhắm truy vấn "từ tiếng Trung giống tiếng Việt".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";

interface FamiliarWord {
  simplified: string;
  pinyin: string;
  hanViet: string;
  meaningVi: string;
  hskLevel: number;
}

interface FamiliarResult {
  total: number;
  byLevel: { hskLevel: number; count: number }[];
  items: FamiliarWord[];
}

export const revalidate = 86400;

async function fetchFamiliar(): Promise<FamiliarResult | null> {
  // try/catch: fetch THROW khi API không phản hồi, không chỉ !res.ok
  try {
    const res = await fetch(`${API_BASE}/words/familiar`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as FamiliarResult;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchFamiliar();
  const n = data?.total ?? 700;
  return {
    title: `${n}+ từ tiếng Trung người Việt đã biết sẵn (nhờ âm Hán Việt) | Hanni`,
    description: `电话 là "điện thoại", 世界 là "thế giới", 机会 là "cơ hội" — ${n} từ tiếng Trung có âm Hán Việt trùng khớp luôn nghĩa tiếng Việt. Danh sách đầy đủ, miễn phí.`,
    alternates: { canonical: "/tu-da-biet" },
  };
}

export default async function TuDaBietPage() {
  const data = await fetchFamiliar();

  return (
    <div className="page-wrap max-w-4xl! space-y-8 py-10!">
      <section className="text-center">
        <span className="eyebrow">LỢI THẾ CỦA NGƯỜI VIỆT</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {data ? `${data.total} từ tiếng Trung` : "Những từ tiếng Trung"}
          <br className="hidden sm:block" /> bạn đã biết sẵn
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          Hơn 60% từ vựng tiếng Việt vay mượn từ tiếng Hán. Với những từ dưới
          đây, <strong className="text-foreground">âm Hán Việt trùng khớp
          luôn với nghĩa tiếng Việt</strong> — bạn chỉ cần biết mặt chữ, nghĩa
          thì đã nằm sẵn trong đầu rồi.
        </p>
      </section>

      {!data ? (
        <p className="panel p-6 text-center text-sm text-muted">
          Chưa tải được danh sách. Vui lòng thử lại sau.
        </p>
      ) : (
        <>
          <section className="panel tint-primary p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {data.items.slice(0, 3).map((w) => (
                <div key={w.simplified} className="text-center">
                  <p lang="zh" className="hanzi text-4xl text-primary">
                    {w.simplified}
                  </p>
                  <p className="mt-1 text-xs text-muted">{w.pinyin}</p>
                  <p className="mt-2 text-sm font-bold">{w.hanViet}</p>
                  <p className="text-[11px] text-muted">
                    = đúng nghĩa tiếng Việt
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              Danh sách đầy đủ ({data.total} từ)
            </h2>
            <p className="mt-1 text-xs text-muted">
              Bấm vào từ để nghe phát âm và xem chi tiết.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((w) => (
                <li key={`${w.simplified}-${w.pinyin}`}>
                  <Link
                    href={`/tu-dien/${encodeURIComponent(w.simplified)}`}
                    className="panel hover-card flex items-center gap-3 px-3.5 py-2.5"
                  >
                    <span lang="zh" className="hanzi text-2xl text-primary">
                      {w.simplified}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {w.hanViet}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {w.pinyin} · HSK {w.hskLevel}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel tint-primary p-6 text-center">
            <h2 className="text-lg font-bold tracking-tight">
              Đã biết {data.total} từ rồi, học tiếp thôi
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Đây mới là những từ trùng khớp hoàn toàn. Còn hàng nghìn từ khác
              mà âm Hán Việt giúp bạn đoán được nghĩa — lợi thế mà người học
              nước khác không có.
            </p>
            <LinkButton href="/hoc-thu" className="mt-4">
              Học thử 8 từ — không cần đăng ký
              <Icon name="arrow" size={16} />
            </LinkButton>
          </section>
        </>
      )}
    </div>
  );
}
