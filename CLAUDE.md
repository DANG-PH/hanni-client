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
├── onboarding           khảo sát 3 bước → đề xuất cấp HSK + lộ trình — làm được TRƯỚC khi có
│                        tài khoản (kiểu Duolingo, xem "Điểm quan trọng" dưới), nằm ngoài cả
│                        (site) lẫn (app) vì cần khung tối giản dùng chung 2 trạng thái
├── auth/callback        nhận redirect sau Google OAuth
├── auth/verify-email
├── dashboard            streak, mục tiêu ngày, tiến độ theo cấp — hero + thứ tự mảng luyện
│                        tập đổi theo `OnboardingProfile.goal` (GOAL_PERSONA), xem "Trạng thái"
├── study               buổi ôn flashcard (SM-2) + quiz cuối buổi
├── vocabulary          duyệt/tìm từ theo cấp HSK
├── progress            bucket đã thuộc / đang học / sắp quên theo cấp
├── achievements
├── settings            mục tiêu ngày, thuật toán SRS, múi giờ
└── nguon-du-lieu       trang ghi công nguồn dữ liệu (bắt buộc theo license)
components/  ui.tsx · nav.tsx · flashcard.tsx · quiz-runner.tsx · comment-section.tsx
             · video-like-button.tsx · notification-bell.tsx · follow-button.tsx
             · assistant-widget.tsx (bong bóng chat nổi, mount trong app-shell.tsx)
             · markdown-lite.tsx (render **in đậm**/`code`/gạch đầu dòng cho trả lời AI)
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
bình luận hoặc thích video mình thêm/theo dõi mình), ngữ pháp (HSK 1–3 + HSK 4–9 đều có giải thích thật, 195/349 mục HSK 4–9; phần
còn lại là danh sách từ vựng theo từ loại nên giữ dạng rút gọn), luyện viết Hán tự (`/writing`,
xem/tô/kiểm tra nét bằng `hanzi-writer`, chuyển chữ trước/sau + hiện số nét), kiểm tra HSK
(`/exams` — câu hỏi nghe + đọc, tính giờ từng câu, có lịch sử), bảng xếp hạng (có nút "Theo dõi"
mỗi dòng trong bảng đầy đủ, `components/follow-button.tsx`; podium top-3 không có nút để giữ
nguyên bố cục; thẻ "So với bạn bè" ở dashboard —
`components/friends-leaderboard.tsx`, `useLeaderboard("streak", "friends")` — xếp hạng chuỗi
ngày học chỉ trong nhóm chính mình + người đang theo dõi, cho lý do cụ thể để theo dõi ai đó
thay vì theo dõi xong không thấy tác dụng gì), `/listening` +
`/pronunciation` (mỗi lần kiểm tra đáp án/ghi âm xong đều gọi `POST /practice/attempts` lưu
DB, thẻ thống kê lũy kế hiện ngay khi có dữ liệu), `/onboarding` (khảo sát 3 bước — đã học
chưa/cấp tự đánh giá, mục tiêu, có định thi không — làm được TRƯỚC KHI có tài khoản, kiểu
Duolingo "gradual engagement": trang chủ + nav nút chính giờ trỏ vào đây thay vì thẳng
`/register`; ẩn danh làm xong thì lưu tạm câu trả lời vào `sessionStorage`
(`hanni:pending-onboarding`) rồi chuyển sang `/register`, đăng ký xong quay lại `/onboarding`
tự nộp luôn — không bắt làm lại. Nút "Đã có tài khoản? Đăng nhập" cho ai lỡ bấm nhầm. Trả về
cấp HSK đề xuất + đoạn giải thích lộ trình (có số liệu thật: số từ mới còn thiếu, ước tính số
ngày); dashboard hiện thẻ "Lộ trình của bạn: HSK N" sau khi làm xong (hoặc banner nhắc làm nếu
chưa), VÀ đổi lời chào hero + thứ tự 4 mảng luyện tập (từ vựng/ngữ pháp/nghe/phát âm) theo đúng
`goal` đã chọn — `GOAL_PERSONA` trong `dashboard/page.tsx`, có đếm ngược ngày tới hạn thi nếu
mục tiêu là EXAM và có đặt `targetDate`), trợ lý AI
Hanni (`components/assistant-widget.tsx` — logo Hanni làm avatar thay vì icon chung, bong bóng
chat nổi góc dưới phải mọi trang trong app-shell khi đã đăng nhập; vị trí nút tự tránh đè popup
mời cài PWA — đọc cờ `promptDialogVisible` thật từ `lib/pwa/store.ts` (do `install-prompt.tsx`
tự cập nhật), KHÔNG tự đoán lại logic show/hidden/snooze của popup đó (từng làm vậy và sai, coi
gần như lúc nào cũng "có thể hiện" trên desktop khiến nút lơ lửng giữa màn hình hầu hết thời
gian); trả lời **stream từng chữ qua SSE** (`lib/hooks.ts` hàm `streamAssistant()`,
`EventSource` gọi `GET /assistant/ask/stream`) thay vì đợi cả câu xong, có chấm nhấp nháy lúc
chưa có chữ nào — delta từ Gemini dồn cục không đều (token sinh theo cụm) nên KHÔNG đẩy thẳng
vào state mỗi lần nhận (chữ nhảy khựng), mà dồn vào buffer rồi nhả đều qua 1 timer 20ms trong
`assistant-widget.tsx` (`send()`, tốc độ nhả tự tăng theo lượng buffer tồn để không tụt lại xa);
nhiều cuộc trò chuyện song song như ChatGPT/Claude — nút "+" tạo mới, icon
đồng hồ mở danh sách lịch sử tự đặt tên theo tin nhắn đầu; trả lời render qua
`components/markdown-lite.tsx` (chỉ **in đậm**/`code`/gạch đầu dòng — đúng với những gì prompt
hệ thống yêu cầu model dùng, xem `hanni-server/CLAUDE.md`); chỉ gọi API khi mở widget, không
tải sẵn cho mọi trang; báo "chưa được
bật" tự nhiên như 1 tin nhắn bình thường nếu server chưa cấu hình GEMINI_API_KEY; server có thể
gọi tool điều hướng (`navigate_to_page`/`open_video`) — khi có, event `done` của SSE mang thêm
field `action: {type:'navigate', path, label}`, widget hiện nút "Mở: <tên>" ngay dưới tin nhắn
model để người dùng TỰ bấm mở trang/video, trợ lý không tự chuyển trang thay và không được nói
là đã mở giúp). Chưa làm
(roadmap): minigame,
trang hồ sơ công khai/danh sách người theo dõi (mới có nút theo dõi rời rạc ở bảng xếp hạng).

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
(dải 6 chặng 拼声字词语听), `video-shelf.tsx` (kệ video tự trượt + kéo, ở dashboard — có banner
"Xem tiếp: <tên video>" khi có video đang xem dở, `progressPct > 0 && !completed`),
`hsk-coverflow.tsx` (băng chuyền 3D 7 cấp HSK, ở trang chủ `/`). Nền tô nhẹ theo token:
class `.tint-primary/.tint-good/.tint-hero` trong globals.css (tự đổi sáng/tối).

