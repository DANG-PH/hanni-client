# hanni-client — Next.js

Giao diện web cho **Hanni** (học tiếng Trung theo HSK 3.0). Gọi `hanni-server` qua REST.

## Stack
- Next.js 16 (App Router, Turbopack mặc định) + React 19 + TypeScript
- Tailwind CSS v4 (`app/globals.css` — token màu light/dark trong `@theme`)
- SWR cho data fetching phía client
- **Không** dùng state management ngoài; auth state ở React Context (`lib/auth.tsx`)

## Cấu trúc
```
app/
├── layout.tsx           AuthProvider + Nav + footer
├── page.tsx             landing (redirect /dashboard nếu đã đăng nhập)
├── login, register, forgot-password, reset-password
├── auth/callback        nhận redirect sau Google OAuth
├── auth/verify-email
├── dashboard            streak, mục tiêu ngày, tiến độ theo cấp
├── study               buổi ôn flashcard (SM-2) + quiz cuối buổi
├── vocabulary          duyệt/tìm từ theo cấp HSK
├── progress            bucket đã thuộc / đang học / sắp quên theo cấp
├── achievements
├── settings            mục tiêu ngày, thuật toán SRS, múi giờ
└── nguon-du-lieu       trang ghi công nguồn dữ liệu (bắt buộc theo license)
components/  ui.tsx · nav.tsx · flashcard.tsx · quiz-runner.tsx
lib/  api.ts (fetch + auto refresh 401) · auth.tsx · hooks.ts (SWR) · types.ts
```

## Convention
- Mọi request qua `lib/api.ts` (`api.get/post/patch`) — `credentials: "include"`, tự refresh 401 một lần.
- Trang cần đăng nhập: gọi `useRequireAuth()` ở đầu component.
- Component dùng `useSearchParams()` phải bọc trong `<Suspense>` (yêu cầu của Next 16).
- Biến môi trường client: prefix `NEXT_PUBLIC_`. API base: `NEXT_PUBLIC_API_URL`.
- Màu qua token Tailwind (`bg-surface`, `text-muted`, `bg-primary`…), không hardcode hex.
- Next.js 16: đọc `node_modules/next/dist/docs/` khi cần — `params`/`searchParams`/`cookies()` là async.

## Chạy
```
cp .env.example .env.local     # NEXT_PUBLIC_API_URL trỏ tới hanni-server
npm install
npm run dev                    # cần hanni-server chạy ở cổng 8000
```

## Trạng thái hiện tại
Đủ luồng core: auth (email + Google), dashboard, buổi ôn flashcard + quiz, duyệt từ vựng,
tiến độ, huy hiệu, cài đặt, học qua video, ngữ pháp (điểm ngữ pháp HSK 1–3), kiểm tra HSK
(có lịch sử), bảng xếp hạng. Chưa làm (roadmap): RAG chatbot, minigame, social.

**PWA** (`docs/pwa.md`): manifest + service worker (chỉ cache màn mất mạng), trang `/install`,
thẻ cài trong `/settings`, popup mời cài nổi góc phải dưới (`components/pwa/`). Test: `npm run test:pwa`.
Lời mời cài thật chỉ chạy ở bản production/HTTPS, không đăng ký worker ở `npm run dev`.
