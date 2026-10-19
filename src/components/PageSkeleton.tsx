export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-8 sm:px-6" aria-busy="true" aria-label="Memuat data">
      <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-3 h-4 w-[28rem] max-w-full animate-pulse rounded bg-surface-2" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
      <div className="mt-12 h-[420px] animate-pulse rounded-2xl border border-line bg-surface" />
    </div>
  );
}
