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
│                        tập đổi theo `OnboardingProfile.goal` (GOAL_PERSONA), xem "Trạng thái".
│                        CTA "Tiếp tục/Bắt đầu bài học" (2 chỗ: HeroBanner + thẻ "Tiếp tục học")
│                        từ 2026-09-18 trỏ vào `/learn/[lessonId]` (trang chi tiết, có ngữ pháp
│                        liên quan + nút luyện nghe/phát âm riêng bài) khi bài CHƯA bắt đầu
│                        (`startedWords === 0`), chỉ trỏ thẳng `/study?lesson=` (flashcard) khi
│                        ĐÃ học dở — trước đó CẢ 2 trường hợp đều nhảy thẳng flashcard, khiến
│                        các tính năng mới ở trang chi tiết bài học hoàn toàn không ai thấy được
│                        (user chỉ vào được trang đó nếu tự bấm từ danh sách bài học, không phải
│                        qua luồng "tiếp tục học" chính)
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
  **CHỈ dùng cách đọc `window.location.search` thủ công (né `<Suspense>`) cho trang chỉ vào
  qua ĐIỀU HƯỚNG TẢI LẠI TRANG THẬT** (redirect từ bên ngoài như payOS trả về `/account?topup=`,
  hoặc gõ thẳng URL) — đọc trong `useEffect` nếu chỉ cần đọc rồi set state 1 lần, hoặc trong
  **lazy initializer** của `useState(() => ...)` (guard `typeof window === "undefined"` cho SSR)
  nếu cần set state ngay, tránh cảnh báo ESLint `react-hooks/set-state-in-effect`. **KHÔNG dùng
  cách này nếu trang được điều hướng tới bằng `<Link>` trong app** (client-side navigation) —
  Next.js có thể tái dùng lại instance component cũ khi chỉ đổi query string, khiến lazy
  initializer/effect không chạy lại và param mới bị bỏ qua (bug thật đã gặp: nút "Ngữ pháp liên
  quan" ở `/learn/[lessonId]` link sang `/grammar?level=&open=`, và nút "Luyện nghe"/"Luyện phát
  âm" link sang `/listening?lesson=`/`/pronunciation?lesson=` — cả 2 ban đầu code theo lazy
  initializer, test Playwright bằng click Link thật phát hiện param không được đọc). Trường hợp
  này PHẢI dùng `useSearchParams()` thật (bọc `<Suspense>`) + đặt `key={param}` trên component
  con để ép remount mỗi khi param đổi — xem pattern chuẩn ở `/study` (`StudySession` +
  `key={lessonId ?? "review"}`), đã áp dụng lại cho `/grammar`, `/listening`, `/pronunciation`.
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
Đủ luồng core: auth (email + Google), dashboard, buổi ôn flashcard (lật 3D, chạm cả thẻ — mặt
sau hiện thêm badge **"Hán Việt: ..."** nếu `word.hanViet` có dữ liệu, xem `hanni-server/
CLAUDE.md` mục Âm Hán Việt cho lý do đây là điểm khác biệt cốt lõi của Hanni) + quiz,
duyệt từ vựng (có ghi chú giải thích chuẩn HSK 3.0 9 cấp khác chuẩn cũ 6 cấp, mỗi thẻ từ cũng
hiện âm Hán Việt nếu có), tiến độ, huy
hiệu, cài đặt, học qua video (`/watch/[id]` dán video dưới topbar khi cuộn trên mobile để xem
cùng bản chép, có bình luận 1 cấp trả lời + nút thích video; **từ 2026-09-18: bấm vào 1 từ
trong bản chép (cả chế độ có pinyin lẫn không) hiện popup nghĩa + pinyin + nút "Lưu để ôn tập"**
— server tách sẵn câu thành `tokens` (đoạn khớp `Word` thật / đoạn không khớp), client chỉ việc
render: `components/tone-pinyin.tsx` nhóm các ký tự theo token thay vì từng ký tự rời (vẫn giữ
pinyin trên từng chữ), `components/transcript-line.tsx` xử lý cả nhánh không hiện pinyin. Bấm
từ gọi `stopPropagation()` để không kích hoạt luôn nút chọn dòng bao ngoài (2 phần tử tương tác
lồng nhau — dùng `<span role="button">` chứ không phải `<button>` lồng `<button>`, tránh HTML
không hợp lệ). "Lưu để ôn tập" gọi `addWordToSrs()` (`lib/hooks.ts`, `POST
/study/add-word`) — từ xuất hiện ngay trong hàng đợi flashcard ở `/study` lượt sau, không cần
đợi tới lượt "từ mới" theo cấp/bài học. `/watch/add` — nút "Thêm video" ở
`/watch` — chỉ cần dán link YouTube, các trường tiêu đề/cấp/thể loại gấp lại mặc định), chuông
thông báo realtime trong
topbar (`components/notification-bell.tsx`, đẩy qua WebSocket khi có người trả lời bình luận/
bình luận hoặc thích video mình thêm/theo dõi mình/mở khoá huy hiệu mới — riêng loại huy hiệu
hiện icon cúp thay vì avatar vì không có ai tác động, link sang `/achievements`), ngữ pháp (HSK 1–3 + HSK 4–9 đều có giải thích thật, 195/349 mục HSK 4–9; phần
còn lại là danh sách từ vựng theo từ loại nên giữ dạng rút gọn), luyện viết Hán tự (`/writing`,
xem/tô/kiểm tra nét bằng `hanzi-writer`, chuyển chữ trước/sau + hiện số nét), kiểm tra HSK
(`/exams` — câu hỏi nghe + đọc, tính giờ từng câu, có lịch sử), thẻ "Từ vựng hôm nay" ở dashboard
(`components/word-of-the-day.tsx`, `GET /words/of-the-day` — im lặng ẩn đi nếu lỗi/chưa tải, chỉ
là nội dung phụ; từ 2026-09-18 hiện thêm ảnh minh hoạ nếu `data.imageUrl` có — xem
`hanni-server/CLAUDE.md` mục ảnh minh hoạ từ vựng, lấy qua Wikimedia Commons miễn phí không cần
key, chỉ có với 1 số danh từ cụ thể + đã được xem qua ít nhất 1 lần), thẻ "Giải đấu tuần"
(`components/weekly-league-card.tsx`, `GET /leaderboard/league`, từ 2026-09-19 — TÁI DÙNG
`friends-leaderboard.module.css` vì layout gần giống hệt, không tạo CSS module riêng; đặt ở
dashboard làm section riêng — KHÔNG nhét vào `.dailyGrid` 2-cột có sẵn để khỏi phải sửa CSS
grid dùng chung đang được dev FE khác chỉnh) cạnh thẻ "Nhiệm vụ hàng ngày"
(`components/daily-quest-card.tsx`, `GET /quests/today`, cùng ngày 2026-09-19 — 3 nhiệm vụ/ngày
mỗi cái đo 1 tính năng khác nhau — ôn từ, quiz, luyện nghe, luyện phát âm, học từ mới, xem
`hanni-server/CLAUDE.md` mục "Nhiệm vụ hàng ngày" — server tự cộng xu ngay khi phát hiện hoàn
thành nên thẻ này KHÔNG có nút "Nhận thưởng" riêng, chỉ hiển thị `ProgressBar` có sẵn ở
`components/ui.tsx` cho từng nhiệm vụ; `useTodayQuests()` trong `lib/hooks.ts` tự
`mutate("/wallet/me")` qua `useEffect` khi thấy `justClaimedXu > 0` để số dư ví ở `/account` (dù
khác trang) không bị cũ nếu user vừa nhận thưởng — cả 2 thẻ đặt trong 1 lưới Tailwind 2 cột
RIÊNG khai thẳng trong `page.tsx` (`grid md:grid-cols-2`), không dùng lại `.dailyGrid` cùng lý
do tránh sửa CSS grid dùng chung), bảng xếp hạng (5 tab tiêu chí — 4 tab học tập + tab **"Đấu 1v1 (ELO)"**
(`LEADERBOARD_METRICS` trong `components/leaderboard.tsx`) hiện huy hiệu rank `RankEmblem`
(`components/rank-emblem.tsx` — tách riêng để dùng chung với `/minigame`) ngay cạnh tên ở cả
podium top-3 lẫn bảng đầy đủ, có nút "Theo dõi"
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
    "Kết nối" thay vì chỉ báo suông. **Nút "Dịch" cạnh ô nhập** (`translateInput()`) — khác
    `MessageTranslation` (dịch tin ĐÃ gửi để đọc) — dịch nội dung ĐANG GÕ sang ngôn ngữ còn lại
    rồi ĐIỀN LẠI vào ô nhập (không tự gửi luôn) để xem/sửa trước khi bấm Gửi bình thường; hướng
    dịch tự nhận theo `HAS_HAN.test(text)` (có chữ Hán → dịch sang Việt, không có → dịch sang
    Trung), gọi `POST /messages/translate-compose` (`translateForCompose()` trong
    `lib/messages.ts`). **Đã sửa 2026-09-18**: race condition thật — trước đây chỉ nút "Dịch" bị
    disable lúc `translating`, ô nhập + nút Gửi vẫn bấm được bình thường, nên bấm Gửi giữa lúc
    đang dịch sẽ gửi bản CHƯA dịch rồi bản dịch trả về SAU đó ghi đè vào ô nhập đã bị xoá — giờ
    ô nhập + nút Gửi đều `disabled={sending || translating}`, và `send()`/`translateInput()` đều
    tự chặn lẫn nhau (kiểm tra cả 2 cờ ở đầu hàm) thay vì chỉ chặn chính nó.
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
sao. 4 minigame hiện có — **Dịch tốc độ**, **Nghe đoán từ**, **Chọn pinyin đúng** dùng CHUNG 1
engine solo (`SoloMinigame`, tham số hoá theo `game.mode`) — **Dịch tốc độ** (`TRANSLATE`, Giai
đoạn 1 `FEATURES.md`), **Nghe đoán từ** (`LISTENING` — ẩn Hán tự/pinyin lúc chơi, tự phát audio
mỗi câu mới qua `useEffect([qIndex])` giống `quiz-runner.tsx`, `AudioButton` cho nghe lại), và
**Chọn pinyin đúng** (`PINYIN` — hiện Hán tự, chọn đúng pinyin trong 4 lựa chọn; PHẢI ẩn caption
pinyin thường thấy ở TRANSLATE vì đó chính là đáp án đang cho chọn, xem `hidePinyinCaption`):
đồng hồ đếm ngược 60s tự chạy bằng `setInterval` so với `startTimeRef` (không cộng dồn sai số),
chọn đáp án xong tự chuyển câu hoặc tự nộp bài khi hết giờ/hết câu, bảng xếp hạng ngày/tuần
RIÊNG theo mode (`useMinigameLeaderboard(period, mode)`). `GameWorkspace` build mảng `tabs` động
theo `game.supportsDuel`/`game.supportsTeamDuel` (hiện chỉ Dịch tốc độ có cả 2 — các mode còn
lại chưa có đấu 1v1/2v2, tránh chia nhỏ hàng chờ ghép trận khi lượng người chơi còn ít).
  - **Ghép cặp** (`MatchMinigame`, `MATCH`) — engine RIÊNG hẳn (không dùng chung `SoloMinigame`
    vì cơ chế khác hoàn toàn trắc nghiệm): lưới 16 thẻ (`MATCH_PAIRS`=8 cặp, `MatchCard[]` từ
    `POST /minigame/start`), lật 2 thẻ/lượt qua `flipCard()` — khớp `wordId` thì giữ nguyên (thêm
    vào `matchedWordIds`), sai thì khoá thao tác 700ms rồi úp lại cả 2 (đếm dồn `mistakesRef`, y
    hệt kiểu `answersRef` ở `SoloMinigame` — dùng ref để tránh stale closure khi đọc trong
    `finish()`). Nộp bài khi hoàn thành đặt trong 1 `useEffect` riêng theo dõi `matchedWordIds`
    (KHÔNG gọi thẳng trong `flipCard()`) — ESLint rule mới `react-hooks/purity` chặn gọi
    `Date.now()` (tính `durationMs`) trực tiếp trong 1 event handler tự định nghĩa nếu hàm đó
    KHÔNG có nhánh gọi nào khác đi qua `useEffect`/timer, phải tách qua effect mới hết báo lỗi —
    xem thêm nếu gặp lại lỗi tương tự ở minigame khác sau này. `finishMatchMinigame()`
    (`lib/minigame.ts`) gửi `{mistakes, durationMs}` thay vì `answers` như 2 mode kia.
  - **Đấu 1v1** (`DuelMinigame`, Giai đoạn 2-3): bấm "Tìm đối thủ" phát `duel:join-queue` qua
    socket dùng chung `/notifications` (`lib/socket.ts` — tách riêng khỏi `lib/messages.ts`
    thành 1 file `getNotificationsSocket()` DÙNG CHUNG, vì cần 2 nơi độc lập cùng emit/listen
    trên 1 kết nối). Màn "Đang tìm đối thủ" hiện đồng hồ đếm giây ĐÃ CHỜ (đếm bằng
    `queueStartedAtRef`, reset lúc bấm nút chứ không phải trong effect — tránh cảnh báo
    `set-state-in-effect`) + số người khác đang chờ (`useDuelQueueSize()`, poll 3s qua
    `GET /duel/queue-size`, chỉ bật khi đang ở phase "queueing"). Ghép xong: server đẩy
    `duel:matched` (kèm `introMs`) → FE hiện màn **"VS"** (2 avatar + đếm ngược `introMs`, phase
    `matched`) → `duel:round` (8 vòng, mỗi vòng có `deadlineMs`, độ khó câu hỏi tăng theo ELO
    trung bình 2 người — xem `wordPoolSkipForElo()` ở `hanni-server/CLAUDE.md`) →
    `duel:round-result` (tô xanh đáp án đúng, đỏ đáp án mình chọn sai) → `duel:finished`
    (thắng/thua/hoà + biến động ELO, hiện rõ nếu trận kết thúc do 1 bên rớt mạng qua
    `finishResult.forfeitedBy`). **Tự phục hồi khi refresh giữa trận**: mount gọi
    `getActiveDuelMatch()` (`GET /duel/active`) 1 lần — có trận dở thì set thẳng state + phase
    đúng chỗ (nếu đã trả lời câu hiện tại nhưng không rõ chọn ô nào, dùng sentinel `myAnswer =
    -1` để khoá nút mà không tô sai màu ô nào).
    **Huy hiệu rank** (`RankEmblem`) — khiên SVG tự vẽ (không dùng ảnh ngoài), pip tròn tăng dần
    theo bậc, riêng Thách Đấu đổi sang sao + quầng sáng vì đây là bậc GIỚI HẠN SỐ LƯỢNG (top 100
    toàn server, không phải chỉ cần đủ ELO — xem `CHALLENGER_TOP_N`/`computeTier()` ở
    `hanni-server/CLAUDE.md`), dùng ở màn hình chờ đấu (size 64), mỗi dòng bảng xếp hạng (size
    26). `RankTiersLegend` (nút "Xem các bậc rank", gấp lại mặc định) hiện đủ 9 bậc kèm khoảng
    ELO — dữ liệu lấy DUY NHẤT từ `GET /duel/rank-tiers` (`useRankTiers()`), không chép tay
    ngưỡng ở client, Thách Đấu ghi rõ luật riêng thay vì 1 khoảng ELO thường. Bảng xếp hạng ELO
    còn có đếm ngược mùa giải (`SeasonCountdown`, `useDuelSeason()` → `GET /duel/season`).
    `useDuelSocket()` (`lib/duel.ts`) dùng ref cho handlers để không bắt component gọi phải tự
    `useCallback` — effect chỉ đăng ký socket theo `user`, không theo từng lần đổi state trong
    ván đấu.
  - **Đấu đôi 2v2** (`TeamDuelMinigame`, `lib/team-duel.ts`, Giai đoạn 4) — cấu trúc SONG SONG
    với `DuelMinigame` (queue → màn "VS" đếm ngược → round → finished), khác ở chỗ mọi state theo
    NHÓM thay vì 1 đối thủ: `myTeammates: DuelOpponent[]` (đúng 1 người) + `opponentTeam:
    DuelOpponent[]` (đúng 2 người), điểm đội tự cộng ở client từ `scores` (theo từng người) +
    danh sách đồng đội/đối thủ — KHÔNG dựa vào `teamScores` server gửi kèm (thứ tự đội 0/1 không
    khớp trực tiếp với "đội của tôi") để tránh nhầm thứ tự. Màn "VS" hiện 2 avatar đội mình cạnh
    nhau rồi "VS" rồi 2 avatar đội đối thủ. Dùng CHUNG `EloLeaderboardSection` (tách từ
    `DuelMinigame` thành 1 component riêng vì giờ dùng ở CẢ 2 nơi) — 2v2 không có bảng xếp hạng
    riêng, ELO/tier/mùa giải là 1 hệ chung với đấu 1v1.
`/account` (đổi mật khẩu, thẻ "Ví xu" (`useWallet()`) hiện số dư + nút mua thêm lá chắn streak
(300 xu, `buyStreakFreeze()`) + khối "Nạp thêm xu" (CHỈ hiện nếu `useTopUpConfigured()` trả
`configured: true` — server chưa cấu hình payOS thì tự ẩn gọn, không hiện nút vào báo lỗi): chọn
mức tiền (nút nhanh 10k/20k/50k/100k hoặc gõ tay), bấm "Nạp qua payOS" gọi `createTopUp()`
(`lib/payments.ts`) rồi REDIRECT THẲNG sang `checkoutUrl` do payOS trả về (không tự dựng UI
thanh toán/QR — dựng nhẹ theo đúng tinh thần "để FE khác chỉnh sau"). payOS trả người dùng về
`/account?topup=<orderCode>` sau khi thanh toán — đọc thẳng `window.location.search` trong
`useEffect` (KHÔNG dùng `useSearchParams()` để khỏi phải bọc cả trang trong `<Suspense>` chỉ vì
1 khối nhỏ), gọi `getTopUpStatus()` hiện kết quả rồi dọn query param khỏi URL, thẻ "Cửa hàng
trang trí" (`components/frame-shop.tsx`, ngay dưới Ví xu, từ 2026-09-19) — mở khoá/dùng khung
avatar bằng xu (`GET /shop/frames`, `buyFrame()`/`equipFrame()` ở `lib/shop.ts`), mỗi ô hiện
`<Avatar frameColors={...}>` xem trước trực tiếp; khung `premiumOnly` (Phượng Hoàng) ẩn hẳn nút
mua, chỉ hiện dòng chữ "Chỉ dành cho Premium" thay vì hiện nút "Mở khoá — 0 xu" gây hiểu nhầm
(lỗi thật đã phát hiện: field `premiumOnly` có sẵn ở server nhưng lúc đầu quên thread sang
client type/UI); khung ĐANG DÙNG hiện trên hồ sơ công khai `/u/[id]` (xem `hanni-server/
CLAUDE.md` mục "Cửa hàng trang trí" cho lý do không dùng cơ chế rương/random reward). Thẻ
**"Danh hiệu"** (`components/title-shop.tsx`, ngay dưới Cửa hàng trang trí, từ 2026-09-19) —
cùng cấu trúc UI với khung avatar nhưng KHÔNG có preview hình ảnh (chỉ tên danh hiệu), hiện
dạng chữ cạnh tên trên hồ sơ công khai (`p.equippedTitle`, badge màu `good` để phân biệt với
badge PREMIUM màu `accent`). Thẻ **"Premium"** (`components/premium-section.tsx`, ngay TRÊN Ví xu, từ
2026-09-19) — đang Premium thì hiện hạn dùng ("Còn hiệu lực đến..." hoặc "Gói trọn đời"), chưa
thì hiện lời mời + nút "Nâng cấp ngay" mở `components/premium-modal.tsx` (popup, tham khảo bố
cục app học ngoại ngữ đối thủ + trang giá ChatGPT — cột trái chọn gói kiểu radio card có badge
"Phổ biến nhất"/"Tiết kiệm nhất", cột phải liệt kê quyền lợi kèm dấu tick xanh). Popup gọi
`createPremiumCheckout(planKey)` (`lib/payments.ts`) rồi redirect sang `checkoutUrl` payOS y hệt
luồng nạp xu, quay về `/account?premium=<orderCode>` đọc bằng `window.location.search` giống
hệt cách `?topup=` đã làm. **Quyền lợi liệt kê trong popup CHỈ đúng những gì server thật sự đã
cài** (không hứa suông) — xem `hanni-server/CLAUDE.md` mục Premium cho danh sách đầy đủ + lý do
tại sao không khoá nội dung học. Huy hiệu "PREMIUM" (icon `crown` mới thêm ở `components/
icon.tsx`) hiện cạnh tên ở hồ sơ công khai `/u/[id]` khi `isPremium` true. Thẻ "Mời bạn bè
cùng học" — link `/register?ref=<userId>` qua `ShareButton`, số liệu từ `GET /referrals/me`, và
"Vùng nguy hiểm" — xoá tài khoản: gõ đúng chữ "XÓA" + mật khẩu nếu có đặt mới bấm được nút xoá
vĩnh viễn, gọi `DELETE /users/me`),
`/listening` +
`/pronunciation` (mỗi lần kiểm tra đáp án/ghi âm xong đều gọi `POST /practice/attempts` lưu
DB, thẻ thống kê lũy kế hiện ngay khi có dữ liệu; từ 2026-09-18: ghi âm xong client tự chạy song
song Web Speech API (`window.SpeechRecognition`/`webkitSpeechRecognition`, `lang: zh-CN`) để
nhận diện giọng nói, so văn bản nhận được với `word.simplified` rồi gửi `isCorrect` kèm attempt —
CHỈ hoạt động trên Chrome/Edge (Firefox/Safari không có `zh-CN`, tự rơi về hành vi cũ là chỉ ghi
nhận lượt luyện, không báo đúng/sai); dùng `useSyncExternalStore` (không phải
`useEffect`+`setState`) để phát hiện hỗ trợ trình duyệt — tránh lỗi lint
`react-hooks/set-state-in-effect` mà vẫn an toàn SSR; từ 2026-09-18: cả 2 trang nhận thêm
`?lesson=<id>` để luyện đúng từ của 1 bài học thay vì chọn cấp rồi luyện ngẫu nhiên — đọc qua
`useSearchParams()` thật (bọc `<Suspense>`, KHÔNG phải lazy initializer — trang này được vào
chủ yếu bằng `<Link>` từ `/learn/[lessonId]`, lazy initializer không đọc lại được param khi
Next.js tái dùng component instance, xem mục Convention phía trên), `key={lessonId ?? "free"}`
trên `PracticeLibrary` để ép remount đúng lúc đổi bài. `PracticeLibrary` nhận prop `lessonId`,
tự ẩn `LevelFilter`, gọi `useWords({lessonId})` và `useLesson(lessonId)` để lấy tên bài hiện
lên; `/learn/[lessonId]` có 2 nút "Luyện nghe"/"Luyện phát âm" trỏ vào đây), `/onboarding` (khảo sát 3 bước — đã học
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
là đã mở giúp).

**Luyện nói với AI theo tình huống** (`/roleplay`, từ 2026-09-19) — KHÁC HẲN trợ lý AI ở trên
(đó là hỏi-đáp/điều hướng, đây là bài tập PHẢN XẠ đóng vai): chọn 1 trong 6 kịch bản đời thường
(`GET /roleplay/scenarios`, xếp theo HSK1→HSK4), AI giữ vai xuyên suốt bằng tiếng Trung, câu trả
lời hiện kèm pinyin ngay dưới (sinh sẵn server-side, không cần bấm dịch riêng như tin nhắn
thường). `app/(app)/roleplay/page.tsx` có 2 màn: chọn tình huống (lưới thẻ theo cấp HSK + danh
sách hội thoại gần đây để tiếp tục) và chat (bong bóng tin nhắn kiểu `assistant-widget.tsx`
nhưng KHÔNG streaming — gửi 1 lượt, đợi phản hồi, cập nhật optimistic qua `mutate()` của SWR
rồi rollback nếu lỗi). Nút "Kết thúc" xoá hẳn `RoleplaySession` (không có ý nghĩa lưu để xem lại
như trợ lý hỏi-đáp — đây là bài tập luyện, không phải kiến thức cần tra lại). Cùng hạn mức
15 lượt/ngày cho free + Premium không giới hạn như trợ lý hỏi-đáp (xem `hanni-server/CLAUDE.md`
mục Roleplay). Thêm mục "Luyện nói với AI" vào `components/sidebar.tsx` (nhóm "LUYỆN TẬP MỖI
NGÀY", giữa "Luyện viết Hán tự" và "Kiểm tra HSK"). Nút "Gợi ý" (icon `spark`) cạnh ô nhập —
bấm ra 1 ô nhỏ hiện câu tiếng Trung gợi ý + nghĩa tiếng Việt (`hintRoleplay()` ở `lib/
roleplay.ts`, `POST /roleplay/sessions/:id/hint`), bấm "Dùng câu này" điền vào ô nhập để tự
xem/sửa trước khi gửi (không tự gửi luôn, giống nút "Dịch" ở `/messages`) — không lưu vào lịch
sử hội thoại. **Chưa làm**: chấm điểm/phản hồi lỗi sau khi kết thúc hội thoại.

**"Từ khó nhớ"** (`/progress`, từ 2026-09-19) — section mới ngay sau lịch hoạt động 30 ngày,
CHỈ hiện khi có ít nhất 1 từ (`useLeeches()` ở `lib/hooks.ts`, `GET /study/leeches`) — danh sách
từ đã sai đủ 8 lần trong SRS, sắp theo số lần sai giảm dần, mỗi dòng có nút nghe phát âm
(`AudioButton`) + badge "Sai N lần". Field `isLeech` đã có sẵn từ rất lâu ở server nhưng chưa
từng có UI nào đọc — xem `hanni-server/CLAUDE.md` mục "Từ khó nhớ" cho chi tiết + giới hạn đã
biết (chưa có cơ chế tự gỡ đánh dấu khi cuối cùng nhớ được).

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
**Nhận diện ĐÃ CÀI hay chưa** (`lib/pwa/store.ts`'s `installed`, từ 2026-09-19) — trước đây chỉ
có `standalone` (đang CHẠY ở chế độ app ngay lúc này), nên ai đã cài PWA nhưng đang xem lại ở
tab trình duyệt thường vẫn bị coi như CHƯA cài (`beforeinstallprompt`/`appinstalled` không bắn
lại một khi đã cài, nên `installPrompt` mãi là `null`) — popup nổi + `/install` cứ hiện lại
hướng dẫn "Cài từ menu trình duyệt" dù máy đã có app rồi, y hệt lỗi user báo cáo. `installed`
suy ra từ 3 nguồn (OR): (1) `standalone === true` hiện tại, (2) cờ `hanni-pwa-installed` tự lưu
`localStorage` mỗi khi thấy `standalone`/`appinstalled` từng đúng ít nhất 1 lần trên trình
duyệt này (persist qua session), (3) `navigator.getInstalledRelatedApps()` (Chrome/Edge) — cần
`manifest.ts` tự khai `related_applications: [{platform:"webapp", url: "<site>/manifest.
webmanifest"}]` tham chiếu CHÍNH MÌNH mới dùng được API này, đáng tin hơn cờ tự lưu vì không cần
JS của Hanni từng chạy lúc cài. **Giới hạn đã biết (best-effort)**: iOS Home Screen web app dùng
vùng nhớ RIÊNG với tab Safari thường nên cờ `localStorage` không bắc cầu được — lần đầu mở app
đã cài qua Safari tab vẫn có thể bị coi là chưa cài cho tới khi `getInstalledRelatedApps` (nếu
Safari hỗ trợ) hoặc user tự mở app từ màn hình chính ít nhất 1 lần (lúc đó `standalone` đúng và
KHÔNG cần đọc lại cờ cũ). Khi `installed && !standalone`: `InstallCard` (`/install`, `/settings`
gián tiếp) đổi hẳn nút "Cài ứng dụng Hanni" thành "Đã cài ✓" + nút "Mở ứng dụng" (link `LinkButton`
sang `/dashboard`, không có API JS nào ép mở lại ĐÚNG cửa sổ app chuẩn đã cài — chấp nhận đây
là hành động hợp lý nhất có thể làm được, không cố ép); popup nổi (`InstallPrompt`) thì
NGƯNG hiện hẳn (không nag mở app — đã có icon sẵn trên máy, không cần popup nhắc).
**Thông báo đẩy**: `components/pwa/notification-card.tsx` (`/settings`) + `lib/pwa/push.ts` (subscribe/
unsubscribe/gửi thử) + handler `push`/`notificationclick` trong `public/sw.js`. Dùng VAPID key lấy từ
backend (`GET /push/public-key`). Khi đã bật thông báo trên thiết bị, `NotificationCard` hiện thêm
1 ô chọn "giờ nhắc học mỗi ngày" (0-23, hoặc "Không nhắc") — ghi qua `PATCH /users/me/settings`
(field `reminderHour`, `UserSettings`, state nâng lên `SettingsPage` để dùng chung SWR key với
form cài đặt còn lại), server tự gửi nhắc mỗi ngày đúng giờ đó nếu chưa đạt mục tiêu ngày (xem
`ReminderService` ở `hanni-server/CLAUDE.md`).
