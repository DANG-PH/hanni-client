export function PageSkeleton() {
  return (
    <div
      className="page-wrap space-y-7"
      role="status"
      aria-label="Đang tải trang"
    >
      <span className="sr-only">Đang mở góc học tập…</span>
      <div className="space-y-3" aria-hidden="true">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-2/3 max-w-sm" />
        <div className="skeleton h-4 w-4/5 max-w-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="panel space-y-5 p-5">
            <div className="skeleton h-9 w-9" />
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3 w-4/5" />
          </div>
        ))}
      </div>
      <div className="panel space-y-5 p-6" aria-hidden="true">
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-44 w-full" />
      </div>
    </div>
  );
}
