/**
 * TẠM THỜI — chẩn đoán lỗi 500 chỉ tái hiện trên Vercel ở 3 trang từ điển
 * (学生, 电脑, 苹果) trong khi gọi thẳng API vẫn 200 và chạy local vẫn đúng.
 * Xoá ngay sau khi đọc được nguyên nhân.
 */
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/api";

export const dynamic = "force-dynamic";

async function probe(url: string, init: RequestInit) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let parsed = "ok";
    try {
      JSON.parse(text);
    } catch (e) {
      parsed = `PARSE FAIL: ${(e as Error).message}`;
    }
    return { status: res.status, len: text.length, parsed, head: text.slice(0, 120) };
  } catch (e) {
    return { thrown: `${(e as Error).name}: ${(e as Error).message}` };
  }
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "学生";
  const url = `${API_BASE}/dictionary/${encodeURIComponent(slug)}`;
  return NextResponse.json({
    node: process.version,
    apiBase: API_BASE,
    url,
    cached: await probe(url, { next: { revalidate: 86400 } }),
    cachedAgain: await probe(url, { next: { revalidate: 86400 } }),
    noStore: await probe(url, { cache: "no-store" }),
  });
}
