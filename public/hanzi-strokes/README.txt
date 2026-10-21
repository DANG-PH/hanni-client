Dữ liệu nét chữ Hán (thứ tự nét viết) cho tính năng Luyện viết Hán tự của Hanni.

Nguồn: dự án Make Me a Hanzi (https://github.com/skishore/makemeahanzi),
qua gói hanzi-writer-data (https://github.com/chanind/hanzi-writer-data),
trích xuất từ font TrueType của Arphic Technology Co., Ltd.
Giấy phép: Arphic Public License — xem ARPHICPL.TXT trong thư mục này.

SỬA ĐỔI so với bản gốc (theo mục 2a của giấy phép): thư mục này chỉ giữ lại
3.088 ký tự thật sự xuất hiện trong bộ từ vựng HSK 3.0 của Hanni (lọc từ
bộ đầy đủ ~9.000 ký tự của hanzi-writer-data) để giảm dung lượng tải về.
Không chỉnh sửa nội dung glyph/nét của từng ký tự.

TỆP DẪN XUẤT recog.txt (thêm 2026-10-21, cho ô viết tay ở từ điển): với mỗi
ký tự trên, đường giữa từng nét ("medians") được chuẩn hoá theo khung bao và
lấy mẫu lại còn 8 điểm/nét, toạ độ làm tròn 64 mức. Dựng bằng
scripts/build-handwriting-data.mjs; các tệp <chữ>.json gốc không đổi.
