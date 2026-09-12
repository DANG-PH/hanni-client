# Giao diện thư viện học tập Hanni

Áp dụng cho `/vocabulary`, `/grammar` và `/exams`.

## Nguồn tham khảo

- [Duolingo — Reshaping Duo](https://blog.duolingo.com/reshaping-duo/): giữ nhận diện thương hiệu nhất quán khi làm mới giao diện trên nhiều nền tảng.
- [Hacking Chinese — giới thiệu Hack Chinese](https://challenges.hackingchinese.com/resources/stories/478-hack-chinese-srs-platform-for-learning-chinese-vocabulary-online): tổ chức từ vựng theo danh sách, kết hợp phát âm và ôn tập.

Thiết kế và mã giao diện được viết riêng cho Hanni. Minh họa thẻ giấy và con dấu Hán tự dùng CSS và văn bản, không cần ảnh tải từ bên ngoài.

## Quy tắc đồng bộ

- Dùng `--primary` hiện có của ứng dụng: đỏ son `#dc3526` ở chế độ sáng, đỏ san hô `#ff796b` ở chế độ tối.
- Nền, chữ và đường viền lấy từ `--surface`, `--background`, `--foreground`, `--muted`, `--border`; các sắc đỏ nhạt được pha từ cùng màu chính bằng `color-mix`.
- Dùng chung `LearningHeader`, `LevelFilter`, `LearningTip` và CSS Module `learning-library.module.css`.
- Màu được chọn đi kèm `aria-pressed` / `aria-current`; ngữ pháp có `aria-expanded`, vùng chi tiết và trạng thái rỗng, lỗi, thử lại.
- Từ vựng giữ tìm kiếm qua API và phân trang. Ngữ pháp tìm trong cấp đang chọn, hỗ trợ tiếng Việt không dấu. Thiết lập kiểm tra giữ luồng tạo bài, làm bài và lưu kết quả hiện có.
- Minh họa được ẩn trên điện thoại để ưu tiên nội dung học. Các cột phụ chuyển xuống dưới nội dung ở màn hình nhỏ; tôn trọng tùy chọn giảm chuyển động.

## Kiểm tra

- `npm run build`: thành công, bao gồm kiểm tra TypeScript.
- `npm run lint`: không có lỗi; 5 cảnh báo đã có ở các tệp ngoài phạm vi sửa.
- Kiểm tra Chromium với API giả lập: tìm kiếm, lọc, phân trang, trạng thái rỗng/lỗi/thử lại của từ vựng; tìm ngữ pháp không dấu, mở chi tiết, ẩn pinyin; chọn cấp/số câu và tạo bài kiểm tra.
- Kiểm tra bố cục ở 320, 390, 768, 1440 px và ảnh giao diện tối. Không thay thế kiểm tra tích hợp với backend và bản thu âm thật.
