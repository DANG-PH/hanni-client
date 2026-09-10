import type { Metadata } from "next";
import Image from "next/image";
import { InstallCard } from "@/components/pwa/install-card";
import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cài ứng dụng Hanni — Học tiếng Trung mỗi ngày",
};

export default function InstallPage() {
  return (
    <div className="page-wrap max-w-4xl! space-y-8 py-12!">
      <section className="reveal text-center">
        <Image
          src="/icons/icon-192.png"
          alt="Logo Hanni"
          width={76}
          height={76}
          className="mx-auto rounded-3xl"
        />
        <p className="eyebrow mt-6">MỞ HANNI, BẮT ĐẦU MỘT NGÀY MỚI</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Góc học tập ngay trên màn hình chính
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
          Cài Hanni để mở nhanh như một ứng dụng trên điện thoại hoặc máy tính.
          Đăng nhập tài khoản quen thuộc và tiếp tục hành trình của bạn.
        </p>
      </section>
      <InstallCard />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: "home" as const,
            title: "Một chạm để mở",
            text: "Truy cập từ biểu tượng Hanni trên thiết bị.",
          },
          {
            icon: "route" as const,
            title: "Lối tắt học và ôn",
            text: "Mở lộ trình HSK hoặc flashcard từ menu biểu tượng nếu thiết bị hỗ trợ.",
          },
          {
            icon: "refresh" as const,
            title: "Cập nhật thuận tiện",
            text: "Nhận giao diện mới khi mở lại mà không cần tải từ cửa hàng ứng dụng.",
          },
        ].map((item) => (
          <div key={item.title} className="panel p-5">
            <Icon name={item.icon} className="text-primary" size={21} />
            <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
            <p className="mt-2 text-xs leading-6 text-muted">{item.text}</p>
          </div>
        ))}
      </section>
      <div className="text-center">
        <LinkButton href="/learn" variant="ghost">
          Tiếp tục trong trình duyệt
          <Icon name="arrow" size={16} />
        </LinkButton>
      </div>
    </div>
  );
}
