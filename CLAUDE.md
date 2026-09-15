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
├── progress            bucket đã thuộc / đang học / sắp quên theo cấp; có lịch hoạt động 30
│                        ngày (`components/activity-calendar.tsx`, dùng GET /streak/history) +
│                        lịch sử quiz gần đây (GET /quiz/recent)
├── achievements         huy hiệu chưa mở khoá hiện thêm thanh tiến độ (progressCurrent/Target)
├── (app)/u/[id]         hồ sơ công khai — streak, huy hiệu, follow, "Nhắn tin"
├── (app)/messages       hộp thư nhắn tin 1-1 realtime (2 cột, mobile chỉ hiện 1 bên)
├── settings            mục tiêu ngày, thuật toán SRS, múi giờ
└── nguon-du-lieu       trang ghi công nguồn dữ liệu (bắt buộc theo license)
components/  ui.tsx · nav.tsx · flashcard.tsx · quiz-runner.tsx · comment-section.tsx
             · video-like-button.tsx · notification-bell.tsx · follow-button.tsx
             · activity-calendar.tsx (lịch hoạt động 30 ngày)
             · assistant-widget.tsx (bong bóng chat nổi, mount trong app-shell.tsx)
             · markdown-lite.tsx (render **in đậm**/`code`/gạch đầu dòng cho trả lời AI)
