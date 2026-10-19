import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — Hanni",
  description: "Điều khoản khi dùng Hanni: tài khoản, nội dung học, tính năng AI, Premium và xu, lớp học, hành vi không được phép.",
};

const ul = (items: string[]) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((t) => (
      <li key={t}>{t}</li>
    ))}
  </ul>
);

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      updated="19/10/2026"
      intro={
        <p>
          Hanni là ứng dụng học tiếng Trung cho người Việt. Khi dùng Hanni — có hay chưa có tài khoản — bạn đồng ý với các điều
          khoản dưới đây. Điều khoản viết ngắn gọn để đọc được; chỗ nào chưa rõ, bạn liên hệ qua form ở trang Hợp tác.
        </p>
      }
      sections={[
        {
          id: "dich-vu",
          title: "Dịch vụ",
          body: (
            <p>
              Hanni cung cấp lộ trình học theo đại cương HSK 3.0, từ điển, ngữ pháp, luyện nghe/nói/viết, đề thi thử, lớp học cho giáo viên
              và các tiện ích AI. Toàn bộ nội dung học hiện miễn phí. Hanni có thể thêm, đổi hoặc ngừng một tính năng; thay đổi lớn sẽ được
              báo trước trong ứng dụng.
            </p>
          ),
        },
        {
          id: "tai-khoan",
          title: "Tài khoản",
          body: ul([
            "Bạn chịu trách nhiệm giữ mật khẩu và mọi hoạt động trên tài khoản của mình.",
            "Thông tin đăng ký cần đúng sự thật; không tạo tài khoản giả mạo người khác.",
            "Bạn xoá tài khoản được bất cứ lúc nào ở trang Tài khoản; dữ liệu bị xoá vĩnh viễn.",
          ]),
        },
        {
          id: "noi-dung",
          title: "Nội dung và bản quyền",
          body: (
            <>
              <p>
                Từ vựng, âm đọc và nghĩa dựa trên dữ liệu mở (giấy phép Creative Commons BY-SA và giấy phép của Unicode), được ghi công ở
                trang{" "}
                <Link href="/nguon-du-lieu" className="text-primary hover:underline">
                  Nguồn dữ liệu
                </Link>
                . Bài giải thích ngữ pháp, câu ví dụ, đề thi thử và giao diện do Hanni soạn.
              </p>
              <p>Bạn giữ quyền với nội dung mình viết (bình luận, tin nhắn) và cho phép Hanni hiển thị nội dung đó trong ứng dụng.</p>
            </>
          ),
        },
        {
          id: "ai",
          title: "Tính năng AI",
          body: ul([
            "Câu trả lời, bài đọc, nhận xét, mẹo nhớ do AI tạo có thể sai — hãy coi là tham khảo; Hanni soát lại những phần quan trọng (vd chữ trong bài đọc phải thuộc đúng cấp) nhưng không bảo đảm tuyệt đối.",
            "Mỗi tài khoản có hạn mức lượt AI mỗi ngày; không dùng công cụ tự động để gọi tính năng AI.",
            "Không gửi cho AI thông tin nhạy cảm của bạn hay của người khác.",
          ]),
        },
        {
          id: "premium",
          title: "Premium và xu",
          body: ul([
            "Premium mua một lần cho một số tháng, không tự gia hạn; mua thêm khi còn hạn thì cộng nối tiếp. Premium chỉ mở thêm tiện ích AI, không khoá nội dung học nào. Thanh toán qua payOS đang chuẩn bị mở.",
            "Xu là điểm thưởng trong ứng dụng (kiếm khi học, chơi trò chơi, làm nhiệm vụ), chỉ dùng trong Hanni, không quy đổi ra tiền và không chuyển cho người khác.",
          ]),
        },
        {
          id: "lop-hoc",
          title: "Lớp học",
          body: ul([
            "Giáo viên chịu trách nhiệm với lớp mình tạo và dùng số liệu học của học viên chỉ để dạy học.",
            "Học viên vào lớp là đồng ý cho giáo viên lớp đó xem tiến độ học (xem Chính sách bảo mật); rời lớp là chấm dứt.",
          ]),
        },
        {
          id: "cam",
          title: "Không được phép",
          body: ul([
            "Quấy rối, xúc phạm, spam hay gửi nội dung vi phạm pháp luật qua bình luận, tin nhắn, lớp học.",
            "Gian lận bảng xếp hạng, giải đấu, phần thưởng xu (vd dùng công cụ tự động).",
            "Tìm cách truy cập trái phép, làm quá tải hay sao chép hàng loạt dữ liệu của Hanni.",
          ]),
        },
        {
          id: "trach-nhiem",
          title: "Giới hạn trách nhiệm",
          body: (
            <p>
              Hanni cố gắng giữ nội dung chính xác và dịch vụ ổn định nhưng không bảo đảm không có lỗi hay gián đoạn. Đề thi thử mô phỏng cấu
              trúc đề HSK để luyện tập, không phải đề thi chính thức và không bảo đảm kết quả thi thật.
            </p>
          ),
        },
        {
          id: "lien-he",
          title: "Thay đổi và liên hệ",
          body: (
            <p>
              Khi điều khoản đổi, ngày cập nhật ở đầu trang đổi theo. Góp ý hoặc khiếu nại: dùng form ở{" "}
              <Link href="/hop-tac#lien-he" className="text-primary hover:underline">
                trang Hợp tác
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
