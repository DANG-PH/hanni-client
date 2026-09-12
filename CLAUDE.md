# hanni-client — Next.js

Giao diện web cho **Hanni** (học tiếng Trung theo HSK 3.0). Gọi `hanni-server` qua REST.

## Stack
- Next.js 16 (App Router, Turbopack mặc định) + React 19 + TypeScript
- Tailwind CSS v4 (`app/globals.css` — token màu light/dark trong `@theme`)
- SWR cho data fetching phía client
- `socket.io-client` — kết nối WebSocket nhận thông báo realtime (`lib/notifications.ts`)
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
components/  ui.tsx · nav.tsx · flashcard.tsx · quiz-runner.tsx · comment-section.tsx
             · video-like-button.tsx · notification-bell.tsx
lib/  api.ts (fetch + auto refresh 401) · auth.tsx · hooks.ts (SWR) · notifications.ts
      (SWR + socket.io-client) · time.ts (timeAgo) · types.ts
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
Đủ luồng core: auth (email + Google), dashboard, buổi ôn flashcard (lật 3D, chạm cả thẻ) + quiz,
duyệt từ vựng (có ghi chú giải thích chuẩn HSK 3.0 9 cấp khác chuẩn cũ 6 cấp), tiến độ, huy
hiệu, cài đặt, học qua video (`/watch/[id]` dán video dưới topbar khi cuộn trên mobile để xem
cùng bản chép, có bình luận 1 cấp trả lời + nút thích video), chuông thông báo realtime trong
topbar (`components/notification-bell.tsx`, đẩy qua WebSocket khi có người trả lời bình luận/
bình luận hoặc thích video mình thêm), ngữ pháp (HSK 1–3 + HSK 4–9 đều có giải thích thật, 195/349 mục HSK 4–9; phần
còn lại là danh sách từ vựng theo từ loại nên giữ dạng rút gọn), luyện viết Hán tự (`/writing`,
xem/tô/kiểm tra nét bằng `hanzi-writer`, chuyển chữ trước/sau + hiện số nét), kiểm tra HSK
(`/exams` — câu hỏi nghe + đọc, tính giờ từng câu, có lịch sử), bảng xếp hạng. Chưa làm
(roadmap): RAG chatbot, minigame, social.

**Quiz** (`components/quiz-runner.tsx`): mỗi câu có `mode: "reading" | "listening"` từ server.
Câu nghe ẩn Hán tự/pinyin, tự phát `audioUrl` khi vào câu, chỉ hiện lại sau khi chọn đáp án.
Prop `timed` (chỉ bật ở `/exams`, không bật ở quiz cuối buổi `/study`) đếm ngược mỗi câu theo
`SECONDS_PER_QUESTION` (nhịp độ ước lượng theo đề thi HSK 3.0 thật, không phải số chính thức),
hết giờ tự dùng đáp án đang chọn (hoặc coi như sai nếu chưa chọn) rồi chuyển câu.

**Luyện viết Hán tự** (`/writing`): `components/hanzi-writer-canvas.tsx` bọc thư viện
`hanzi-writer` (MIT) — 3 chế độ Xem/Tô lại/Kiểm tra. Dữ liệu nét (`public/hanzi-strokes/`) tự
host, chỉ giữ 3.088 ký tự thật sự có trong từ vựng HSK 3.0 (không tải CDN ngoài lúc chạy),
nguồn Make Me a Hanzi / hanzi-writer-data — Arphic Public License (xem `ARPHICPL.TXT` +
`README.txt` trong thư mục đó). `index.json` (level + pinyin từng chữ) sinh bằng `pinyin-pro`.

UI nổi bật: `components/hero-banner.tsx` (dùng `StudyArtwork`), `learning-journey.tsx`
(dải 6 chặng 拼声字词语听), `video-shelf.tsx` (kệ video tự trượt + kéo, ở dashboard),
`hsk-coverflow.tsx` (băng chuyền 3D 7 cấp HSK, ở trang chủ `/`). Nền tô nhẹ theo token:
class `.tint-primary/.tint-good/.tint-hero` trong globals.css (tự đổi sáng/tối).

**PWA** (`docs/pwa.md`): manifest + service worker (chỉ cache màn mất mạng), trang `/install`,
thẻ cài trong `/settings`, popup mời cài nổi góc phải dưới (`components/pwa/`). Test: `npm run test:pwa`.
Lời mời cài thật chỉ chạy ở bản production/HTTPS, không đăng ký worker ở `npm run dev`.
**Thông báo đẩy**: `components/pwa/notification-card.tsx` (`/settings`) + `lib/pwa/push.ts` (subscribe/
unsubscribe/gửi thử) + handler `push`/`notificationclick` trong `public/sw.js`. Dùng VAPID key lấy từ
backend (`GET /push/public-key`), chưa có lịch nhắc tự động — chỉ gửi thủ công qua API.
