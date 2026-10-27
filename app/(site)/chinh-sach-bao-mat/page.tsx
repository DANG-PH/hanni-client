/**
 * BẢN ĐỒ TRANG — CHÍNH SÁCH BẢO MẬT (/chinh-sach-bao-mat) — trang tĩnh
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sinh từ mã
 * nguồn ngày 27/10/2026; sửa luồng gọi API thì sửa khối này cho khớp. Bảng đủ: tài liệu tra cứu kỹ thuật (tab Tra cứu).
 *
 *   (Trang tĩnh — không gọi API nào.)
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — Hanni",
  description: "Hanni thu thập những dữ liệu nào, dùng để làm gì, chia sẻ với dịch vụ nào và bạn xoá dữ liệu của mình thế nào.",
};

const ul = (items: string[]) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      updated="21/10/2026"
      intro={
        <p>
          Trang này nói rõ Hanni lưu những gì về bạn, vì sao, và bạn kiểm soát dữ liệu đó thế nào. Bạn dùng được phần lớn Hanni (bài
          học, từ điển, đề thi thử…) khi chưa có tài khoản — lúc đó tiến độ chỉ nằm tạm trên trình duyệt của bạn.
        </p>
      }
      sections={[
        {
          id: "thu-thap",
          title: "Dữ liệu Hanni lưu khi bạn có tài khoản",
          body: ul([
            "Email, tên hiển thị, ảnh đại diện (nếu bạn tải lên), múi giờ; mật khẩu chỉ lưu dạng băm, không ai đọc được. Đăng nhập bằng Google thì Hanni nhận email, tên và ảnh từ Google.",
            "Tiến độ học: từ đã học và lịch ôn, bài đã xong, chuỗi ngày, phút học mỗi ngày, kết quả luyện nghe/phát âm, điểm và bài làm đề thi thử, huy hiệu.",
            "Nội dung bạn tạo: hội thoại với trợ lý AI và luyện nói, câu bạn tự đặt để AI chấm, lớp học bạn tạo hoặc tham gia. Bình luận video và tin nhắn viết trước khi Hanni gỡ hai tính năng này (20/10/2026) vẫn được lưu tới khi bạn xoá tài khoản.",
            "Cài đặt: mục tiêu ngày, giờ nhắc học, đăng ký nhận thông báo đẩy của trình duyệt.",
          ]),
        },
        {
          id: "khong-luu",
          title: "Những thứ Hanni không lưu",
          body: ul([
            "Chấm thanh điệu: giọng bạn được phân tích ngay trên máy, không gửi lên máy chủ.",
            "Quét ảnh học từ: ảnh chỉ nằm trong bộ nhớ lúc gửi cho AI đọc chữ rồi bị bỏ, không lưu ở đâu.",
            "Hanni không bán dữ liệu, không hiện quảng cáo, không chia sẻ tiến độ của bạn cho bên thứ ba vì mục đích quảng cáo.",
          ]),
        },
        {
          id: "dich-vu",
          title: "Dịch vụ bên thứ ba Hanni dùng",
          body: (
            <>
              {ul([
                "Google Gemini API — xử lý nội dung bạn gửi cho tính năng AI (trợ lý, luyện nói, chấm câu, phân tích câu, mẹo nhớ, bài đọc, quét ảnh, nhận xét học tập). Chỉ phần nội dung cần cho lượt đó được gửi đi, kèm số liệu học tập liên quan nếu tính năng cần.",
                "Nhận dạng giọng nói của trình duyệt — khi bạn bấm micro (tra từ, luyện phát âm, nói với AI), trình duyệt Chrome/Edge gửi âm thanh tới máy chủ của Google/Microsoft để chuyển thành chữ; Hanni chỉ nhận lại phần chữ.",
                "Đăng nhập bằng Google; YouTube (video nhúng trong mục Học qua video); Wikimedia Commons/Wikipedia (ảnh minh hoạ từ vựng).",
                "Dịch máy (Google Translate, MyMemory) cho phụ đề video — chỉ gửi lời thoại của video, không gửi dữ liệu của bạn.",
                "Vercel (phục vụ giao diện web) và máy chủ riêng (VPS) của Hanni — nơi lưu tài khoản và tiến độ học.",
                "payOS — chỉ khi bạn thanh toán Premium (đang chuẩn bị mở bán); Hanni không lưu số thẻ hay tài khoản ngân hàng.",
              ])}
            </>
          ),
        },
        {
          id: "lop-hoc",
          title: "Lớp học và người khác thấy gì",
          body: ul([
            "Trong lớp bạn tham gia, giáo viên thấy: chuỗi ngày học, phút học 7 ngày, lần học cuối, số bài đã xong, số từ đang học, điểm thi thử cao nhất và bài giao nào bạn đã làm. Giáo viên không thấy email. Bạn rời lớp bất cứ lúc nào — giáo viên không xem được nữa.",
            "Bạn cùng lớp thấy tên, ảnh, phút học tuần này và chuỗi ngày của nhau.",
            "Hồ sơ công khai và bảng xếp hạng hiện tên, ảnh, chuỗi ngày, số bài/từ, huy hiệu — không hiện email.",
          ]),
        },
        {
          id: "cookie",
          title: "Cookie và lưu trữ trên trình duyệt",
          body: (
            <p>
              Hanni dùng cookie để giữ phiên đăng nhập, và bộ nhớ trình duyệt để nhớ tuỳ chọn (giao diện sáng/tối, lịch sử tra từ, bài làm
              dở, tiến độ khi chưa có tài khoản). Không dùng cookie quảng cáo hay theo dõi của bên thứ ba.
            </p>
          ),
        },
        {
          id: "quyen",
          title: "Quyền của bạn",
          body: ul([
            "Sửa tên, ảnh, múi giờ, mục tiêu ở Tài khoản và Cài đặt; tắt email tổng kết tuần và thông báo đẩy bất cứ lúc nào.",
            "Xoá tài khoản ở Tài khoản → Vùng nguy hiểm: toàn bộ tiến độ, nội dung bạn tạo và dữ liệu cá nhân bị xoá vĩnh viễn ngay lập tức.",
            "Muốn hỏi thêm về dữ liệu của mình: liên hệ qua form Liên hệ (cuối trang Dành cho giáo viên).",
          ]),
        },
        {
          id: "thay-doi",
          title: "Thay đổi chính sách",
          body: (
            <p>
              Khi chính sách đổi, ngày cập nhật ở đầu trang đổi theo; thay đổi quan trọng sẽ được báo trong ứng dụng. Xem thêm{" "}
              <Link href="/dieu-khoan" className="text-primary hover:underline">
                Điều khoản sử dụng
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
