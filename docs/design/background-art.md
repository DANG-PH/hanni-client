# HanNi — ghép bối cảnh vào UI

Ngày 03/11/2026. Sửa phản hồi về khoảng trống, ô ảnh trắng và cảm giác ảnh được dán lên UI.

- Bỏ nền/viền của SceneArt, bỏ nhãn ví dụ trang trí dưới ảnh. Đầu trang giảm ảnh từ 238×170 xuống 136×100, không tạo hàng grid trống để ảnh span hai dòng.
- Trang Ôn tập: bỏ ảnh rời ở đầu trang. Đưa số từ đến hạn, nút ôn và bối cảnh bàn thẻ vào một banner; các số liệu vẫn lấy từ API hiện tại.
- Học tiếp: nền lộ trình tự generate phủ toàn thẻ, chữ/tiến độ/nút vẫn là DOM thật. Bỏ cột chỉ dẫn thừa trên màn siêu rộng để giữ một trọng tâm.
- Từ điển: góc đọc và tra cứu nằm trong cùng hero với tiêu đề; không còn ô sách trắng đứng riêng.
- Luyện tập: hai nền studio tự generate thống nhất chất liệu cho các ảnh công cụ. Nhóm có hai công cụ chiếm đủ chiều ngang desktop thay vì bỏ nửa hàng.
- Home giới thiệu: thẻ từ thật nằm trong góc học có bàn và cửa sổ. Premium giữ bản cũ.

Sáu background được tạo mới bằng công cụ image_gen tích hợp, dùng ảnh viết đã tạo của HanNi làm tham chiếu chất liệu. Không dùng ảnh tải từ web. PNG gốc được giữ nguyên; WebP được tối ưu trong `public/illustrations/hanni/backgrounds/`. [Manifest và prompt](background-illustration-manifest.json).

Chỉ cloud build và kiểm tra production; không bật dev server hoặc chạy build/test local. Báo cáo QA bổ sung sau phát hành.
