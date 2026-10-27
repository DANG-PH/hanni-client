/**
 * BẢN ĐỒ TRANG — BẢNG PHIÊN ÂM (/phien-am) — thanh điệu, thanh mẫu/vận mẫu, bảng ghép âm bấm nghe, luyện nghe thanh
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: sổ tay thuyết trình (tab Tra cứu).
 *
 *   GET /pinyin/overview  ← chính trang này · components/pinyin/use-pinyin.ts
 *                           → server: modules/pinyin/pinyin.controller.ts → PinyinService.overview()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

/**
 * Bảng phiên âm (pinyin) cho người mới — bước 拼/声 của "Sáu chặng" mà trước
 * đây chỉ trỏ sang từ điển/luyện phát âm từ (hứa suông). Đối thủ đều có trang
 * này (Hanbeego "Người mới bắt đầu", HiHSK "Lộ trình Pinyin"), và "bảng phiên
 * âm tiếng Trung" là truy vấn người Việt tìm rất nhiều. Khác biệt của Hanni:
 * mẹo đoán thanh từ âm Hán Việt kèm tỉ lệ đúng ĐO THẬT, âm thanh là ghi âm
 * thật của chữ đơn (không phải giọng máy).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { SoundChip } from "@/components/pinyin/sound-chip";
import { StartLearningCta } from "@/components/pinyin/start-cta";
import { SyllableChart } from "@/components/pinyin/syllable-chart";
import { ToneContour } from "@/components/pinyin/tone-contour";
import { TonePractice } from "@/components/pinyin/tone-practice";
import { TONE_CLASS } from "@/components/tone-pinyin";
import { LinkButton } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import { FINAL_GROUPS, INITIAL_GROUPS, TONES, firstSound } from "@/lib/pinyin";
import { TONE_RULE_TEXT } from "@/lib/tone-rules";
import type { PinyinOverview } from "@/lib/types";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Bảng phiên âm tiếng Trung (pinyin) có audio — thanh mẫu, vận mẫu, thanh điệu | Hanni",
  description:
    "Học phát âm tiếng Trung cho người Việt: 21 thanh mẫu, 36 vận mẫu, 4 thanh điệu kèm cách đọc so với tiếng Việt, bảng ghép âm bấm nghe ghi âm thật và mẹo đoán thanh điệu từ âm Hán Việt. Miễn phí, không cần đăng ký.",
  alternates: { canonical: "/phien-am" },
};

// Prerender lúc build: API chưa chạy thì trang vẫn dựng được (phần âm thanh
// tự tải lại phía client).
async function fetchOverview(): Promise<PinyinOverview | null> {
  try {
    // API → GET /pinyin/overview · server: modules/pinyin/pinyin.controller.ts → PinyinService.overview()
    const res = await fetch(`${API_BASE}/pinyin/overview`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as PinyinOverview;
  } catch {
    return null;
  }
}

const SECTIONS = [
  ["thanh-dieu", "Thanh điệu"],
  ["meo-han-viet", "Mẹo Hán Việt"],
  ["thanh-mau", "Thanh mẫu"],
  ["van-mau", "Vận mẫu"],
  ["bang-ghep-am", "Bảng ghép âm"],
  ["luyen-tap", "Luyện nghe"],
];

const SANDHI = [
  {
    rule: "Hai thanh 3 đi liền nhau: thanh 3 đầu đọc thành thanh 2.",
    ex: { mark: "nǐ hǎo → ní hǎo", char: "你好", url: "/media/audio/cmn-你好.mp3" },
  },
  {
    rule: "不 (bù) đứng trước thanh 4 đọc thành bú.",
    ex: { mark: "bù yào → bú yào", char: "不要", url: "/media/audio/cmn-不要.mp3" },
  },
  {
    rule: "一 (yī) trước thanh 4 đọc yí, trước thanh 1/2/3 đọc yì; đếm số hay đứng cuối giữ yī.",
    ex: { mark: "yī xià → yí xià", char: "一下", url: "/media/audio/cmn-一下.mp3" },
  },
];

export default async function PinyinPage() {
  const data = await fetchOverview();
  const ba = data?.syllables.find((s) => s.base === "ba");
  const rules = data?.toneRules ?? [];
  const predictable = rules.filter((r) => r.predicted !== null);
  const total = predictable.reduce((n, r) => n + r.total, 0);
  const follows = predictable.reduce((n, r) => n + r.follows, 0);

  return (
    <div className="page-wrap max-w-5xl! space-y-10 py-8!">
      <section className="panel tint-primary p-5 sm:p-8">
        <span className="eyebrow max-sm:hidden">PHÁT ÂM CHO NGƯỜI MỚI</span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:mt-3 sm:text-4xl">
          Bảng phiên âm tiếng Trung (pinyin)
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:mt-3 sm:leading-7">
          Học xong phần này là tự đọc được mọi từ mới — mỗi âm đều so với âm tiếng Việt gần nhất, bấm là nghe ghi âm thật.
          <span className="max-sm:hidden">
            {" "}
            Mỗi âm tiết gồm <strong className="text-foreground">thanh mẫu</strong> (phụ âm đầu),{" "}
            <strong className="text-foreground">vận mẫu</strong> (vần) và{" "}
            <strong className="text-foreground">thanh điệu</strong>.
          </span>
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold sm:mt-5">
          {["21 thanh mẫu", "36 vận mẫu", "4 thanh điệu + thanh nhẹ", "Ghi âm thật"].map((t) => (
            <li key={t} className="rounded-full border border-primary/20 bg-surface/70 px-3 py-1.5">
              {t}
            </li>
          ))}
        </ul>
        <nav aria-label="Mục lục" className="mt-5 flex flex-wrap gap-2">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary">
              {label}
            </a>
          ))}
        </nav>
      </section>

      <section id="thanh-dieu" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">4 thanh điệu và thanh nhẹ</h2>
        <p className="text-sm leading-7 text-muted">
          Cùng một âm <strong className="text-foreground">ba</strong>, đổi thanh là đổi nghĩa: 八 (tám) ·
          拔 (nhổ) · 把 (cầm) · 坝 (đập nước). Tiếng Việt có 6 thanh nên người Việt bắt thanh tiếng Trung
          nhanh hơn hẳn người phương Tây — chỉ cần nhớ thanh nào ứng với dấu nào.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TONES.map((tone) => {
            const sound = ba?.tones[tone.t];
            return (
              <article key={tone.t} className="panel p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{tone.name}</h3>
                  <span className={`text-2xl font-extrabold ${TONE_CLASS[tone.t]}`}>{sound?.mark ?? ""}</span>
                </div>
                <ToneContour pitch={tone.pitch} className={`mt-2 h-14 w-full ${TONE_CLASS[tone.t]}`} />
                <p className="mt-2 text-sm leading-6">{tone.desc}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{tone.vi}</p>
                {sound && <SoundChip mark={sound.mark} char={sound.char} url={sound.url} className="mt-3" />}
              </article>
            );
          })}
        </div>
        <div className="panel space-y-3 p-5">
          <h3 className="text-sm font-bold">Thanh nhẹ và biến điệu</h3>
          <p className="text-sm leading-6 text-muted">
            <strong className="text-foreground">Thanh nhẹ</strong> không có dấu, đọc nhẹ và ngắn: 妈妈
            māma, 你们 nǐmen, 吗 ma. Khi nói, vài chữ <strong className="text-foreground">đổi thanh</strong>{" "}
            theo chữ đứng sau — pinyin trong từ điển vẫn ghi thanh gốc:
          </p>
          <ul className="space-y-2">
            {SANDHI.map((s) => (
              <li key={s.rule} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 px-4 py-2.5">
                <span className="text-sm">{s.rule}</span>
                <SoundChip mark={s.ex.mark} char={s.ex.char} url={s.ex.url} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="meo-han-viet" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">Mẹo riêng cho người Việt: đoán thanh từ âm Hán Việt</h2>
        <p className="text-sm leading-7 text-muted">
          Âm Hán Việt và thanh tiếng Trung cùng gốc từ tiếng Hán cổ, nên dấu của âm Hán Việt báo
          trước khá đúng thanh tiếng Trung.
          {total > 0 && (
            <>
              {" "}
              Hanni đo trên toàn bộ từ vựng HSK 1–4: quy luật dưới đây{" "}
              <strong className="text-foreground">
                đúng {Math.round((follows / total) * 100)}%
              </strong>{" "}
              ({follows.toLocaleString("vi-VN")}/{total.toLocaleString("vi-VN")} chữ có quy luật).
            </>
          )}{" "}
          Mẹo này hiện ngay trong thẻ từ mới của mỗi bài học.
        </p>
        <ul className="space-y-2">
          {rules.map((r) => {
            const pct = r.total ? Math.round((r.follows / r.total) * 100) : 0;
            return (
              <li key={r.key} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{TONE_RULE_TEXT[r.key] ?? r.key}</p>
                  {r.predicted !== null ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-good" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-muted">đúng {pct}%</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Rải đều cả 4 thanh — không đoán được, phải nhớ riêng.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.examples.map((e) => (
                    <SoundChip key={e.char} mark={`${e.hanViet} → ${e.mark}`} char={e.char} url={e.url} />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="thanh-mau" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">21 thanh mẫu (phụ âm đầu)</h2>
        <p className="text-sm leading-7 text-muted">
          Chú ý các cặp <strong className="text-foreground">bật hơi / không bật hơi</strong> (b–p, d–t,
          g–k, j–q, zh–ch, z–c): tiếng Việt gần như không phân biệt kiểu này, nên đây là chỗ người Việt
          hay đọc sai nhất.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {INITIAL_GROUPS.map((g) => (
            <article key={g.name} className="panel p-4">
              <h3 className="text-sm font-bold">{g.name}</h3>
              <p className="text-xs text-muted">{g.note}</p>
              <ul className="mt-3 space-y-2">
                {g.items.map((it) => {
                  const s = firstSound(data, it.ex);
                  return (
                    <li key={it.l} className="flex items-center gap-3">
                      <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-extrabold text-primary">
                        {it.l}
                      </span>
                      {/* Điện thoại: nút nghe xuống dưới mô tả — cùng hàng thì mô tả
                       * chỉ còn ~130px ở màn 360px, câu dài gãy 4 dòng. */}
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="min-w-0 text-sm leading-5 sm:flex-1">{it.tip}</span>
                        {s && <SoundChip mark={s.mark} char={s.char} url={s.url} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
        <p className="text-xs text-muted">
          <strong>y</strong> và <strong>w</strong> không phải thanh mẫu thật: chúng chỉ là cách viết khi âm
          tiết bắt đầu bằng i, u, ü (yi, wu, yu).
        </p>
      </section>

      <section id="van-mau" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">36 vận mẫu (vần)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FINAL_GROUPS.map((g) => (
            <article key={g.name} className="panel p-4">
              <h3 className="text-sm font-bold">{g.name}</h3>
              <ul className="mt-3 space-y-2">
                {g.items.map((it) => {
                  const s = firstSound(data, it.ex);
                  return (
                    <li key={it.l} className="flex items-center gap-3">
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-base font-extrabold">
                        {it.l}
                      </span>
                      {/* Điện thoại: nút nghe xuống dưới mô tả — cùng hàng thì mô tả
                       * chỉ còn ~130px ở màn 360px, câu dài gãy 4 dòng. */}
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span className="min-w-0 text-sm leading-5 sm:flex-1">{it.tip}</span>
                        {s && <SoundChip mark={s.mark} char={s.char} url={s.url} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="bang-ghep-am" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">Bảng ghép âm — bấm để nghe</h2>
        <p className="text-sm leading-7 text-muted">
          Chọn phụ âm đầu để xem mọi âm tiết ghép được; mỗi ô là một thanh, kèm 1 chữ đọc đúng âm đó.
          Ô trống là thanh chưa có chữ đơn ghi âm trong từ điển Hanni.
        </p>
        <div className="panel p-4 sm:p-5">
          <SyllableChart initial={data} />
        </div>
      </section>

      <section id="luyen-tap" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight">Luyện nghe thanh điệu</h2>
        <div className="panel p-5 sm:p-6">
          <TonePractice initial={data} />
        </div>
      </section>

      <section className="panel tint-primary p-6 text-center">
        <h2 className="text-lg font-bold tracking-tight">Đọc được pinyin rồi — học từ đầu tiên thôi</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Bài 1 HSK 1 dạy 10 từ chào hỏi, mỗi từ có pinyin tô màu theo thanh và mẹo Hán Việt — 5 phút
          là xong.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <StartLearningCta />
          <LinkButton href="/kiem-tra-trinh-do" variant="secondary">
            Tôi đã biết một chút
          </LinkButton>
        </div>
        <p className="mt-4 text-xs text-muted">
          Âm thanh: ghi âm từ vựng HSK 3.0 (
          <Link href="/nguon-du-lieu" className="hover:underline">
            nguồn dữ liệu
          </Link>
          ).
        </p>
      </section>
    </div>
  );
}