**Hướng dẫn từng bước lần đầu** (`components/feature-tour.tsx`): popup giới thiệu tác dụng các
tính năng chính (icon + tiêu đề + mô tả, nút Tiếp theo/Bỏ qua + chấm tiến trình) — chỉ hiện 1
LẦN mỗi `tourKey` (đánh dấu qua `localStorage`, cùng cách `install-prompt.tsx` nhớ đã tắt). Đang
áp dụng ở dashboard (`tourKey="dashboard"`, 5 bước: streak, lộ trình cá nhân hoá, học qua video,
so với bạn bè, trợ lý AI) — component viết chung, thêm cho trang khác chỉ cần khai mảng `TourStep[]` mới rồi
render `<FeatureTour tourKey="..." steps={...} />`.

**PWA** (`docs/pwa.md`): manifest + service worker (chỉ cache màn mất mạng), trang `/install`,
thẻ cài trong `/settings`, popup mời cài nổi góc phải dưới (`components/pwa/`). Test: `npm run test:pwa`.
Lời mời cài thật chỉ chạy ở bản production/HTTPS, không đăng ký worker ở `npm run dev`.
**Thông báo đẩy**: `components/pwa/notification-card.tsx` (`/settings`) + `lib/pwa/push.ts` (subscribe/
unsubscribe/gửi thử) + handler `push`/`notificationclick` trong `public/sw.js`. Dùng VAPID key lấy từ
backend (`GET /push/public-key`), chưa có lịch nhắc tự động — chỉ gửi thủ công qua API.
