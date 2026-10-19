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
├── page.tsx             landing — hero "Bạn đã biết tiếng Trung nhiều hơn bạn nghĩ", nút chính
│                        "Học bài đầu tiên" → /bat-dau (khách học trước, đăng ký sau)
├── login, register, forgot-password, reset-password
├── onboarding           khảo sát 3 bước → đề xuất cấp HSK (server ghi luôn `courseLevel`) — làm
│                        được TRƯỚC khi có tài khoản; khách xong khảo sát được mời học bài 1 ngay
├── bat-dau              "Học bài đầu tiên": khách → bài 1 của cấp (`GET /learn/start`); đã đăng
│                        nhập → lưu cấp rồi về /learn
├── bai-hoc/[lessonId]   PHIÊN HỌC 1 BÀI — lõi học từ mới (khung tập trung, không sidebar, dùng
│                        chung khách/đã đăng nhập), xem "Lộ trình một nút bấm" ở Trạng thái
├── auth/callback        nhận redirect sau Google OAuth
├── auth/verify-email
├── (app)/learn          TRANG CHỦ sau đăng nhập (dashboard đã gộp vào, /dashboard → 308)
├── thi-thu-hsk/[slug]   LÀM 1 ĐỀ THI THỬ — khung tập trung như phòng thi (ngoài `(site)`, không
│                        sidebar); trang danh sách `/thi-thu-hsk` thì nằm TRONG `(site)` (công khai,
│                        SEO, người đăng nhập vẫn có sidebar) — cùng 1 đoạn URL ở 2 nhánh thư mục
│                        vẫn build được. Xem "Lộ trình một nút bấm" ở Trạng thái
├── kiem-tra-trinh-do    KIỂM TRA TRÌNH ĐỘ (công khai, index được — "kiểm tra trình độ tiếng
│                        Trung" là truy vấn hay tìm): hỏi dần HSK1→7-9, khung tập trung như
│                        /bai-hoc, xem "Lộ trình một nút bấm" ở Trạng thái
├── study               ÔN TẬP: chỉ từ đã học đến hạn (không còn lấy từ mới) + quiz cuối buổi
├── progress            bucket đã thuộc / đang học / sắp quên theo cấp; có lịch hoạt động 30
│                        ngày (`components/activity-calendar.tsx`, dùng GET /streak/history) +
│                        lịch sử quiz gần đây (GET /quiz/recent)
├── achievements         huy hiệu chưa mở khoá hiện thêm thanh tiến độ (progressCurrent/Target)
├── (app)/u/[id]         hồ sơ công khai — streak, huy hiệu, follow, "Nhắn tin"
├── (app)/messages       hộp thư nhắn tin 1-1 realtime (2 cột, mobile chỉ hiện 1 bên)
├── settings            mục tiêu ngày, thuật toán SRS, múi giờ
├── nguon-du-lieu       trang ghi công nguồn dữ liệu (bắt buộc theo license)
└── tu-dien             TỪ ĐIỂN CÔNG KHAI (SEO) — `/tu-dien` + `/tu-dien/[slug]`.
                        **Đã GỘP `/vocabulary` vào đây (2026-09-22)** — 2 trang trước đó
                        hiển thị CÙNG dữ liệu, chỉ khác `/vocabulary` cần đăng nhập và
                        render bằng JS nên Google không đọc được; để song song là trùng
                        lặp. `/tu-dien` giờ làm cả duyệt (lọc cấp + tìm + phân trang qua
                        `searchParams`, nên `?level=2` cũng là 1 URL index được) lẫn tra
                        chi tiết; `/vocabulary` XOÁ HẲN, chuyển hướng 308 khai ở
                        `next.config.ts` (redirect trong page component nằm
                        trong nhóm (app) chỉ trả 200 + HTML app-shell rồi mới
                        nhảy phía client — kiểm chứng bằng curl), Next tự giữ
                        query nên `?level=` vẫn về đúng cấp. Nút "Lưu để ôn tập"
                        (`components/save-word-button.tsx`) là client component NHỎ nhúng
                        trong trang server-rendered — nội dung vẫn nằm sẵn trong HTML cho
                        Google, chỉ hành động cá nhân mới cần JS; đây là chỗ NỐI tra cứu
                        vào SRS (dùng lại `addWordToSrs()` của bản chép video).
                        **Server Component, KHÔNG "use client"** — nội dung phải nằm sẵn
                        trong HTML thì Google mới index được (đây là toàn bộ mục đích của
                        2 trang này). Lý do tồn tại: sitemap trước đó chỉ có 6 URL toàn
                        trang chức năng, 10.9k từ đều nằm sau đăng nhập nên vô hình với
                        công cụ tìm kiếm — xem `hanni-server/CLAUDE.md` mục "Từ điển CÔNG
                        KHAI cho SEO". Fetch qua `API_BASE` trực tiếp (không qua `lib/api.ts`
                        vì không cần cookie/refresh), `revalidate = 86400`, và PHẢI bọc
                        try/catch: khi API không phản hồi được thì `fetch` THROW chứ không
                        trả `!res.ok`, không bắt là sập cả build.
                        Trang từ hiện thêm **phân tích từng chữ** (电脑 = 电 điện + 脑 não)
                        và **từ cùng chữ** — khai thác sâu nhất lợi thế Hán Việt, đồng thời
                        làm trang dày hơn cho SEO. Xem `hanni-server/CLAUDE.md`.
├── ngu-phap            NGỮ PHÁP CÔNG KHAI (SEO) — `/ngu-phap` + `/ngu-phap/[slug]`, cùng
                        khuôn Server Component với `tu-dien`. **Đã GỘP `/grammar`** (trang
                        trong app) vào đây 2026-09-22, cùng lý do gộp `/vocabulary`; link
                        từ `/learn/[lessonId]` trỏ thẳng `/ngu-phap/[slug]` thay vì
                        `/grammar?level=&open=slug`, `/grammar` redirect 308 ở
                        `next.config.ts`. Chỉ hiện mục CÓ giải thích thật (`flat !== true`)
                        — mục đại cương rút gọn mở ra là ngõ cụt.
**Bám CHỦ ĐỀ đang học (2026-09-22)** — user phản ánh "không phân theo lộ trình, chưa phân chủ
đề, loạn". Dữ liệu thực ra chia chủ đề rất tốt (HSK1: "Chào hỏi & giao tiếp", "Gia đình & con
người", "Đồ ăn & thức uống"...), nhưng UI không phản ánh: `/listening`+`/pronunciation` mặc
định rơi về HSK1 trang 1, `/study` chỉ ghi "Góc ôn tập", `/writing` đổ ra cả 3.088 chữ của một
cấp. Giờ cả 3 hỏi `useCurrentLesson()` (`GET /learn/current`) để mặc định bám đúng bài đang
học và HIỆN RÕ tên chủ đề; vẫn đổi sang luyện tự do theo cấp được. Ở `PracticeLibrary` dùng cờ
`freeMode` (state) chứ không điều hướng khi người dùng chủ động chọn cấp — tránh mất chỗ đang
đứng. `/writing` phải lấy chữ đang chọn TỪ DANH SÁCH ĐÃ LỌC, không phải index đầy đủ, nếu
không đổi chế độ sẽ hiện lệch với danh sách bên dưới.

