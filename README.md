# Hanni client

Giao diện học tiếng Trung theo HSK 3.0, dùng Next.js 16, React 19, Tailwind CSS v4 và SWR. Bố cục tham khảo Hanbeego, điều chỉnh cho thương hiệu và API Hanni.

## Chạy local

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Đặt `NEXT_PUBLIC_API_URL` trong `.env.local` theo backend Hanni đang chạy (mặc định `http://localhost:8000/api`). Client và server nên cùng hostname trong môi trường dev để cookie phiên được gửi đúng. Google sign-in chỉ hiển thị khi có client ID được cấu hình.

## Màn hình

- Trang chủ, đăng nhập, đăng ký, quên/đặt lại mật khẩu và xác minh email.
- Tổng quan; lộ trình HSK; chi tiết bài học; flashcard; thư viện từ vựng.
- Luyện nghe; ghi âm luyện phát âm; mẫu câu/ngữ pháp từ ví dụ trong thư viện.
- Kiểm tra từ vựng HSK và xem kết quả đã nộp trong tab hiện tại.
- Tiến độ, huy hiệu, tài khoản, cài đặt và nguồn học liệu.

Không dùng mock data. Các màn riêng tư cần backend và tài khoản hợp lệ. Chưa có API cho bài giảng ngữ pháp riêng, đề HSK đầy đủ, chấm điểm phát âm, lịch sử thi hoặc gói trả phí; giao diện thể hiện đúng phạm vi hiện có.

```bash
npm run lint
npm run build
npm start
```

Xem [tài liệu giao diện, phạm vi API, favicon và ảnh xem trước](docs/giao-dien.md).