lib/  api.ts (fetch + auto refresh 401) · auth.tsx · hooks.ts (SWR) · notifications.ts
      (SWR + socket.io-client) · messages.ts (SWR + dùng CHUNG kết nối socket.io với
      notifications.ts qua namespace /notifications — khác event name) · time.ts (timeAgo) · types.ts
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
cùng bản chép, có bình luận 1 cấp trả lời + nút thích video; `/watch/add` — nút "Thêm video" ở
`/watch` — chỉ cần dán link YouTube, các trường tiêu đề/cấp/thể loại gấp lại mặc định), chuông
thông báo realtime trong
topbar (`components/notification-bell.tsx`, đẩy qua WebSocket khi có người trả lời bình luận/
bình luận hoặc thích video mình thêm/theo dõi mình/mở khoá huy hiệu mới — riêng loại huy hiệu
hiện icon cúp thay vì avatar vì không có ai tác động, link sang `/achievements`), ngữ pháp (HSK 1–3 + HSK 4–9 đều có giải thích thật, 195/349 mục HSK 4–9; phần
còn lại là danh sách từ vựng theo từ loại nên giữ dạng rút gọn), luyện viết Hán tự (`/writing`,
xem/tô/kiểm tra nét bằng `hanzi-writer`, chuyển chữ trước/sau + hiện số nét), kiểm tra HSK
(`/exams` — câu hỏi nghe + đọc, tính giờ từng câu, có lịch sử), thẻ "Từ vựng hôm nay" ở dashboard
(`components/word-of-the-day.tsx`, `GET /words/of-the-day` — im lặng ẩn đi nếu lỗi/chưa tải, chỉ
là nội dung phụ), bảng xếp hạng (có nút "Theo dõi"
mỗi dòng trong bảng đầy đủ, `components/follow-button.tsx`; podium top-3 không có nút để giữ
nguyên bố cục; thẻ "So với bạn bè" ở dashboard —
`components/friends-leaderboard.tsx`, `useLeaderboard("streak", "friends")` — xếp hạng chuỗi
ngày học chỉ trong nhóm chính mình + người đang theo dõi, cho lý do cụ thể để theo dõi ai đó
thay vì theo dõi xong không thấy tác dụng gì; tên/avatar ở bảng xếp hạng đầy đủ và thẻ này đều
link sang trang hồ sơ công khai `/u/[id]` — avatar, ngày tham gia, streak, huy hiệu đã mở khoá,
tab người theo dõi/đang theo dõi, nút Theo dõi + nút "Nhắn tin" mở/tạo hội thoại rồi điều hướng
sang `/messages`, xem hồ sơ CHÍNH MÌNH thì thay 2 nút đó bằng nút "Chia sẻ" — `ShareButton`
(`components/share-button.tsx`, dùng Web Share API trên di động, rơi về sao chép link vào
clipboard trên máy tính) cũng gắn ở mỗi huy hiệu ĐÃ MỞ KHOÁ trong `/achievements`), `/messages`
(hộp thư nhắn tin 1-1 realtime + kết nối, gộp chung 2 tab **"Trò chuyện"** và **"Kết nối"** trên
CÙNG 1 trang qua query param `?tab=connect` (xem `MessagesInner` trong `messages/page.tsx`) —
trước đó tách riêng `/connections` nhưng bị trùng lặp gần như y hệt phần "tìm người + bắt đầu
nhắn tin" đã có sẵn ở "Tin nhắn mới", nên gộp lại cho đỡ phải nhảy trang; route `/connections`
cũ giờ chỉ còn là redirect sang `/messages?tab=connect` để link/bookmark cũ không 404.
  - Tab **"Trò chuyện"**: sidebar có badge số chưa đọc, mỗi tin nhắn có chữ Hán hiện nút "Dịch"
    ra pinyin + nghĩa tiếng Việt ngay trong khung chat — biến việc nhắn tin cho nhau thành luyện
    đọc (`MessageTranslation`). Khung chat có phân trang tải "Xem tin nhắn cũ hơn" (giữ nguyên vị
    trí cuộn khi tải, không giật xuống cuối), tách ngày "Hôm nay/Hôm qua/ngày cụ thể" + giờ dưới
    mỗi tin nhắn, tự focus ô nhập khi mở hội thoại, khôi phục lại nội dung + báo lỗi nếu gửi thất
    bại (trước đó gửi lỗi sẽ mất tin nhắn ĐÃ GÕ một cách im lặng, không có gì báo lại), **báo đã
    xem** ("Đã xem"/"Đã gửi" dưới tin nhắn CUỐI mình gửi, cập nhật realtime qua event
    `message:read`), và **báo đang nhập** ("Đang nhập…" ở tiêu đề hội thoại, qua event `typing`
    — client tự throttle phát tối đa 1 lần/2s, tự tắt sau 3s không có tín hiệu mới,
    `emitTyping()` trong `lib/messages.ts`). Danh sách hội thoại trống thì mời chuyển sang tab
    "Kết nối" thay vì chỉ báo suông.
  - Tab **"Kết nối"** (`components/connections-panel.tsx`, dùng chung cho cả tab này lẫn trang
    redirect cũ): ô tìm theo tên HOẶC mã người dùng (UID) qua `GET /users/search` — có tìm kiếm
    thì THAY THẾ hẳn phần dưới bằng kết quả tìm (không hiện chung với sub-tab, giống hầu hết app
    khác). Không tìm kiếm thì chia SUB-TAB (thay vì dồn hết vào 1 cuộn dài như bản đầu — dễ định
    vị hơn khi số lượng kết nối tăng lên): "Đã kết nối" (theo dõi lẫn nhau — mutual từ
    `usePublicProfile(myId)`'s `followers`/`following`), "Đang theo dõi bạn" (follow lại để
    thành 2 chiều), "Bạn đang theo dõi", "Gợi ý" (lấy từ bảng xếp hạng "Chuỗi hiện tại" toàn cục
    — không dùng "Từ đã thuộc" vì metric đó thường trống lúc mới launch, chưa ai đạt ngưỡng "đã
    thuộc" ≥21 ngày ôn — lọc bớt người đã theo dõi) — mỗi sub-tab có badge số lượng để biết ngay
    chỗ nào "có việc cần làm" (vd có người đang theo dõi mình mà mình chưa theo dõi lại), sub-tab
    rỗng hiện `TabEmpty` giải thích thay vì chỉ ẩn đi im lặng. Mỗi dòng có sẵn nút Theo dõi +
    Nhắn tin (`MessageIconButton`) ngay tại chỗ, bấm Nhắn tin từ đây tự nhảy về tab "Trò chuyện"
    đúng hội thoại (vì `MessageIconButton` điều hướng qua `?c=<id>`, và `?c=` có mặt thì trang
    luôn ưu tiên hiện tab "Trò chuyện").
  - **Kết nối trước khi nhắn tin**: hội thoại MỚI (chưa từng nhắn) yêu cầu đã theo dõi nhau (1
    trong 2 chiều) — chủ ý để tránh cảm giác "tự nhiên nhắn cho người lạ", lỗi 403 hiện rõ ràng ở
    `MessageIconButton` và trang hồ sơ.
  - **Chia sẻ qua tin nhắn**: `SendToFriendButton` (`components/send-to-friend.tsx`) — khác
    `ShareButton` (chia sẻ RA NGOÀI), đây là gửi THẲNG nội dung (huy hiệu, hồ sơ) cho 1 người bạn
    Hanni cụ thể qua tin nhắn, tìm người nhận bằng tên/UID ngay trong 1 ô nhỏ xổ xuống, gắn ở
    `/achievements` (mỗi huy hiệu đã mở khoá) và hồ sơ công khai của chính mình),
`/minigame` (SẢNH chọn game thay vì nhảy thẳng vào 1 trò — `GameHub` hiện thẻ mỗi minigame
(`GAMES` trong `page.tsx`), bấm vào ra `GameIntro` (luật chơi + nút "Bắt đầu chơi") RỒI mới vào
`GameWorkspace`, tránh kiểu cũ "sidebar chỉ ghi chữ minigame" mà không rõ đang chơi gì/luật ra
sao. 2 minigame hiện có, dùng CHUNG 1 engine solo (`SoloMinigame`, tham số hoá theo `game.mode`)
— **Dịch tốc độ** (`TRANSLATE`, Giai đoạn 1 `FEATURES.md`) và **Nghe đoán từ** (`LISTENING` —
ẩn Hán tự/pinyin lúc chơi, tự phát audio mỗi câu mới qua `useEffect([qIndex])` giống
`quiz-runner.tsx`, `AudioButton` cho nghe lại): đồng hồ đếm ngược 60s tự chạy bằng `setInterval`
so với `startTimeRef` (không cộng dồn sai số), chọn đáp án xong tự chuyển câu hoặc tự nộp bài
khi hết giờ/hết câu, bảng xếp hạng ngày/tuần RIÊNG theo mode (`useMinigameLeaderboard(period,
mode)`). `GameWorkspace` chỉ hiện tab **Đấu 1v1** nếu `game.supportsDuel` (hiện chỉ Dịch tốc độ
— Nghe đoán từ chưa có đấu 1v1, tránh chia nhỏ hàng chờ ghép trận khi lượng người chơi còn ít).
  - **Đấu 1v1** (`DuelMinigame`, Giai đoạn 2-3): bấm "Tìm đối thủ" phát `duel:join-queue` qua
    socket dùng chung `/notifications` (`lib/socket.ts` — tách riêng khỏi `lib/messages.ts`
    thành 1 file `getNotificationsSocket()` DÙNG CHUNG, vì cần 2 nơi độc lập cùng emit/listen
    trên 1 kết nối). Màn "Đang tìm đối thủ" hiện đồng hồ đếm giây ĐÃ CHỜ (đếm bằng
    `queueStartedAtRef`, reset lúc bấm nút chứ không phải trong effect — tránh cảnh báo
    `set-state-in-effect`) + số người khác đang chờ (`useDuelQueueSize()`, poll 3s qua
    `GET /duel/queue-size`, chỉ bật khi đang ở phase "queueing"). Ghép xong: server đẩy
    `duel:matched` (kèm `introMs`) → FE hiện màn **"VS"** (2 avatar + đếm ngược `introMs`, phase
    `matched`) → `duel:round` (8 vòng, mỗi vòng có `deadlineMs`) → `duel:round-result` (tô xanh
    đáp án đúng, đỏ đáp án mình chọn sai) → `duel:finished` (thắng/thua/hoà + biến động ELO +
    huy hiệu tier `TierBadge`, hiện rõ nếu trận kết thúc do 1 bên rớt mạng qua
    `finishResult.forfeitedBy`). **Tự phục hồi khi refresh giữa trận**: mount gọi
    `getActiveDuelMatch()` (`GET /duel/active`) 1 lần — có trận dở thì set thẳng state + phase
    đúng chỗ (nếu đã trả lời câu hiện tại nhưng không rõ chọn ô nào, dùng sentinel `myAnswer =
    -1` để khoá nút mà không tô sai màu ô nào). Bảng xếp hạng ELO hiện huy hiệu tier
    (`TierBadge`, màu lấy từ `tierColor` do server tính) + đếm ngược mùa giải
    (`SeasonCountdown`, `useDuelSeason()` → `GET /duel/season`). `useDuelSocket()`
    (`lib/duel.ts`) dùng ref cho handlers để không bắt component gọi phải tự `useCallback` —
    effect chỉ đăng ký socket theo `user`, không theo từng lần đổi state trong ván đấu.
`/account` (đổi mật khẩu, thẻ "Ví xu" (`useWallet()`) hiện số dư + nút mua thêm lá chắn streak
(300 xu, `buyStreakFreeze()`), thẻ "Mời bạn bè cùng học" — link `/register?ref=<userId>` qua
`ShareButton`, số liệu từ `GET /referrals/me`, và "Vùng nguy hiểm" — xoá tài khoản: gõ đúng chữ
"XÓA" + mật khẩu nếu có đặt mới bấm được nút xoá vĩnh viễn, gọi `DELETE /users/me`),
`/listening` +
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
(roadmap): minigame.

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
áp dụng ở 3 trang: dashboard (`tourKey="dashboard"`, 5 bước: streak, lộ trình cá nhân hoá, học
qua video, so với bạn bè, trợ lý AI), `/learn` (`tourKey="learn"`, chọn cấp/6 chặng/bài theo chủ
đề) và `/watch/[id]` (`tourKey="watch-detail"`, bản chép chạy đồng bộ/dán video mobile/bình
luận) — component viết chung, thêm trang khác chỉ cần khai mảng `TourStep[]` mới rồi render
`<FeatureTour tourKey="..." steps={...} />`.

**PWA** (`docs/pwa.md`): manifest + service worker (chỉ cache màn mất mạng), trang `/install`,
thẻ cài trong `/settings`, popup mời cài nổi góc phải dưới (`components/pwa/`). Test: `npm run test:pwa`.
Lời mời cài thật chỉ chạy ở bản production/HTTPS, không đăng ký worker ở `npm run dev`.
**Thông báo đẩy**: `components/pwa/notification-card.tsx` (`/settings`) + `lib/pwa/push.ts` (subscribe/
unsubscribe/gửi thử) + handler `push`/`notificationclick` trong `public/sw.js`. Dùng VAPID key lấy từ
backend (`GET /push/public-key`). Khi đã bật thông báo trên thiết bị, `NotificationCard` hiện thêm
1 ô chọn "giờ nhắc học mỗi ngày" (0-23, hoặc "Không nhắc") — ghi qua `PATCH /users/me/settings`
(field `reminderHour`, `UserSettings`, state nâng lên `SettingsPage` để dùng chung SWR key với
form cài đặt còn lại), server tự gửi nhắc mỗi ngày đúng giờ đó nếu chưa đạt mục tiêu ngày (xem
`ReminderService` ở `hanni-server/CLAUDE.md`).