**Bỏ ổ KHOÁ ở lộ trình `/learn` (2026-09-22)** — user phản ánh "mấy phần khóa khóa cũng hơi
khó hiểu cho user mới". Server không còn trả `LOCKED` (xem `hanni-server/CLAUDE.md`), client gỡ
hết nhánh đã chết trong `components/lesson-path.tsx` (icon ổ khoá, thẻ mờ không bấm được) +
2 chỗ lọc `status !== "LOCKED"` ở `/learn`, `/study`. **Rủi ro NGƯỢC phải xử lý cùng lúc**: 27
bài đều hiện "Sẵn sàng" giống hệt nhau thì người mới lại mất phương hướng — thẻ bài đang học
trước đó CHỈ khác màu (`data-current`), giờ có nhãn CHỮ "Bắt đầu từ đây" (chưa học từ nào) /
"Học tiếp" (`startedWords > 0`). Bỏ khoá còn phải sửa cả COPY đang mô tả cơ chế cũ, nếu không
là dạy sai luật chơi — đã sửa 3 chỗ ("Hoàn thành từng bài để mở bước tiếp theo", "học bài đang
mở", bước 3 của `FeatureTour`).

**`revalidate = 86400` ở trang công khai = code phải đọc được CẢ hình dạng dữ liệu CŨ
(2026-09-22)** — lỗi thật, mất 2 lần đoán sai mới ra. Triệu chứng: 3 trang từ điển (学生, 电脑,
苹果) trả 500 trong khi 27 từ khác bình thường, gọi thẳng API vẫn 200, chạy local vẫn đúng, và
`<title>` của trang lỗi lại ĐÚNG dữ liệu thật. Nguyên nhân: `next: { revalidate }` cache phản
hồi API 24h, nên sau khi server thêm field `videos` thì các URL ĐÃ nằm trong cache vẫn trả hình
dạng CŨ — `data.videos.length` ném TypeError. `generateMetadata` chỉ đọc `words[0]` nên vẫn
chạy, vì thế trang có tiêu đề đúng mà thân trang rỗng, rất khó nhận ra.
- **Quy tắc**: mọi mảng trong payload trang công khai khai báo TUỲ CHỌN + đọc qua `?? []`. Sau
  mỗi lần API thêm field, client phải sống được với cả 2 hình dạng trong đúng `revalidate` giờ.
- **Cách chẩn đoán đã hiệu quả** (lặp lại nếu gặp lỗi chỉ tái hiện trên Vercel): dựng 1 route
  API tạm gọi CÙNG url 2 lần — một lần `next: {revalidate}`, một lần `cache: "no-store"` — rồi
  so ĐỘ DÀI body. Lệch đúng bằng phần field mới là lộ ngay. **Thư mục bắt đầu bằng `_` là
  private, Next KHÔNG định tuyến** — đặt tên `app/api/_diag/` thì route 404 mà không báo gì.
- Header `x-hanni-commit` (`next.config.ts`, `VERCEL_GIT_COMMIT_SHA`) cho biết commit nào đang
  chạy thật — trước đó phải đoán "bản vừa push đã lên chưa" qua hành vi trang.
- `lib/public-fetch.ts` — chỉ **404 của API** mới là "không có mục này" (trả `null` →
  `notFound()`), lỗi khác thử lại 1 lần với `no-store` rồi mới ném. Trang prerender lúc build
  (`/hoc-thu`, `/hsk`, `/tu-da-biet`, sitemap) VẪN phải tự nuốt lỗi, nếu không API chưa chạy là
  sập cả bản build.
- **Đã xoá `app/(site)/loading.tsx`** — nó tạo Suspense boundary nên Next đẩy khung đi TRƯỚC khi
  trang resolve, khiến `notFound()`/lỗi xảy ra sau đó không đổi được HTTP status (luôn 200, thân
  trang là boundary lỗi `$RX`). Bỏ đi thì slug không tồn tại trả đúng 404, API chết trả 500 (đã
  verify bằng cách trỏ `NEXT_PUBLIC_API_URL` sang cổng chết). `components/page-skeleton.tsx` hết
  chỗ dùng nên xoá luôn; `app/(app)/loading.tsx` GIỮ NGUYÊN.
- `generateStaticParams()` trả mảng rỗng ở 2 trang chi tiết → route đổi từ dynamic sang **ISR**:
  không prerender trang nào lúc build (10.9k trang thì build cả tiếng) nhưng trang đã dựng được
  phục vụ lại 24h, thay vì mỗi lượt bot bò là một lần render + một lần gọi API tới VPS.

**Hệ quả kéo theo khi bỏ khoá — đã xử lý cùng đợt**: (1) `components/lesson-path.tsx` có Ô TÌM
BÀI THEO CHỦ ĐỀ — cửa sổ 6 bài/lần (`PATH_WINDOW_SIZE`) chỉ hợp lý khi đi tuần tự, chọn tự do
mà HSK 7-9 có 357 bài thì lật từng trang 6 bài để tìm "Thành ngữ" là không thực tế; lọc theo
tên chủ đề, `normalize()` bỏ dấu tiếng Việt (gõ "do an" ra "Đồ ăn & thức uống"). (2)
`/learn/[lessonId]` hiện "Đã học X/Y từ" (đếm `word.progressState !== "NEW"`) và nhãn nút đổi
"Bắt đầu học" ↔ "Học tiếp" — nhảy vào bài bất kỳ thì trang bài phải tự nói được mình đang ở
đâu; tab "Ví dụ" ẩn hẳn khi bài chưa có câu ví dụ nào (HSK4-9, HSK 1–3 đã có từ 2026-10-19) thay vì hiện số 0 rồi bấm vào ra
màn trống.

**Học thử xong đăng ký thì từ vừa học phải THEO VÀO (sửa 2026-09-22)** — màn kết `/hoc-thu` có
nút "Lưu N từ này vào tài khoản" nhưng KHÔNG có gì lưu cả: đăng ký xong N từ biến mất sạch. Lời
hứa gãy đúng khoảnh khắc quan trọng nhất của phễu — lúc người lạ đến từ Google quyết định tạo
tài khoản. `lib/pending-words.ts` ghi tạm id vào `sessionStorage` (cùng cách
`hanni:pending-onboarding` làm với khảo sát), `components/auth-form-card.tsx` gọi
`saveTrialWords()` sau khi xác thực xong — cho CẢ đăng ký lẫn ĐĂNG NHẬP, cả email lẫn Google:
người đã có tài khoản bấm nút đó rồi chọn Đăng nhập thì lời hứa vẫn phải giữ. Chạy
`Promise.allSettled` và nuốt lỗi từng từ — việc phụ này không được chặn đường vào app.
**Bỏ qua `/onboarding` bắt buộc nếu vừa lưu được từ học thử (2026-09-23)** — `saveTrialWords()`
giờ trả về `boolean` (có từ nào được lưu hay không). Đăng ký xong mà VỪA lưu được từ trial thì
vào thẳng `/dashboard` thay vì bị đẩy qua khảo sát 3 bước — người đó vừa thể hiện ý định học rõ
ràng nhất có thể (đã chọn học thử, đã bấm "Lưu N từ"), và N từ đó ĐANG đến hạn ôn ngay lúc này
(`addWordToSrs()` đặt `dueAt = now`). Bắt đi qua 3 màn khảo sát trước khi chạm được vào chính từ
của mình là thêm ma sát đúng lúc ý định mạnh nhất — nguyên tắc time-to-value. Dashboard hero tự
nhận ra `dueNow > 0` và đưa "Ôn N từ đến hạn" lên trước (xem mục "Hai nút chính trỏ cùng một
chỗ" phía dưới); khảo sát KHÔNG mất — vẫn còn banner không chặn "Chưa có lộ trình cá nhân" ngay
trên dashboard (nhánh `onboarding.data === null`) cho ai muốn làm sau. Đăng ký KHÔNG qua trial
(vd từ CTA "Bắt đầu ngay" ở trang chủ) vẫn đi qua `/onboarding` như cũ — chỉ bỏ bước này cho
đúng 1 trường hợp đã có bằng chứng ý định mạnh.

**Lưới "Rèn từng kỹ năng" ở dashboard thiếu 2 mảng (sửa 2026-09-22)****Lưới "Rèn từng kỹ năng" ở dashboard thiếu 2 mảng (sửa 2026-09-22)** — `PRACTICE_AREAS` chỉ có
từ vựng / ngữ pháp / nghe / phát âm, trong khi `/roleplay` (luyện nói với AI — đo production chỉ
5 tin nhắn, gần như không ai dùng vì chỉ vào được từ sidebar) và `/writing` đều đã có trang
riêng; riêng luyện viết còn bị chính lời chào persona ACADEMIC hứa trước ("nắm chắc ngữ pháp và
luyện viết") mà lưới không có. **Bẫy khi thêm**: `GOAL_PERSONA[*].order` phải liệt kê ĐỦ mọi
href — thiếu cái nào thì `indexOf` trả `-1` và mảng đó bị đẩy lên ĐẦU cho mọi persona.
`.skillsGrid` đổi 4 → 3 cột để 6 thẻ thành 2 hàng đều (breakpoint nhỏ vốn đã 2 cột / 1 cột).

**Ảnh minh hoạ: dữ liệu có sẵn nhưng luồng học không render (sửa 2026-09-22)****Ảnh minh hoạ: dữ liệu có sẵn nhưng luồng học không render (sửa 2026-09-22)** — user hỏi
"chưa thấy ảnh trên production, nó ở đâu". Đo: 1.652 từ ĐÃ có ảnh, nhưng chỉ render ở từ điển
công khai, popup bấm từ trong video, thẻ "Từ vựng hôm nay" và bộ thẻ học thử — đúng 2 chỗ người
học ngồi lâu nhất (`components/flashcard.tsx`, `/learn/[lessonId]`) thì không có gì. Thêm 2 chỗ
đó + thumbnail ở danh sách `/tu-dien`. **Lưu ý khi thêm ảnh vào flashcard**: 2 mặt thẻ dùng
chung 1 ô lưới nên thẻ tự cao thêm theo ảnh — phải thu ảnh lại ở `@media (max-width: 540px)`,
nếu không 4 nút đánh giá bị đẩy xuống dưới tầm nhìn trên điện thoại.
**Vì sao hàng đợi mặc định hầu như không có ảnh**: ảnh chỉ có cho DANH TỪ CỤ THỂ, mà hàng đợi
tự do xếp theo tần suất nên toàn hư từ (的/我/你/是). Học THEO BÀI chủ đề thì ngược lại — "Đồ ăn
& thức uống" 16/16 thẻ có ảnh. Trần HSK5, xem `hanni-server/CLAUDE.md`.

**Không hứa suông khi hạ tầng chưa bật (2026-09-22)****Không hứa suông khi hạ tầng chưa bật (2026-09-22)** — `/settings` hiện ghi chú ngay trong thẻ
"Email tổng kết tuần" khi `GET /mail/configured` trả `false`: đo production thấy `MAIL_HOST`
trống mà 101/102 tài khoản đang bật mục này, tức là bày ra một nút "Bật" không dẫn tới đâu.
Cùng khuôn với phần nạp xu tự ẩn khi chưa có payOS. Thẻ bật thông báo cũng nói rõ "từ giờ sẽ
được nhắc mỗi ngày" vì server đặt sẵn giờ nhắc mặc định khi bật (xem `hanni-server/CLAUDE.md`).

**Refresh token: gộp chung 1 lượt (sửa 2026-09-22)****Refresh token: gộp chung 1 lượt (sửa 2026-09-22)** — `lib/api.ts` trước đây để MỖI request
401 tự gọi `/auth/refresh`. Dashboard bắn cả chục request SWR song song nên access token hết
hạn là cả chục lượt refresh cùng lúc với cùng 1 cookie; server xoay token cho lượt đầu rồi coi
những lượt sau là token bị đánh cắp và huỷ cả phiên — đo log production: **661 lần**, tức 661
lần đăng xuất oan với chỉ 6 người dùng thật. Giờ giữ 1 promise dùng chung (`refreshSession()`),
request tới sau thì ĐỢI kết quả lượt đang chạy. Server cũng có cửa sổ ân hạn 30s cho trường hợp
nhiều tab/thiết bị mà client không kiểm soát được — xem `hanni-server/CLAUDE.md`.

**`/roleplay` — kết quả buổi luyện (2026-09-22)****`/roleplay` — kết quả buổi luyện (2026-09-22)**: bấm "Kết thúc" giờ gọi `feedbackRoleplay()`
và hiện màn nhận xét (render bằng `MarkdownLite` có sẵn) TRƯỚC khi xoá gì; người học chọn "Đóng
buổi luyện" (mới thật sự xoá) hoặc "Nói tiếp". AI lỗi/bận thì vẫn hiện màn đó kèm lời nhắn ngắn
— không được chặn đường thoát chỉ vì nhận xét không lấy được. Xem `hanni-server/CLAUDE.md` cho
khuôn nhận xét và lý do không lưu DB.

**Khách xem lộ trình TRƯỚC khi đăng ký (2026-09-22)** — `/onboarding` làm xong 3 bước thì gọi
`previewOnboarding()` (`POST /onboarding/preview`, public) và hiện thẳng `ResultScreen` với cờ
`guest`: cùng nội dung đề xuất, nhưng nút chính đổi thành "Tạo tài khoản để lưu lộ trình" + lối
"Học thử 8 từ, chưa cần tài khoản". Trước đó bước cuối đẩy thẳng sang `/register` — trả lời
xong 3 câu mà chưa nhận lại gì. Câu trả lời VẪN lưu `sessionStorage` như cũ nên đăng ký xong tự
nộp, không phải làm lại.

**`/achievements` xếp theo mức GẦN ĐẠT** (2026-09-22): huy hiệu chưa mở khoá sắp theo
`progressCurrent/progressTarget` giảm dần, đã mở khoá xuống dưới. "Còn 2 lượt ôn nữa là xong"
thúc đẩy mạnh hơn hẳn thứ tự catalog, nơi mốc xa nhất có thể nằm ngay đầu trang và trông vô vọng.

**Phần thưởng/ngữ cảnh bị bỏ quên — rà 2026-09-22**: 3 chỗ dữ liệu đã có sẵn mà UI không dùng.
(1) `streakFreezeCount` nằm trong `GET /streak` từ lâu nhưng KHÔNG hiện ở đâu — người dùng kiếm
được lá chắn (mốc 7 ngày, mời bạn) hoặc mua 300 xu mà không thấy gì, phần thưởng vô hình thì
không tạo động lực; giờ hiện cạnh chuỗi ngày ở topbar (`components/app-shell.tsx`).
(2) Thẻ "Từ vựng hôm nay" khoe MỘT từ nhưng nút lại dẫn ra danh sách cả cấp HSK — giờ mở thẳng
`/tu-dien/<từ đó>`. (3) `components/save-word-button.tsx` thêm nút "Tôi đã biết từ này": tra từ
điển chính là lúc hay gặp từ đã biết sẵn, không nên bắt đợi gặp lại trong lượt ôn mới ẩn được.

**Ôn riêng "từ khó nhớ" (2026-09-22)** — `/study?leeches=1` dùng lại NGUYÊN bộ khung buổi ôn
(flashcard, đánh giá, quiz cuối buổi), chỉ đổi nguồn thẻ (`GET /study/leeches`) và lời dẫn; prop
`leechMode` trong `StudyInner`, `key` đổi theo mode để ép remount. Nút vào nằm ở chính mục "Từ
khó nhớ" trong `/progress` — trước đó mục đó chỉ liệt kê, xem xong không làm gì được.

**Ẩn từ đã biết (2026-09-22)** — `components/flashcard.tsx` có nút "Tôi đã biết từ này" ở mặt
SAU (chỉ hiện sau khi lật, để không ai bấm lúc chưa thấy nghĩa). `/study` xử lý bằng cách BỎ thẻ
khỏi mảng `items` chứ không nhảy qua — mẫu số thống kê cuối buổi mới đúng — và KHÔNG gọi
`/study/review` (người dùng có ôn đâu mà ghi lượt ôn). Mục "Từ đã ẩn" + nút "Học lại" ở
`/progress`. Xem `hanni-server/CLAUDE.md` cho lý do không đánh dấu "đã thuộc".

**`/account` — gộp cửa hàng (2026-09-22)**: `components/cosmetic-shop.tsx` gộp `FrameShop` +
`TitleShop` vào MỘT thẻ có tab (2 component cũ nhận prop `bare` để bỏ Card/tiêu đề riêng). Trước
đó cột phải 320px xếp chồng 4 thẻ thương mại (Premium, Ví xu, Khung, Danh hiệu) cuộn dài mà
không thấy được quan hệ giữa chúng. Số dư xu hiện ngay đầu thẻ thay vì phải cuộn lên. **Chỉ gộp
ở tầng hiển thị** — `ShopService`/`TitleService` phía server vẫn tách riêng có chủ đích.

**Cột mốc chuỗi ngày học — màn ăn mừng riêng (2026-09-23)** — research đối chiếu Duolingo: họ đo
được riêng việc tách MÀN HÌNH ĂN MỪNG cho đúng những cột mốc hiếm (không lặp lại mỗi buổi ôn)
dịch chuyển được tỉ lệ quay lại đúng ngày 7 — vì "user thấy animation 2 lần thì tới lần 3 nó chỉ
còn là hình nền" (nguồn: đội thiết kế Duolingo, xem phần trả lời cho user). Ngày 7 đặc biệt quan
trọng: nghiên cứu bên ngoài ghi nhận đây là ngưỡng mà khả năng quay lại tăng rõ rệt so với trước
đó — Hanni ĐÃ có sẵn 5 mốc `STREAK_1/3/7/30/100` trong achievement-catalog nhưng trước đây mở
khoá chỉ thêm 1 dòng vào chuông thông báo, chìm lẫn với thông báo bình luận/theo dõi.
`components/streak-celebration.tsx` — modal toàn màn hình, hiện ĐÚNG 1 lần mỗi mốc (ăn theo tính
idempotent có sẵn của `AchievementsService.unlock()` — không cần dựng cơ chế chống lặp riêng).
Kích hoạt qua `lib/streak-celebration.ts` (pub/sub module-level, cùng khuôn `lib/tour.ts`):
`lib/notifications.ts`'s `onNew()` (đã nhận MỌI thông báo qua socket có sẵn) lọc riêng
`type === "ACHIEVEMENT_UNLOCKED"` có `achievement.code` khớp `/^STREAK_(\d+)$/` rồi phát tín
hiệu — KHÔNG mở kết nối socket riêng. Mount 1 lần ở `app-shell.tsx` (như `NotificationBell`) để
bắt được sự kiện dù đang ở trang nào, vì mở khoá streak có thể xảy ra ở `/study` lẫn nơi khác
(vd học từ mới qua bản chép video). Verify TRỰC TIẾP trên production trước khi push: tạo tài
khoản thật, ôn 1 từ, gọi `GET /notifications` xác nhận đúng hình dạng
`{type: "ACHIEVEMENT_UNLOCKED", achievement: {code: "STREAK_1"}}` mà client đang lọc theo —
không đoán cấu trúc payload. Dòng "Chuỗi N ngày" cuối mỗi buổi ôn ở `/study` GIỮ NGUYÊN (đó là
trạng thái + nhắc loss-aversion cho NGÀY THƯỜNG, khác mục đích với màn ăn mừng chỉ dành cho
NGÀY HIẾM — Duolingo cũng làm song song cả 2 kiểu này, không thay thế nhau).

**Rà trang cụt**: script rà phải bắt cả `href="/x"`, `href: "/x"` (trong mảng `actions` của
NextStep), `push("/x")`, VÀ cả component import tương đối (`./trial-deck`) lẫn tuyệt đối
(`@/components/...`). Bỏ sót bất kỳ dạng nào là báo nhầm trang đã có link thành cụt — đã mắc
2 lần. Hiện 36/36 trang đều có đường đi tiếp (trừ `/connections` vốn chỉ là redirect).

components/  next-step.tsx (khối "bước tiếp theo" cuối các trang hoạt động — rà liên kết
             chéo 2026-09-22 thấy `/writing`, `/roleplay`, `/minigame` KHÔNG dẫn đi đâu cả và
             `/watch/[id]` chỉ quay lại danh sách, người học làm xong là cụt đường. Khi thêm
             chỉ gợi ý bước TỰ NHIÊN của việc vừa làm, không nhét link bừa. Lưu ý khi rà kiểu
             này: phải tính cả component con — `/listening`+`/pronunciation` tưởng cụt nhưng
             thực ra có link `/study` trong `PracticeLibrary`)
             · pwa/notification-nudge.tsx (dải mời bật thông báo ở dashboard — đo production
             0 người từng bật, chỗ bật duy nhất lại nằm trong `/settings`. CỐ Ý không tự gọi
             `Notification.requestPermission()` khi vào trang: trình duyệt nhớ vĩnh viễn, bị
             từ chối 1 lần là mất luôn cơ hội)
components/  site-shell.tsx (khung trang `(site)`: đã đăng nhập thì bọc `AppShell` để GIỮ
             sidebar, khách thì khung site tối giản — sửa 2026-09-22 sau khi user báo "phần từ
             điển mất luôn cả thanh taskbar". Gộp `/vocabulary` vào `/tu-dien` khiến người đang
             đăng nhập bấm mục sidebar là rơi sang layout `(site)`, mất sạch đường quay lại.
             `children` vẫn là Server Component nên HTML cho Google không đổi)
components/  ui.tsx · nav.tsx · flashcard.tsx (4 nút đánh giá: hint nói KẾT QUẢ — "Gặp lại
             ngay/sớm/sau vài ngày/lâu hơn nữa" — chứ không mô tả cảm giác như cũ ("Cần học
             lại"/"Nhớ được từ"), vì thứ người học thật sự đang quyết định là LỊCH gặp lại; cả
             4 nút ẩn hẳn (`hidden`) khi chưa lật thẻ thay vì hiện xám mờ khó hiểu — sửa
             2026-09-22 theo phản ánh "ui ux flashcard vẫn đang rất khó hiểu")
             · quiz-runner.tsx · comment-section.tsx
             · sidebar.tsx + bottom-nav.tsx (dữ liệu menu ở `lib/nav.ts` — xem mục "Menu
               ngắn" bên dưới. Khi bỏ mục khỏi nav PHẢI kiểm tra còn link nào trỏ tới
               không, nếu không sẽ thành trang mồ côi)
             · save-word-button.tsx (nút "Lưu để ôn tập" ở trang từ điển công khai)
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
- **Hàng có chữ + nút trên điện thoại**: KHÔNG đặt khối chữ `min-w-0 flex-1` cạnh nút `shrink-0`
  trong cùng `flex flex-wrap` — `flex-1` có độ rộng gốc 0 nên nút không bao giờ xuống dòng, chữ bị
  bóp còn 1 từ/dòng (user chụp trên Android 2026-10-15: thẻ nhắc bật thông báo). Dùng `flex-col`
  trên điện thoại, `sm:flex-row` từ màn vừa. Tương tự cột lưới chứa nội dung rộng cố định (khung
  vẽ chữ 280px, hàng tab cuộn ngang) cần `min-w-0`, không thì cả trang tràn ngang ở máy 360px.
  Kiểm tra: dựng bản production (`NEXT_PUBLIC_API_URL=… npm run build && next start`) — thẻ nhắc
  thông báo, worker chỉ có ở bản production; Chromium headless mặc định TỪ CHỐI quyền thông báo nên
  phải giả `Notification.permission = "default"` thì thẻ mới hiện.
- Next.js 16: đọc `node_modules/next/dist/docs/` khi cần — `params`/`searchParams`/`cookies()` là async.

## Chạy
```
cp .env.example .env.local     # NEXT_PUBLIC_API_URL trỏ tới hanni-server
npm install
npm run dev                    # cần hanni-server chạy ở cổng 8000
```

## Trạng thái hiện tại

### Audit UI/UX 2026-10-17 (user giao toàn quyền quyết định) — các mục cũ bên dưới có thể đã lỗi thời
Báo cáo đầy đủ (mã X/G/S/Q): claude.ai/artifact/Qvahko7HnmTrruqdyvLRs6. User yêu cầu làm ĐÚNG 8 vấn đề
đã nêu (khảo sát, từ điển, chat, khung avatar, tự thêm video, popup nạp tiền, linh vật cáo, PWA) + cho
khách xem không cần đăng nhập. Đợt 1 đã làm:
- **Bỏ hoàn toàn người dùng tự thêm video**: xoá `/watch/add`, nút "Thêm video", nút "Xoá" của chủ video,
  `isOwner`, tham số `mine` của `useVideos`, 2 loại thông báo video. Dữ liệu xoá bằng migration server.
- **Bỏ khung avatar + danh hiệu mua bằng xu**: xoá `cosmetic-shop.tsx`, `frame-shop.tsx`; `title-shop.tsx`
  giờ là `TitlePicker` ở đầu `/achievements` (9 danh hiệu mở theo huy hiệu đã đạt, chưa đạt thì ghi rõ
  huy hiệu cần đạt); khung Phượng Hoàng bật/tắt trong thẻ Premium (`PremiumFrame`); danh hiệu hiện cạnh
  tên ở bảng xếp hạng. Ví xu chỉ còn mua lá chắn streak. Người đã mua được hoàn xu (migration server).
- **Linh vật cáo chỉ còn 3 vai** (chào mừng, chúc mừng, trạng thái rỗng): vòng tải `StudyLoader` dùng logo
  chữ 汉 (nó hiện ở MỌI lần mở app, mở bài, mở đề); bỏ thẻ "Mỗi ngày một chút" ở sidebar, cáo ở thẻ học
  tiếp `/learn`, màn mở đầu kiểm tra trình độ, danh sách đề (thay bằng icon-tile). Giữ: video cáo ở màn
  đăng nhập/đăng ký (logo góc trên đổi sang chữ 汉 cho khớp site), xong bài, kết quả kiểm tra trình độ,
  kết quả thi thử, mừng cột mốc chuỗi ngày, `EmptyState` (giờ có cáo). Icon app/favicon vẫn là cáo (user
  chọn 2026-10-15, như Duolingo dùng cú làm icon).
- `/exams` (trắc nghiệm từ vựng cũ, trùng thi thử) và `/connections` thành chuyển hướng ở `next.config.ts`;
  xoá `components/exam-result.tsx`. Kệ video `/learn` chỉ hiện video tới cấp đang học + 1 (kho toàn HSK 4–5
  nên người HSK 1–2 không thấy kệ); "Từ vựng hôm nay" theo đúng cấp (`?level=`); bộ lọc `/watch` chỉ hiện
  cấp có video. `/settings` ẩn hẳn mục email tuần khi máy chủ email chưa cấu hình (trước đó lộ dòng lỗi
  nội bộ). Thanh vị trí có tên cho `/settings`, `/achievements`, `/u/[id]` (`OTHER_PAGES` ở `lib/nav.ts`).
- **Chat theo app chat phổ biến (vấn đề 3)** — `components/chat/`: `ChatComposer` dùng chung cho `/messages`,
  trợ lý AI, `/roleplay` (ô tự giãn tới ~5 dòng; Enter gửi, Shift+Enter xuống dòng, không gửi khi đang gõ
  dở bằng bộ gõ; `maxLength` ĐÚNG giới hạn server — tin nhắn 2.000, trợ lý/luyện nói 1.000 — trước đó ô không
  giới hạn nên gõ dài là ăn lỗi 400; bộ đếm "x/y ký tự" hiện khi bắt đầu gõ, vàng ở 90%, đỏ khi chạm giới
  hạn). `useStickToBottom` + `JumpToLatest`: đang ở cuối thì tự cuộn theo tin mới (và theo câu trả lời AI đang
  hiện dần); đang đọc tin cũ thì KHÔNG kéo tuột xuống mà hiện nút "Xuống tin mới" kèm số tin mới; tin mình
  gửi luôn kéo xuống; tải tin cũ ở trên không làm giật (khoá theo id tin CUỐI). Trợ lý trên điện thoại mở
  toàn màn hình (nút đóng trong header), có 4 câu hỏi gợi ý lúc chưa nói gì. Bình luận video có bộ đếm.
  `/messages` bỏ khối tiêu đề to (còn tiêu đề "Tin nhắn" gọn), khung phải lúc chưa chọn hội thoại không lặp
  nút "Tìm bạn học" nữa. `/watch/add` chuyển hướng về `/watch`.
- **Gợi ý cài ứng dụng trên điện thoại (vấn đề 8)** — trước đó `InstallPrompt` chỉ nằm trong khung app
  (người đã đăng nhập) và chỉ hiện từ ngày ghé thứ hai, nên người mới vào từ Google không bao giờ thấy.
  Giờ gắn ở `app/layout.tsx` (mọi trang, kể cả công khai), hiện ĐÚNG LÚC: ngay sau khoảnh khắc vui
  (`signalInstallMoment()` ở màn xong bài, kết quả kiểm tra trình độ, kết quả thi thử) hoặc khi đã xem 4
  trang (`hanni-page-views`, dồn qua các lần ghé); KHÔNG hiện ở đăng nhập/đăng ký, phiên học, khảo sát,
  đang làm đề (`QUIET_PATHS`); tắt thì 14 ngày sau mới mời lại. Là thanh mảnh ngay trên thanh tab dưới
  đáy (không phải popup che màn): Android Chrome/Edge có `beforeinstallprompt` → nút "Cài" 1 chạm; iOS
  Safari → "Cách cài" mở 2 bước Chia sẻ → Thêm vào MH chính; trình duyệt trong Zalo/Facebook/Instagram
  (link Hanni hay được chia sẻ qua đó, KHÔNG cài được PWA) → hướng dẫn mở bằng Safari/Chrome + nút
  "Chép liên kết"; trình duyệt Android khác → menu ⋮. Máy tính chỉ mời khi có lời mời 1 chạm thật. Lối
  vào cố định: mục "Cài ứng dụng" cuối menu (`INSTALL_LINK`, chỉ hiện khi máy chưa cài) → `/install`
  (`InstallCard` cũng có nhánh trình duyệt trong app). Manifest/worker đã đủ điều kiện cài (start_url
  `/learn`, icon 192/512/maskable, `display: standalone`, worker có `fetch`).
- **Khảo sát `/onboarding` làm lại (vấn đề 1, 2026-10-18)** — mỗi câu có tác dụng THẬT, ghi rõ "để làm gì"
  ngay trên câu hỏi, và hiện thành 1 dòng ở màn kết quả (`plan` từ server): (1) "Bạn biết tiếng Trung tới
  đâu?" — Chưa biết gì / Biết một chút, chưa chắc cấp nào (→ màn kết quả mời làm kiểm tra trình độ, gộp
  luôn lối vào đó) / Đang học một cấp HSK (7 nút, cấp 7 = HSK 7–9) → bài bắt đầu; (2) "Học để làm gì?" —
  Thi HSK (hiện thêm cấp thi + "bao lâu nữa": 3/6/12 tháng/chưa rõ, thay ô chọn ngày) → số bài + số từ còn
  lại tới cấp thi, bài/tuần; mục tiêu khác → 1 cách luyện nên thử (luyện nói AI, video, đề thi thử...);
  (3) "Mỗi ngày học bao lâu?" 5/10/15/20 phút → mục tiêu ngày theo phút (thẻ `/learn` làm tròn phút, trước
  đó hiện số thập phân). Kết quả có ĐÚNG 1 nút chính (khách "Vào bài 1", đã đăng nhập "Vào học HSK N", chưa
  chắc cấp "Làm bài kiểm tra trình độ"). Sửa kèm: nút cuối của khách từng ghi "Tạo tài khoản để xem lộ
  trình" dù không cần tài khoản; nhãn tiếng Anh "Hanni learning path"; trên điện thoại khối giới thiệu
  chiếm trọn màn đầu (giờ ẩn, thay bằng 1 dòng mục đích trong thẻ); `.shell` đổi `overflow: clip` (vòng
  trang trí rộng 598px trong màn 390 — `hidden` vẫn bị cuộn bằng code làm cả trang lệch ngang); lưới 2 cột
  ở màn ≤350px. Thẻ đứng yên mép trên khi chuyển câu (`align-items: start`).
- **Khách xem + dùng thử app không cần đăng nhập (S1, 2026-10-18 — user: "các web khác có cần đăng nhập đâu
  vẫn xem được")**: `/learn`, `/learn/[id]`, `/luyen-tap`, `/writing`, `/listening`, `/pronunciation`,
  `/watch`, `/watch/[id]`, `/minigame` (4 trò 1 mình), `/leaderboard` đổi `useRequireAuth()` → `useAuth()`.
  Vẫn cần tài khoản: `/study`, `/progress`, `/achievements`, `/messages`, `/roleplay`, `/account`,
  `/settings`, `/u/[id]` (vào là chuyển `/login?next=`). Khung app cho khách: thanh trên có "Đăng nhập" +
  "Tạo tài khoản" (thay chuông/avatar), chân sidebar có 2 mục đó (thay Tài khoản/Đăng xuất). Hook gọi API
  cần đăng nhập ở trang/khung khách vào được tự bỏ qua khi chưa đăng nhập (`useStreak`, `useStudyStats`,
  `useCurrentLesson`, `usePracticeStats`, `useUnreadMessageCount`, `useRankTiers`) — mỗi lần gọi là 1 lượt
  401 + làm mới token + SWR tự thử lại. Mời tạo tài khoản ĐÚNG LÚC cần lưu: `/learn` cột phải là thẻ "lưu
  tiến độ" (đếm bài đã học trong phiên), bài khách học xong (`pendingLessonIds()`, sessionStorage) tính là
  xong nên "Học tiếp" đúng bài kế; thẻ nhiệm vụ/giải đấu thay bằng "Thử ngay, chưa cần tài khoản"; luyện
  nghe/phát âm có dải "kết quả chưa được lưu" và KHÔNG gửi `practice/attempts`; video: thích/bình luận dẫn
  sang đăng ký/đăng nhập, "Lưu để ôn tập" giữ tạm (`addPendingWord`) rồi tự vào hàng đợi khi đăng ký;
  minigame: hết ván hiện lời mời nhận xu (`balance: null`), không có tab Đấu 1v1; bảng xếp hạng: ô "Vị trí
  của bạn" thành lời mời, ẩn theo dõi/nhắn tin + "So với bạn bè". Tab mặc định bảng xếp hạng đổi sang
  "Chuỗi hiện tại" ("Từ đã thuộc" cần ~21 ngày nên đang trống với mọi người). Server: xem mục "Khách xem +
  dùng thử" ở `hanni-server/CLAUDE.md`. `robots.ts` vẫn KHÔNG mời index các trang này (vẽ ở trình duyệt,
  HTML server chỉ có vòng tải).
- **Từ điển theo hướng Hanzii (vấn đề 2, 2026-10-18)** — `components/dictionary/`: `DictionarySearch` (dùng ở cả
  `/tu-dien` lẫn trang từ — trước đó trang từ không có ô tra): gợi ý ngay khi gõ (`GET /words?q=&pageSize=6`, server
  đã xếp hạng — bỏ dấu, pinyin viết liền, âm Hán Việt lên trước), ↑/↓/Enter chọn, "Tra gần đây" khi ô trống
  (`RememberWord` ghi `localStorage` `hanni:dict-history` lúc mở trang từ), nút micro nói tiếng Trung để tra (chỉ
  hiện khi trình duyệt có nhận dạng giọng nói); vẫn là `<form method="get">` nên không JS vẫn tra được.
  `StrokeOrder`: hoạt hình thứ tự nét từng chữ (dùng lại `hanzi-writer` + dữ liệu nét tự host, `cssVar` export
  từ `hanzi-writer-canvas.tsx`), số nét, "Luyện viết" → `/writing?c=字` (trang luyện viết đọc `?c=` qua
  `useSearchParams`, mở đúng chữ + đúng cấp). Trang từ 2 cột từ `lg` (cột phải dính: cách viết + lời mời học), nút
  nghe `AudioButton` thay `<audio controls>`, nghĩa tách từng nét đánh số (`senses()` — tách `;` ngoài ngoặc), từ
  loại tiếng Việt (`lib/pos.ts` `POS_VI`). Lưới "từ cùng chữ"/"từ cùng cấp"/video thêm `grid-cols-1` — `grid` không
  khai cột thì cột tự giãn theo `min-content` của chữ `truncate` (trang 打 rộng 860px ở màn 390). Chip cấp chỉ còn
  HSK 1–6 + "HSK 7–9" (`HSK_LEVELS`/`hskLabel` ở `lib/pos.ts`, dùng chung `/tu-dien`, `/writing`, luyện nghe/phát
  âm) — dữ liệu gộp 7–9 vào cấp 7 nên chip HSK 8, 9 luôn trống; `/tu-dien?level=8|9` → 308 sang `level=7`; điện
  thoại 1 hàng cuộn ngang. Dữ liệu (phồn thể, âm Hán Việt, nghĩa HSK 4, từ loại): xem `hanni-server/CLAUDE.md`.

### Từ điển làm lại theo Hanzii (2026-10-19 — user: "phần từ điển đang thấy hơi đần, cần làm lại", "bỏ imageUrl cũng được")
Xem thật Hanzii/Hanbeego (vai khách) trước khi làm. `/tu-dien` có 3 chế độ, đều Server Component: **không tham số** = trang chủ
tra cứu (ô tra tròn lớn + 4 tab, lưới 3 cột: từ khoá phổ biến, tra gần đây, chủ đề HSK 1 | mẹo Hán Việt, tra theo cấp, từ hôm
nay | công cụ tra cứu + mời học bài 1); **`?q=`** (+ `tab=han-tu|vi-du|ngu-phap`) = kết quả theo tab (Từ vựng: thẻ khớp chính
xác + danh sách; Hán tự: từng chữ trong ô tra — hoạt hình thứ tự nét `StrokeAnimation`, bộ thủ, số nét, âm Hán Việt, từ chứa
chữ, `GET /dictionary/char/:c`; Ví dụ: `GET /dictionary/examples`; Ngữ pháp: `GET /grammar/search`); **`?level=N`** = danh sách từ
theo cấp (trước là trang mặc định). Trang từ `/tu-dien/[slug]` 3 cột (mục lục dính | nội dung | khung Hán tự `GlyphPanel`: tab
từng chữ + phồn thể, hoạt hình nét bộ thủ tô đỏ, bộ thủ tên Hán Việt, số nét, Tập viết), đầu mục có âm Hán Việt to + chip
chủ đề/"Trùng nghĩa tiếng Việt", mục Nghĩa · Nhớ bằng Hán Việt (từ 1 chữ: chữ đó trong các từ ghép, vd 书 thư → 读书 độc thư) ·
Lượng từ · Từ ghép · Cùng chủ đề · Luyện tập (`WordPractice`: chấm thanh / đặt câu AI / viết) · Video. **Bỏ ảnh minh hoạ** khỏi
từ điển (Hanzii không có; ảnh lấy tự động hay lạc nghĩa). Bẫy: `dictHref`/`DICT_TABS` phải nằm ở file THƯỜNG (`lib/dictionary.ts`)
— để trong file "use client" thì trang Server Component gọi là lỗi 500 "Attempted to call dictHref() from the server"; lưới
không khai `grid-cols-1` lại tràn ngang ở 390px (danh sách cấp rộng 957px).

### Trang chủ khách làm lại (audit S13/G4, 2026-10-19 — user: "tham khảo các web khác làm như thế nào")
Xem thật trang chủ Hanzii, Hanbeego, Duolingo, SuperChinese, Migii (khổ 1440 + 390, như khách) trước khi làm:
Hanzii = công cụ trước tiên (ô tra cứu to đầu trang + "Từ khóa hot", trang chỉ cao ~1.600px); Hanbeego = nội dung
thật + "Kho học liệu" bằng con số + 1 nút "Bắt đầu học ngay"; Duolingo = 1 nút chính; SuperChinese = cho thử phương
pháp ngay + khu trợ giảng AI riêng. Áp vào `app/(site)/page.tsx`: hero giữ thông điệp Hán Việt + `DictionarySearch`
(micro, quét ảnh) + từ khoá gợi ý bấm được; dải "Kho học liệu" (số từ + số từ có Hán Việt lấy từ API); 1 lưới 6 lối
vào khách dùng được ngay (học bài 1, thi thử, từ điển, quét ảnh, phiên âm, kiểm tra trình độ) thay 2 khối trùng ý dẫn
vào trang bắt đăng nhập; thử chấm thanh điệu 你好 ngay trên trang (`ToneCheck`, khách dùng được); khối luyện thi HSK;
khối trợ giảng AI trỏ đúng chỗ từng tính năng; câu hỏi thường gặp viết lại đúng hiện trạng. Bỏ khối "Thói quen nhỏ"
(chỉ lặp nút học) + CSS `.discovery-*`/`.habit-*`. Điện thoại: ẩn hình minh hoạ hero (cao 370px) để màn đầu thấy
ngay nút học + ô tra (như Hanbeego/Hanzii). Footer pháp lý (Hanzii/Hanbeego đều có, kèm dấu Bộ Công Thương) chờ Q6.

### Gỡ 2026-10-19 (audit X2/X3, Q2/Q4 — user duyệt "triển khai nhé")
- **Đấu 1v1** khỏi `/minigame` (tab, nhãn "Đấu 1v1" ở thẻ trò chơi, luật chơi, bước hướng dẫn, bảng ELO + bậc rank +
  đếm ngược mùa), tab **ELO** ở bảng xếp hạng (`LEADERBOARD_METRICS`), mục menu đổi tên "Trò chơi luyện từ".
  `lib/duel.ts`, `components/rank-emblem.tsx` + kiểu `Duel*`/`RankTier*` ở `lib/types.ts` còn nằm lại vì bộ phân
  loại auto mode chặn xoá file — không nơi nào import nên không vào bundle; xoá tay khi được phép.
- **Khung avatar Phượng Hoàng**: nút bật khung ở thẻ Premium, viền khung ở `/u/[id]`, prop `frameColors` của `Avatar`,
  `useFrameShop`/`equipFrame`. Danh hiệu theo huy hiệu giữ nguyên.
- **Nạp xu bằng tiền thật CHƯA gỡ** (bộ phân loại chặn sửa luồng thanh toán ở server) — khối "Nạp thêm xu" ở
  `/account` vẫn tự ẩn vì payOS chưa cấu hình.

### Lớp học, hợp tác, bài đọc AI, trang pháp lý (2026-10-19 — user: "thu hút người dùng", "dễ chào mời đối tác", "điểm cao")
Rà toàn site trước khi làm (khách 33 trang × 390/1440, đã đăng nhập 23 trang × 390/1440/1920): 0 tràn ngang, 0 lỗi JS/request
— lỗi thật là bảng xếp hạng công khai đầy tài khoản thử (đã lọc ở server), trang "Từ đã biết" dài 66.789px, thẻ trống ở `/learn`.
- **Lớp học** (`lib/classrooms.ts`, `app/(app)/lop-hoc`, `app/(site)/lop/[code]`, `components/classrooms/`): tham khảo Duolingo
  for Schools (lớp + giao bài + xem tiến độ, miễn phí, sẽ đóng 7/2027) — Hanbeego `/partners` chỉ bán sỉ Premium. `/lop-hoc`: lớp
  tôi dạy (tạo lớp, mã) + lớp tôi học (vào bằng mã → sang `/lop/[mã]` xem trước). `/lop-hoc/[id]` giáo viên: mã to + "Gửi cho học
  viên" (Web Share) / "Chép đường dẫn" / "Google Classroom" (`classroom.google.com/share?url=` — không cần khoá API), 4 ô tóm tắt,
  giao bài (bài học theo cấp từ `useLearnPath`, hoặc đề từ `/mock-exams`, hạn nộp theo ngày giờ VN), danh sách bài giao + "Xem N bạn
  chưa làm", bảng tiến độ (máy tính: bảng 8 cột; điện thoại: thẻ từng người, xếp LÊN TRƯỚC phần giao bài). Học viên: bài tập + "Làm
  ngay", bảng phút học tuần của lớp, ghi rõ giáo viên thấy gì, "Rời lớp". `/lop/[mã]` công khai: khách thấy lớp + giáo viên rồi
  "Tạo tài khoản để vào lớp" (`?next=` quay lại đúng trang). Trang chủ: thẻ `ClassAssignmentsCard` ngay dưới thẻ Học tiếp (chỉ khi
  có bài chưa làm). Menu: **"Lớp học" thay chỗ "Tin nhắn"** (vẫn 8 mục); tin nhắn thành nút có số chưa đọc trên thanh trên
  (`components/messages-button.tsx`), bỏ chấm đỏ tin nhắn ở nút "Thêm".
- **Hợp tác `/hop-tac`** (Server Component, SEO; dàn ý theo Hanbeego `/partners`: 3 nhóm đối tác, 3 bước, FAQ) — nút chính "Tạo lớp
  miễn phí" (dùng được ngay, không phải chờ báo giá), form liên hệ `components/partners/partner-lead-form.tsx` → `POST
  /partners/leads` (ô ẩn `website` bẫy bot). Không công bố email/điện thoại cá nhân (chờ thông tin pháp lý từ user).
- **Giới thiệu `/gioi-thieu`**, **Điều khoản `/dieu-khoan`**, **Chính sách bảo mật `/chinh-sach-bao-mat`** (`components/legal/legal-page.tsx`):
  ghi ĐÚNG cách xử lý dữ liệu thật — chấm thanh điệu chạy trên máy; nhận dạng giọng nói của Chrome/Edge gửi âm thanh cho Google/Microsoft;
  nội dung tính năng AI gửi qua Gemini API; ảnh quét không lưu; giáo viên thấy gì trong lớp. Chân trang khách thêm cột "VỀ HANNI",
  chân trang app có dải liên kết. Sitemap + robots đã thêm các trang này (chặn `/lop-hoc`, `/lop/`, `/bai-doc`).
- **Bài đọc AI `/bai-doc/[lessonId]`** (`lib/reading.ts`; server: mục "Bài đọc AI theo bài học"): kiểu Du Chinese — hội thoại 2 bên
  (A trái, B phải), từ của bài tô đỏ bấm ra nghĩa + Hán Việt + loa, bật/tắt Pinyin (mặc định bật HSK 1–2) và Dịch, "Nghe cả bài"
  (`speakSequence()` ở `lib/listening-audio.ts`: A giọng nữ, B giọng nam, câu đang đọc sáng lên), "Dùng 9/10 từ của bài". Chưa có
  thì người đăng nhập bấm "Viết bài đọc cho bài này (1 lượt AI)" (~12 giây). Lối vào: màn xong bài ("Đọc hội thoại dùng N từ vừa
  học") + trang chi tiết bài. Đo thật: bài 1 HSK 1 → "Chào hỏi qua điện thoại", 8 câu, mọi chữ thuộc HSK 1.
- **Lịch học** (`components/calendar-reminder.tsx`, ở `/settings`): Google Calendar (đường dẫn TEMPLATE + `RRULE:FREQ=DAILY`) và
  tệp `.ics` cho lịch iPhone/Outlook, giờ "trôi" theo máy, thời lượng = mục tiêu phút/ngày — trên iPhone thông báo đẩy chỉ chạy khi
  đã cài app, lịch của máy thì luôn nhắc.
- Sửa kèm: `/tu-da-biet` gom 969 từ theo cấp bằng `<details>` (vẫn đủ trong HTML cho Google; điện thoại 66.789px → 4.095px);
  `/minigame` đổi tiêu đề "Minigame" → "Trò chơi luyện từ"; thẻ "Giải đấu tuần" khi bảng thưa hiện thang bậc + luật lên/xuống hạng;
  thẻ "Từ vựng hôm nay" thêm âm Hán Việt + câu ví dụ (trước đó nửa thẻ trống ở 1920px).

### Tính năng tạo khác biệt + AI (2026-10-18 — user: "thêm tính năng hay, tạo sự khác biệt, thêm AI")
Đều GẮN vào luồng học có sẵn, không thêm trang hay mục menu mới.
- **Chấm thanh điệu bằng đồ thị cao độ** (`lib/pitch.ts`, `components/tone/tone-check.tsx`) — không app học tiếng
  Trung nào cho người Việt có. Ghi âm (tự dừng khi nói xong: đo ồn nền 150 ms đầu, lặng 0,7 s), dò cao độ bằng YIN
  ngay trong trình duyệt (giải mã về 16 kHz, ~10 ms/từ), vẽ đường giọng bạn chồng lên ghi âm chuẩn của từ đó (file
  `/media/audio` có header CORS), chấm từng âm tiết + "Nghe giống thanh X" + mẹo theo dấu tiếng Việt (`TONES` ở
  `lib/pinyin.ts`). Chấm theo ĐẶC TRƯNG thanh (phẳng / lên / võng / rơi, biên độ cần đạt lấy theo giọng chuẩn) chứ
  không so khoảng cách đường thẳng — so đường thẳng thì thanh 2 với thanh 3 vẫn 97 điểm. Âm tiết mà chính giọng
  chuẩn không mang đặc trưng điển hình (biến điệu, thanh nhẹ) thì so thẳng đường với giọng chuẩn. Bẫy đã gặp khi
  chỉnh trên ghi âm thật: (1) sửa lỗi quãng tám theo trung vị CẢ TỪ làm hỏng thanh 4 (汉 rơi thật 385→197 Hz) — sửa
  theo khung liền trước + mốc theo khung "chắc"; (2) cuối thanh 4 / đáy thanh 3 là giọng RÈ (to nhưng tuần hoàn
  kém) — dò có dẫn hướng quanh cao độ khung trước, ±1,5 nửa cung/khung (nới 28% thì 骂 tụt xuống 80 Hz); (3) chuẩn
  hoá thời gian giữ khe trống thay vì dồn điểm (dồn thì mất đáy thanh 3). Đo trên 21 âm tiết: đúng thanh 94 điểm,
  sai thanh 12, đoán đúng 20/21. Biến điệu 3-3, 一, 不 tính sẵn (`surfaceTones`). Kiểm thử: Chromium
  `--use-file-for-fake-audio-capture=<wav>` (micro giả đọc file) — 烫 đọc 烫 = 100, đọc 糖 = 0 "giống thanh 2".
  Có ở: thẻ giới thiệu từ trong phiên học (khách cũng dùng được), trang từ điển, `/pronunciation` (chấm luôn bản vừa
  ghi, `ToneAnalysis`). Giọng không gửi đi đâu, không tốn lượt AI.
- **Luyện nói bằng giọng** (`/roleplay`): micro cạnh ô nhập (`lib/speech.ts` — dùng chung với ô tra từ điển), chữ
  hiện dần, nói xong tự gửi; câu trả lời AI tự đọc to bằng giọng tiếng Trung (`speakChinese()` ở
  `lib/listening-audio.ts`), nút bật/tắt nhớ `localStorage` `hanni:roleplay-speak`, mỗi câu AI có "Nghe".
- **AI trong từ điển** (`components/ai/`, `lib/ai-tools.ts`; server: mục "Tiện ích AI"): **mẹo nhớ** theo âm Hán
  Việt (`WordMnemonic` — đã có thì ai cũng thấy, cả trong thẻ giới thiệu từ; chưa có thì người đã đăng nhập bấm tạo,
  tạo 1 lần dùng chung), **đặt câu với từ này** (`SentencePractice` — gõ hoặc nói, AI chấm điểm + câu đã sửa + nhận
  xét tiếng Việt), **phân tích/dịch cả câu** ngay ở `/tu-dien?q=` (`SentenceAnalysis` — hiện khi gõ câu, hoặc cụm
  2 chữ/2 từ không trùng mục từ nào; câu tiếng Việt thì dịch sang tiếng Trung; từng từ kèm Hán Việt, bấm sang trang
  từ). Chung hạn mức 10 lượt/ngày (Premium 200) — dòng mới trong popup Premium.
- **Popup Premium làm lại** (vấn đề 6 — `components/premium-modal.tsx`): 2 bước (chọn gói → xác nhận rồi mới sang
  payOS), quyền lợi dạng thẻ có "thường → Premium" ngay trong thẻ, 3 gói chính có giá quy theo tháng + % tiết kiệm
  (gói khác thu vào 1 hàng), câu hỏi thường gặp, bước xác nhận ghi sẵn ngày hết hạn (mua thêm thì cộng nối tiếp,
  khớp `addMonthsClamped` của server) + cách thanh toán 3 bước + "không lưu thẻ, không tự gia hạn". payOS chưa cấu
  hình thì thanh dưới là "Sắp mở bán". Điện thoại: dạng tấm trượt từ đáy, Esc/bấm nền để đóng. CHƯA có chính sách
  hoàn tiền / kênh hỗ trợ (chờ thông tin pháp lý từ user) nên không ghi.

### Lộ trình một nút bấm (tái cấu trúc 2026-10-05 — đọc mục này TRƯỚC)
User báo: flashcard "tự nhảy vào HSK4 khi muốn học HSK1, không theo chủ đề", web "nhiều chức
năng nhưng rời rạc", và giao toàn quyền định hướng lại sản phẩm. Research (Duolingo làm lại màn
chính 2022 vì người học không biết dùng app "đúng"; HelloChinese/SuperChinese dạy theo chủ đề,
bài 5-10 phút; Migii/Hanzii — đối thủ Việt — thu tiền chủ yếu từ luyện thi) → chọn mô hình:
**một lộ trình, một nút "Học tiếp"; mọi thứ khác xoay quanh nó.** Những gì ghi về "dashboard" ở
các mục cũ bên dưới là LỊCH SỬ — trang đó đã gộp vào `/learn`.
- **Học từ mới = phiên học `/bai-hoc/[id]`** (`components/lesson-session/`), không còn là lật
  flashcard SRS với từ chưa từng thấy. Server dựng sẵn kế hoạch (`GET /learn/lessons/:id/
  session`): giới thiệu nhóm 4 từ → luyện ngay nhóm đó (nghĩa / nghe / Hán tự) → ghép cặp → ôn
  trộn + điền từ vào câu ví dụ. Câu sai quay lại cuối bài (tối đa 2 lần/từ). Thẻ giới thiệu có
  pinyin tô màu thanh, âm Hán Việt + **mẹo thanh điệu** ("học → thanh 2 ✓", quy luật dấu tiếng
  Việt → thanh tiếng Trung, đúng ~87%). Học xong → `POST /complete` đưa từ vào SRS, màn hoàn
  thành có bài tiếp theo + nút chia sẻ. SWR của trang này TẮT revalidate — server trộn câu hỏi
  ngẫu nhiên mỗi lần gọi, tải lại giữa chừng là đổi đề.
- **Khách học được ngay**: kết quả giữ ở `lib/pending-lessons.ts` (sessionStorage), đăng
  ký/đăng nhập xong `auth-form-card.tsx` nạp lên (cùng khảo sát + từ học thử còn chờ) rồi vào
  thẳng `/learn`. Chỉ người đăng ký "tay trắng" mới qua `/onboarding`.
- **`/learn` là trang chủ** (`components/learn/`): thẻ "Học tiếp", lộ trình gom theo CHỦ ĐỀ
  (bài "X (1/2)", "X (2/2)" liền nhau thành 1 cụm), cột phải = chuỗi ngày + mục tiêu + từ cần
  ôn, nhiệm vụ ngày, giải đấu tuần. Đổi cấp lưu ở server (`courseLevel`) — mọi trang theo cùng
  một cấp. `/learn?level=N` (thẻ cấp ở trang chủ) = chọn cấp đó.
- **Ôn tập `/study` chỉ ôn từ đã học** — server không còn trả từ mới khi không có bài/cấp (gốc
  của lỗi HSK4). Màn trống nói rõ + nút học bài tiếp theo.
- **Menu ngắn + trang Luyện tập** (`lib/nav.ts`, đổi 2026-10-15 — thay bản nhóm xổ ra kiểu web
  Hanbeego 06/10 vốn dài lại 10–20 dòng; user thấy rối, "hình như user thích thu gọn hơn").
  Nghiên cứu kỹ trước khi đổi: Hanzii (4,8★, 1 triệu+ lượt tải) chỉ 6 mục thanh trên; app Hanzii,
  Migii HSK, Hanbeego đều 5–6 tab dưới đáy + 1 trang lưới công cụ; web Hanbeego 28 mục phải kèm ô
  "Tìm kiếm tính năng ⌘K"; NN/g: menu ẩn sau ☰ được dùng ít hơn hẳn menu luôn hiện (27% vs 48%).
  - **Sidebar máy tính** = 5 mục học (Trang chủ, Ôn tập + số từ đến hạn, Luyện thi HSK, Luyện tập,
    Từ điển) · vạch ngăn · Xếp hạng, Tin nhắn + số chưa đọc, Tiến độ · chân: Tài khoản, Đăng xuất,
    **"Thu gọn menu"** (chỉ còn dải biểu tượng 76px, rê chuột thấy tên; nhớ bằng `localStorage`
    `hanni:sidebar-collapsed` qua `useSyncExternalStore` — Wikimedia đo: ai thu gọn thì giữ luôn).
  - **Trang `/luyen-tap`** (`app/(app)/luyen-tap`) gom nghe/phát âm/nói AI/viết · video/trò chơi ·
    phiên âm/ngữ pháp/từ đã biết/kiểm tra trình độ (`PRACTICE_SECTIONS`), mỗi ô 1 dòng mô tả, kèm
    ô tra từ gửi sang `/tu-dien?q=`. Đang ở trang công cụ nào trong đó thì mục "Luyện tập" sáng —
    TRỪ công cụ nằm dưới 1 mục khác (`/tu-dien/quet` thuộc "Từ điển": `isNavActive` không sáng 2 mục
    cùng lúc, `pageLabel` lấy đường dẫn khớp dài nhất).
  - **Điện thoại/máy tính bảng (< lg)**: thanh tab dưới đáy `components/bottom-nav.tsx` (Trang chủ,
    Ôn tập, Luyện thi, Luyện tập, **Thêm** = mở ngăn kéo menu đầy đủ; bỏ nút ☰ trên thanh trên).
    Chiều cao thanh là biến CSS `--bottom-nav-h` (0 từ lg) — nội dung app chừa đáy theo biến này,
    các nút nổi (trợ lý AI, mời cài app) và khung phụ đề video trên điện thoại cũng tính theo nó.
    Thêm nút nổi/khung cao theo màn hình mới thì nhớ trừ biến này.
  - `pageLabel()` cho nhãn breadcrumb ở `app-shell.tsx`. "So với bạn bè" ở `/leaderboard`. Mặc định
    sau đăng nhập: `HOME_PATH` (`lib/auth-redirect.ts`).
- **Khung chọn chủ đề → bài dùng chung** (`components/learn/topic-explorer.tsx`, 2026-10-16/17 —
  user chụp `/learn` hỏi "sao khoảng này trống"): `variant="learn"` ở `/learn`, `variant="review"` ở
  `/study` (bài đã học → "Ôn flashcard", chưa học → "Học trước"; trước đó `/study` tự dựng lưới riêng
  bị kéo dài trắng + bỏ trống nửa phải). Cột PHẢI quyết định chiều cao (`lg:min-h-[32rem]`), danh
  sách chủ đề `absolute inset-0` trong cột trái nên cao đúng bằng cột phải rồi tự cuộn — chủ đề HSK 1
  chỉ 1–2 bài, để 2 cột tự cao theo nội dung là mảng trống lớn (Hanbeego không gặp vì 4–9 bài/chủ
  đề). Khung phải có thêm **từ vựng của 1 bài** (`useLesson`: chữ Hán, pinyin, âm Hán Việt, nghĩa, nút
  nghe + ngữ pháp trong bài). Cuộn chủ đề đang học vào tầm nhìn bằng `scrollTop/scrollLeft` của chính
  danh sách — `scrollIntoView` kéo cả trang. Cùng đợt rà bố cục máy tính (quét 23 trang ở 1920/1440
  bằng bộ dò "cột lệch chiều cao"): `/thi-thu-hsk` đưa "Câu hỏi thường gặp" vào cột trái dưới danh
  sách đề; `/account` chuyển cửa hàng trang trí sang cột trái (cột 320px làm ô giá + "Mở khoá" gãy
  dòng), nhãn "HSK Student" lên góc trên banner (góc dưới bị avatar đè); `/learn/[lessonId]` danh
  sách từ 2 cột từ xl + nhãn **Hán Việt** (ẩn cùng nghĩa khi tự ôn); 3 thẻ cuối `/learn` cao bằng
  nhau. Cột phải `lg:sticky` (`/settings`, `/learn/[lessonId]`) ngắn hơn là bình thường — đi theo khi cuộn.
- **`/study` không tham số = chọn bộ thẻ** (`components/study/study-hub.tsx`); `?review=1` ôn
  từ đến hạn, `?lesson=` ôn đúng 1 bài (gồm MỌI từ của bài, kể cả từ vừa học chưa tới hạn — nếu
  không thì vừa học xong bấm "Ôn bằng flashcard" sẽ ra "không có từ cần ôn"), `?leeches=1`.
- **Kiểm tra trình độ `/kiem-tra-trinh-do`** (`components/placement-test.tsx`, 2026-10-06) — thay
  cho TỰ KHAI cấp. Đề lấy 1 lần (`GET /learn/placement`), câu hỏi dùng lại `ChoiceStep` của phiên
  học; đúng 3 là qua cấp (đủ 3 thì bỏ câu thứ 4), sai 2 là trượt cấp đó. **Chọn cấp bắt đầu**
  (2026-10-15, như "Đánh giá năng lực" của Hanzii — người đã học HSK 3 khỏi làm lại câu HSK 1, mặc
  định vẫn HSK 1): qua thì lên cấp; trượt NGAY cấp xuất phát thì xuống dần tới khi gặp cấp vững.
  Cấp đề xuất = cấp THẤP NHẤT chưa vững (đúng cho cả 2 chiều, `recommendedLevel()`). Nút "Tôi chưa biết từ này" (tính sai, chỉ hiện đáp án) để người mới không phải đoán bừa.
  Kết quả → `/bat-dau?level=N` (khách vào bài 1, đã đăng nhập thì lưu cấp). Khách: cấp ghi tạm
  `savePendingCourseLevel()` → đăng ký xong `drainPendingCourseLevel()` đặt cấp lộ trình (chạy SAU
  bài học chờ — kết quả đo thật thắng cấp tự khai). Lối vào: nút "Tôi đã biết một chút" ở trang
  chủ, link cạnh tab cấp ở `/learn`, link ở bước 1 khảo sát, trợ lý AI (`placement`), sitemap.
- **Luyện thi HSK `/thi-thu-hsk`** (`components/mock-exam/`, 2026-10-06) — đề thi thử đúng cấu
  trúc đề thật (đối thủ đều có; `/exams` cũ chỉ là trắc nghiệm từ vựng, giờ là mục "Luyện nhanh
  từ vựng" trong trang này). Sidebar + menu khách "Luyện thi HSK" trỏ vào đây. Màn làm bài kiểu
  XieHanzi: cuộn theo phần Nghe/Đọc, đồng hồ đếm ngược (hết giờ tự nộp ĐÚNG 1 lần), bảng số câu
  (máy tính: cột phải; điện thoại: tấm dưới đáy), đánh dấu câu, pinyin bật sẵn với HSK 1–2. Bài
  làm dở lưu `localStorage` → tải lại trang vẫn "Làm tiếp". Chấm ở server; chữa bài lọc câu sai,
  có lời thoại + pinyin + bản dịch + giải thích, câu điền từ hiện từ đúng ngay trong chỗ trống.
  **Phần nghe** (`lib/listening-audio.ts`): giọng tiếng Trung của trình duyệt, 2 giọng nam/nữ
  (thiếu giọng nam thì hạ cao độ giọng nữ), mỗi câu 2 lần như đề thật; có `audio.url` thì phát
  ghi âm thật; thiết bị không có giọng tiếng Trung thì hiện lời thoại thay vì im lặng. **Màu**:
  phương án ĐÃ CHỌN dùng màu tối trung tính (`foreground`) — màu chủ đạo Hanni là đỏ, tô đỏ lúc
  đang làm bài trông như báo sai; xanh/đỏ chỉ dùng khi chữa bài. Khách làm xong bấm "Lưu điểm"
  → `savePendingExam()` → đăng ký xong `drainPendingExam()` nộp lại bằng tài khoản.
  **Bổ sung 2026-10-15 (tham khảo Hanzii, Migii HSK — app luyện thi cùng công ty Hanzii —, Hanbeego)**:
  thẻ đề có trạng thái (Đang làm dở x/40 + thanh tiến độ + "Làm tiếp" — đọc `localStorage` qua
  `useSyncExternalStore`, server không có; Đạt/Chưa đạt + điểm cao nhất + "Làm lại"); màn kết quả có
  **bảng đáp án** 40 ô xanh/đỏ/xám (bấm tới câu), **phân tích từng phần** (8 dạng câu, thanh %,
  2 phần yếu nhất kèm mẹo + nút luyện đúng kỹ năng — `lib/mock-exam.ts` `PART_INFO`), **luyện lại
  câu sai** (chọn lại, chấm ngay + lời giải), **từ vựng từng câu kèm âm Hán Việt** trong chữa bài
  (server gửi `words[]`), **lưu từ ở câu sai vào Ôn tập** (tối đa 20/lần — từ thêm vào là đến hạn
  ngay, làm bừa 1 đề ra 89 từ; khách thì nút "Lưu điểm + N từ" ghi tạm `savePendingWords()`, đăng ký
  xong nạp cả điểm lẫn từ). Trang danh sách: ô "Chưa biết nên thi cấp nào?" → kiểm tra trình độ (như
  "Đánh giá năng lực" của Hanzii), khối **Phân tích điểm mạnh, yếu + Lịch sử làm bài** cho người đã
  đăng nhập (`/mock-exams/analysis/me`, `/attempts/me`). Hanzii/Hanbeego bắt đăng nhập (Hanzii còn
  bắt nâng cấp ngay cả đề miễn phí) mới cho làm — Hanni cho khách làm trọn vẹn là lợi thế, giữ nguyên.
  **Hỏi trợ lý AI về từng câu** (lớp cuối "chat với trợ giảng AI" của Migii, 2026-10-15): nút "Hỏi trợ
  lý Hanni về câu này" dưới mỗi câu đã chữa (người đã đăng nhập) → `askAssistant(text)` (sự kiện
  `hanni:ask-assistant`) → widget tự mở, tạo phiên MỚI và gửi câu hỏi soạn sẵn (lời thoại/câu, đáp án
  đúng, đáp án đã chọn, "dựa vào từ khoá nào"). Màn thi nằm ngoài khung app nên màn kết quả tự gắn
  `<AssistantWidget />`. Câu hỏi ≤ 1000 ký tự (giới hạn `AskAssistantDto`).
  **HSK 2 (2026-10-16)**: dạng `judge-text` (đoạn văn + câu ★, nút "Câu ★ đúng/sai"); phần có
  `continues` (nửa sau dùng bộ tranh/đáp án riêng) vẫn mang nhãn "第N部分" của phần chính thức
  (`officialIndexes()` ở `lib/mock-exam.ts`), hướng dẫn tự ghi A–F/A–E và có "thừa 1" hay không
  theo số phương án; `partScores` gộp 2 nửa. Bảng cấu trúc đề theo cấp
  (`components/mock-exam/exam-structure.tsx`, cả 2 bảng nằm sẵn trong HTML — bảng ẩn chỉ gắn
  `hidden` — để Google đọc được "cấu trúc đề HSK 2").
  **HSK 3 (2026-10-16)**: phần Viết (icon `pencil`). Câu sắp xếp (`OrderBuilder` trong
  `exam-items.tsx`): bấm mảnh dưới để đưa lên câu, bấm mảnh trên câu để trả lại, "Xếp lại" — CHỈ khi
  đủ mảnh mới gọi `onChange(câu)`, rút bớt mảnh thì `onChange(null)` (nên `onChange` nhận `null`);
  làm tiếp bài dở dựng lại thứ tự từ câu đã lưu (`restoreOrder`, có quay lui). Chữa bài: câu của
  mình (gạch nếu sai) + "Đáp án" + "Cũng đúng" (chỉ các cách KHÁC cách mình đã xếp). Câu viết chữ
  theo pinyin: `<ruby>` đặt pinyin TRÊN ô trống, 6 chữ đồng âm dạng lưới 6 cột co giãn (vừa 1 hàng ở
  360px). Luyện lại câu sai chấm bằng `isRightAnswer()` (`lib/mock-exam.ts`, giống server: bỏ dấu
  câu, nhận `alternatives`). Câu ★ (xét đúng/sai hoặc câu hỏi phần đọc) dùng chung `StarLine`; câu
  điền từ 56–60 là hội thoại 2 dòng "A：/B：" → `whitespace-pre-line`. Lời thoại trong chữa bài: nhãn
  "Nam:/Nữ:" nằm CÙNG dòng với lời (tách cột thì đoạn nghe dài bị dồn vào ~180px ở màn 360).
  **Luyện từng dạng bài (2026-10-17, như Migii HSK)**: `/thi-thu-hsk/dang-bai/[slug]` (`app/(site)/
  thi-thu-hsk/dang-bai`, trong `(site)` nên người đăng nhập giữ sidebar; slug `hsk3-viet-1` cùng server)
  — 1 phần đề gom từ mọi đề cùng cấp (25 trang cho HSK 1–3), đề render sẵn từ server (Google đọc được),
  `components/mock-exam/practice-runner.tsx` làm câu nào chấm câu đó qua `POST /mock-exams/practice/
  check` (không đồng hồ, không lưu lượt làm), thanh tiến độ dính trên cùng, "Làm lại". `ExamItem` nhận
  `id` riêng (`<đề>-q-<số>`) vì số câu trùng giữa các đề. Lối vào: mục "Luyện từng dạng bài" dưới
  danh sách đề ở `/thi-thu-hsk` (đổi theo tab cấp; mọi cấp nằm sẵn trong HTML, cấp khác chỉ `hidden`),
  nút **"Luyện riêng dạng này"** ở ô "Nên luyện thêm" màn kết quả + ô "Yếu nhất" (khách cũng thấy —
  trang công khai; `practiceHref()`), sitemap. Câu hỏi gửi trợ lý AI dùng chung `assistantPrompt()`
  (`lib/mock-exam.ts`) cho màn kết quả đề lẫn trang luyện dạng.
- **Bảng phiên âm `/phien-am`** (`app/(site)/phien-am`, `components/pinyin/`, `lib/pinyin.ts`,
  2026-10-15) — bước 拼/声 của dải "Sáu chặng" ở trang chủ trước đó trỏ sang `/tu-dien` và
  `/pronunciation` (hứa "làm quen phiên âm", "nghe mā má mǎ mà" mà không có chỗ nào dạy). Công khai,
  server render cho SEO ("bảng phiên âm tiếng Trung" là truy vấn lớn). Gồm: 4 thanh + đường cao độ
  SVG + so với dấu tiếng Việt + 3 quy tắc biến điệu; **mẹo Hán Việt → thanh** với tỉ lệ đúng ĐO
  THẬT từ server (thanh ngang → 1 đúng 96%...); 21 thanh mẫu / 36 vận mẫu đọc theo kiểu "gần âm
  Việt nào"; bảng ghép âm theo phụ âm đầu (ô trống = thanh không có chữ đơn 1 cách đọc có ghi âm —
  để trống chứ không phát sai); luyện nghe 10 câu chọn thanh (đề dựng + phát câu đầu NGAY trong
  lượt bấm "Bắt đầu" — trình duyệt chỉ cho tự phát âm thanh trong sự kiện người dùng). Lối vào:
  "Sáu chặng", nút "Học phát âm trước (10 phút)" ở `/learn` (HSK 1 chưa xong bài nào), sidebar
  nhóm "Từ vựng & ngữ pháp", menu khách "Phát âm" (thay "Luyện tập" → `/listening` cần đăng nhập),
  trợ lý AI (`pinyin`). Nút CTA cuối trang: khách → `/bat-dau?level=1`, đã đăng nhập → `/learn`
  (KHÔNG `/bat-dau?level=1`: trang đó lưu luôn cấp 1, người đang học HSK 3 sẽ bị đổi cấp).
- **Quét ảnh học từ `/tu-dien/quet`** (`components/scan/scan-tool.tsx`, `lib/scan.ts`, 2026-10-17) —
  user muốn "AI quét chụp ảnh, OCR" như app đếm calo chụp bữa ăn. Trang CÔNG KHAI (SEO "dịch tiếng
  Trung qua ảnh"), công cụ cần đăng nhập (thường 3 ảnh/ngày, Premium 100 — khách thấy lời mời tạo
  tài khoản). Chụp (`capture="environment"`), chọn, kéo thả hoặc dán (Ctrl+V) ảnh → thu về ≤1600px
  JPEG ở trình duyệt (`prepareImage`, ảnh điện thoại 4–12MB còn vài trăm KB) → `POST /scan`. Kết quả
  có 2 phần: "Trong ảnh có" (món ăn, đồ vật — tên tiếng Việt + chữ Hán) và "Chữ trong ảnh" (từng
  dòng + câu dịch); mỗi từ khớp từ điển bấm được → thẻ từ ngay dưới (Hán Việt, nhãn "Trùng nghĩa
  tiếng Việt", nghĩa TỪ ĐIỂN Hanni chứ không phải câu dịch máy, audio, lưu ôn tập, link từ điển);
  danh sách "Từ vựng trong ảnh" + nút "Lưu N từ vào ôn tập" (`addWordToSrs` từng từ); "Hỏi trợ lý
  Hanni về ảnh này" gửi nội dung quét sang trợ lý. Pinyin của đoạn ngoài từ điển chỉ đặt lên chữ
  Hán (`splitPlain`). Lối vào: nút camera cạnh ô tìm ở `/tu-dien`, ô "Quét ảnh học từ" ở
  `/luyen-tap`, trợ lý AI (`scan`), bảng Premium. Ảnh không lưu ở đâu cả.
- **Báo cáo tuần/tháng/quý + Hanni Coach ở `/progress`** (`components/insights/`, `lib/insights.ts`,
  2026-10-17) — `PeriodReport` chèn sau 4 ô tổng: chọn Tuần/Tháng/Quý + kỳ này/kỳ trước (1 hàng
  lọc phía trên, mọi thứ bên dưới theo cùng kỳ), 4 ô KPI có ▲/▼ so với CÙNG SỐ NGÀY đầu kỳ trước,
  biểu đồ "Phút học mỗi ngày/tuần" (`activity-bars.tsx`, làm theo skill dataviz: 1 chuỗi nên không
  chú thích màu; cột ≤24px bo 4px đầu; lưới mảnh; chỉ ghi số cột cao nhất; rê/chạm hoặc focus +
  phím ←/→ hiện chú giải; bảng số liệu trong `<details>`; màu `--chart-bar` đã chạy bộ kiểm màu —
  nền tối dùng `#ec5d50` vì `--primary` tối quá sáng, trượt dải độ sáng). Thẻ Hanni Coach: Premium
  thấy nhận xét AI (tổng quan, làm tốt, cần chú ý, kế hoạch kỳ tới; mẹo nhớ ghép vào thẻ "từ hay
  quên"), bản thường thấy mô tả + ví dụ làm mờ + nút mở Premium; "Việc nên làm ngay" (phần thi yếu
  → luyện từng dạng bài, từ đến hạn, từ khó, học tiếp) tính thẳng từ số liệu nên AI ai cũng có.
  AI viết mất ~10–15 giây (đo thật; tắt "suy nghĩ" của model thì 3 giây nhưng câu bị cụt) nên có
  trạng thái chờ; server cache theo số liệu.
- **Popup Premium = bảng "Bản thường và Premium"** (`components/premium-modal.tsx`, 2026-10-17 — user
  nhận xét "Premium không có đặc quyền gì so với thường"): chỉ ghi quyền lợi có code thật — Hanni
  Coach, quét ảnh 3 → 100/ngày, trợ lý AI và luyện nói 15/ngày → không giới hạn, xu x2, khung
  Phượng Hoàng; dòng cuối nhắc 9 cấp HSK + đề thi thử vẫn miễn phí.
- **Được công cụ tìm kiếm biết tới (2026-10-15)** — đo 9 ngày sau khi ra đề thi thử: 0 người dùng
  mới, công cụ tìm kiếm chưa thấy trang nào của site. `scripts/indexnow.mjs` báo URL qua IndexNow
  (Bing — nguồn của ChatGPT Search/DuckDuckGo —, Yandex…; khoá = `public/<KEY>.txt`) — chạy lại
  sau mỗi lần ra trang công khai mới. **Google không hỗ trợ IndexNow**: cần chủ domain xác minh
  Search Console (cách "Thẻ HTML" → đặt biến `GOOGLE_SITE_VERIFICATION` trên Vercel, `app/layout.tsx`
  tự gắn meta) rồi nộp `/sitemap.xml`.
- **Xem trước khi chia sẻ link (Open Graph)**: `app/layout.tsx` chỉ khai ảnh chung, KHÔNG khai
  `openGraph.title/description` — Next tự lấy `title`/`description` của từng trang (`inheritFromMetadata`).
  Trước 2026-10-15 layout đặt cứng nên link nào chia sẻ lên Facebook/Zalo cũng hiện "Hanni — Học tiếng
  Trung theo HSK 3.0". Trang nào tự khai `openGraph` là thay HẲN của layout → phải tự gắn lại ảnh
  (xem `tu-dien/[slug]`).
- **Lời mời cài PWA** (`components/pwa/install-prompt.tsx`): xem mục "Audit UI/UX 2026-10-17" —
  bản cũ "chỉ hiện từ lần ghé thứ hai, chỉ trong khung app" đã thay.

Đủ luồng core: auth (email + Google), dashboard, buổi ôn flashcard (lật 3D, chạm cả thẻ — mặt
sau hiện thêm badge **"Hán Việt: ..."** nếu `word.hanViet` có dữ liệu, xem `hanni-server/
CLAUDE.md` mục Âm Hán Việt cho lý do đây là điểm khác biệt cốt lõi của Hanni) + quiz,
duyệt từ vựng (có ghi chú giải thích chuẩn HSK 3.0 9 cấp khác chuẩn cũ 6 cấp, mỗi thẻ từ cũng
hiện âm Hán Việt nếu có; ô tìm kiếm cũng tìm được theo âm Hán Việt, vd gõ "học hiệu" ra 学校),
**trang chủ `/` (chưa đăng nhập)** có thêm 1 section ngay sau hero — "Bạn đã biết trước hàng
nghìn từ tiếng Trung" — 3 ví dụ (`HANVIET_EXAMPLES` trong `app/(site)/page.tsx`) + số liệu thật
qua `useWordStats()` (`GET /words/stats`, public) — mục đích THU HÚT user MỚI ngay từ trang chủ
bằng lợi thế không app quốc tế nào có, không đợi tới lúc vào app mới thấy; tự ẩn dòng số liệu
nếu `withHanViet === 0` (chưa backfill xong ở server thì không hiện số sai), tiến độ, huy
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
theo `game.supportsDuel` (hiện chỉ Dịch tốc độ có — các mode còn
lại chưa có đấu 1v1, tránh chia nhỏ hàng chờ ghép trận khi lượng người chơi còn ít; đấu đôi 2v2 đã XOÁ 2026-09-22 vì chính lý do đó).
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

**Điều hướng — bài học từ lần rút gọn hỏng (2026-09-22)**: rút `NAV_GROUPS` 16 → 12 mục đã bỏ
NHẦM `/minigame` và `/leaderboard`. Huy hiệu/Cài đặt bỏ đi thì hợp lý (vào từ `/progress`,
`/account` — cùng trả lời một câu hỏi), nhưng minigame và bảng xếp hạng là 2 thứ GIỮ CHÂN mạnh
nhất mà lại không còn lối vào nào ngoài 1 link lẻ ở `/account` — người dùng phản ánh ngay
("bị lược bỏ à?"). Giờ có nhóm riêng "CHƠI & THI ĐUA". **Quy tắc**: bỏ một mục khỏi nav chỉ được
phép khi còn MỘT LỐI VÀO KHÁC mà người dùng đoán ra được, không phải khi "vẫn còn link ở đâu đó".

**Hai nút chính trỏ cùng một chỗ = rối** (rà 2026-09-22, user phản ánh "viết tận 2 nút để xem
lại chữ"): script rà nhanh là đếm `href` trùng trong cùng 1 file page. Đã sửa 3 chỗ —
(1) `components/hanzi-writer-canvas.tsx`: nút "Chạy lại" trùng hệt nút chế độ "Xem" ngay phía
trên; giờ 3 chế độ đánh số thành 3 BƯỚC (1. Xem → 2. Tô lại → 3. Tự viết) và nút dưới khung đổi
nhãn theo bước đang đứng. (2) `/learn/[lessonId]`: nút ở tiêu đề và nút trong thẻ bên phải cùng
là "học bằng flashcard"; thẻ bên phải giờ chỉ giữ phần khác (luyện nghe/phát âm của đúng bài).
(3) `/dashboard`: nút hero và nút thẻ "Tiếp tục học" cùng dẫn vào bài đang học; hero giờ là
"Ôn N từ đến hạn" khi có từ đến hạn (đúng nhịp SRS: ôn trước, học mới sau).

**Hướng dẫn từng bước lần đầu** (`components/feature-tour.tsx`): popup giới thiệu tác dụng các
tính năng chính (icon + tiêu đề + mô tả, nút Tiếp theo/Bỏ qua + chấm tiến trình) — chỉ hiện 1
LẦN mỗi `tourKey` (đánh dấu qua `localStorage`, cùng cách `install-prompt.tsx` nhớ đã tắt). Đang
áp dụng ở 3 trang: dashboard (`tourKey="dashboard"`, 5 bước: streak, lộ trình cá nhân hoá, học
qua video, so với bạn bè, trợ lý AI), `/learn` (`tourKey="learn"`, chọn cấp/6 chặng/bài theo chủ
đề) và `/watch/[id]` (`tourKey="watch-detail"`, bản chép chạy đồng bộ/dán video mobile/bình
luận) — component viết chung, thêm trang khác chỉ cần khai mảng `TourStep[]` mới rồi render
`<FeatureTour tourKey="..." steps={...} />`.
**Mở rộng 2026-09-22** (user: "cũng k hướng dẫn tính năng để cho user hiểu"): thêm cho
`/writing`, `/exams`, `/leaderboard`, `/progress`, `/roleplay`, `/minigame`, `/messages` — mỗi
trang 2-3 bước, ưu tiên nói đúng thứ KHÔNG đoán được khi nhìn giao diện (vd `/messages`: phải
theo dõi nhau mới mở được hội thoại mới; `/leaderboard`: "từ đã thuộc" cần ~21 ngày nên tăng
chậm; `/exams`: chưa phải đề HSK đầy đủ). Kèm **`TourButton`** đặt ở tiêu đề trang để MỞ LẠI —
trước đó bấm "Đã hiểu" một lần là mất vĩnh viễn, không có đường xem lại; tín hiệu đi qua
`lib/tour.ts` (module-level store, cùng kiểu `lib/pwa/store.ts`, không dựng Context cho 1 popup).
Đặt tour ở màn TRƯỚC khi bắt đầu, đừng đặt ở màn đang làm bài (`/exams` lúc đầu gắn nhầm vào
màn đang làm bài — popup chắn ngang giữa lúc đồng hồ đang chạy).

**PWA** (`docs/pwa.md`): manifest + service worker (chỉ cache màn mất mạng), trang `/install`,
thẻ cài trong `/settings`, thanh mời cài ở đáy màn hình (`components/pwa/`, xem mục Audit 2026-10-17). Test: `npm run test:pwa`.
Lời mời cài thật chỉ chạy ở bản production/HTTPS, không đăng ký worker ở `npm run dev`.
**Icon app/favicon = cáo Hanni trên nền đỏ** (2026-10-15, user chọn): dựng từ mascot
`public/anhloading.png` bằng `python3 scripts/make-icons.py` (mặt cáo căn giữa, viền kem để cáo đỏ
không chìm vào nền đỏ; bản maskable thu nhỏ vào vùng an toàn, bản iOS để vuông). Logo chữ Hanni
(`public/brand/hanni.png`) vẫn dùng trong trang. Đổi icon thì tăng `CACHE_NAME` trong `public/sw.js`
(đang `hanni-public-v2`) + test, để máy đã cài nhận icon mới.
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
