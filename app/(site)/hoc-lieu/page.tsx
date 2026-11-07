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
import { Button, EmptyState, ErrorNote, PageHeading, Spinner } from "@/components/ui";
import { useResources } from "@/lib/resources";

export default function ResourcesPage() {
  const { data, error, isLoading, mutate } = useResources();

  return (
    <div className="page-wrap space-y-5">
      <PageHeading icon="book" title="Học liệu" description="Video, bài nghe và tài liệu để xem hoặc tải về học." />
      {isLoading && <Spinner />}
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
