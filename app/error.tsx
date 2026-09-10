"use client";
import { Button, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icon";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-wrap flex min-h-[65vh] flex-col items-center justify-center text-center">
      <span className="icon-tile mb-5">
        <Icon name="refresh" />
      </span>
      <h1 className="text-2xl font-bold">Chưa mở được trang này</h1>
      <p className="mt-3 text-sm text-muted">
        Bạn có thể thử tải lại để tiếp tục học.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <LinkButton href="/" variant="secondary">
          Về trang chủ
        </LinkButton>
      </div>
    </div>
  );
}
