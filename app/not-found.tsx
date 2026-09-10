import { Icon } from "@/components/icon";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="page-wrap flex min-h-[75vh] flex-col items-center justify-center text-center">
      <span className="hanzi text-8xl text-primary/20" aria-hidden="true">
        迷
      </span>
      <p className="eyebrow mt-6">404 · MỘT CHÚT LẠC ĐƯỜNG</p>
      <h1 className="mt-3 text-3xl font-bold">Trang này chưa có ở Hanni</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-muted">
        Có thể đường dẫn đã thay đổi. Về trang chủ hoặc mở lộ trình để tiếp tục
        học nhé.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <LinkButton href="/">Về trang chủ</LinkButton>
        <LinkButton href="/learn" variant="secondary">
          Mở lộ trình
          <Icon name="arrow" size={16} />
        </LinkButton>
      </div>
    </main>
  );
}
