"use client";

/**
 * BẢN ĐỒ TRANG — HỌC LIỆU (/hoc-lieu) — video, bài nghe, tài liệu tải về
 * Trang này gọi API nào (← file client gọi) và code server ở đâu (→ đường dẫn trong hanni-server/src/). Sửa luồng gọi
 * API thì sửa khối này cho khớp.
 *
 *   GET /resources            ← useResources() ở lib/resources.ts
 *                               → server: modules/resources/resources.controller.ts → ResourcesService.list()
 *   POST /resources/:id/link  ← createResourceLink() ở lib/resources.ts (← components/resources/resource-card.tsx)
 *                               → server: modules/resources/resources.controller.ts → ResourcesService.link()
 *
 * Khung quanh trang (menu, thanh trên, chuông, trợ lý AI) gọi API riêng — xem khối BẢN ĐỒ ở app/(site)/layout.tsx.
 */

import { ResourceCard } from "@/components/resources/resource-card";
import { Button, Card, EmptyState, ErrorNote, PageHeading } from "@/components/ui";
import { useResources } from "@/lib/resources";

export default function ResourcesPage() {
  const { data, error, isLoading, mutate } = useResources();

  return (
    <div className="page-wrap space-y-5">
      <PageHeading icon="book" title="Học liệu" description="Video, bài nghe và tài liệu để xem hoặc tải về học." />
      {/* Giữ sẵn chỗ bằng 3 thẻ khung cùng cỡ thẻ thật: spinner nhỏ hơn danh sách nên lúc dữ liệu về chân trang
          bị đẩy xuống, Lighthouse đo CLS 0,225. */}
      {isLoading && (
        <div role="status" aria-label="Đang tải học liệu" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-44 animate-pulse">
              <span className="sr-only">Đang tải</span>
            </Card>
          ))}
        </div>
      )}
      {error && !data && (
        <div className="space-y-3">
          <ErrorNote>Chưa tải được danh sách học liệu.</ErrorNote>
          <Button variant="secondary" onClick={() => void mutate()}>
            Thử lại
          </Button>
        </div>
      )}
      {data?.length === 0 && <EmptyState title="Chưa có học liệu" description="Khi có học liệu mới, bạn sẽ thấy ở đây." />}
      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}
