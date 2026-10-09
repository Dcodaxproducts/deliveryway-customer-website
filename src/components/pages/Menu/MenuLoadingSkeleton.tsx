import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export function MenuItemsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading menu"
      role="status"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          data-testid="menu-card-skeleton"
          className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[-12px_0_32px_0_rgba(26,28,28,0.06)]"
        >
          <LoadingSkeleton className="h-[210px] w-full" />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <LoadingSkeleton className="h-5 w-3/5 rounded-md" />
              <LoadingSkeleton className="h-5 w-16 rounded-md" />
            </div>
            <LoadingSkeleton className="h-4 w-full rounded-md" />
            <LoadingSkeleton className="h-4 w-4/5 rounded-md" />
            <LoadingSkeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MenuPageSkeleton() {
  return (
    <div className="min-h-screen overflow-x-hidden" aria-busy="true" role="status">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 xl:pr-5">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <LoadingSkeleton className="h-9 w-64 rounded-lg" />
              <LoadingSkeleton className="h-5 w-[min(80vw,560px)] rounded-md" />
            </div>
            <LoadingSkeleton className="h-12 w-full rounded-2xl sm:w-52" />
          </div>
          <div className="mb-7 flex gap-2.5 overflow-hidden py-2">
            {Array.from({ length: 5 }, (_, index) => (
              <LoadingSkeleton key={index} className="h-10 w-28 shrink-0 rounded-full" />
            ))}
          </div>
          <MenuItemsSkeleton />
        </section>
        <aside className="min-w-0 border-l border-gray-100 bg-white p-5">
          <LoadingSkeleton className="h-8 w-40 rounded-lg" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <LoadingSkeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <LoadingSkeleton className="mt-8 h-12 w-full rounded-full" />
        </aside>
      </div>
    </div>
  );
}
