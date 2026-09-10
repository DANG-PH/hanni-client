# hanni-client

Giao diện web của **Hanni** — học tiếng Trung theo chuẩn **HSK 3.0**.

Next.js 16 · React 19 · Tailwind v4 · SWR.

## Chạy local

```bash
cp .env.example .env.local          # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev                         # http://localhost:3000  (cần hanni-server chạy)
```

## Màn hình

| Route | Nội dung |
|---|---|
| `/` | Landing (tự chuyển `/dashboard` nếu đã đăng nhập) |
| `/login`, `/register` | Email + mật khẩu, hoặc nút Google |
| `/auth/callback` | Nhận redirect sau Google OAuth2 |
| `/dashboard` | Streak, mục tiêu ngày, số thẻ đến hạn, tiến độ từng cấp HSK |
| `/study` | Buổi ôn flashcard (đánh giá 4 mức) → quiz chấm điểm ghi nhớ |
| `/vocabulary` | Duyệt / tìm từ theo cấp HSK 1–9 |
| `/progress` | Đã thuộc / đang học / đến hạn / sắp quên theo cấp |
| `/achievements` | Huy hiệu theo mốc |
| `/settings` | Mục tiêu ngày, từ mới/ngày, thuật toán SRS (SM-2 / FSRS), múi giờ |
| `/nguon-du-lieu` | Ghi công nguồn dữ liệu (bắt buộc theo giấy phép CC BY-SA) |

## Ghi chú

- Auth dùng **cookie HttpOnly** do server đặt; client không đọc token, chỉ gọi
  `/users/me` để biết trạng thái. `lib/api.ts` tự gọi `/auth/refresh` một lần khi gặp 401.
- Client và server phải cùng host (`localhost`) ở dev để cookie `Domain=localhost` được gửi kèm.
