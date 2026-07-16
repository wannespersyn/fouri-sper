export function PageSkeleton({ rows = 4 }: Readonly<{ rows?: number }>) {
  return (
    <div className="flex flex-col gap-3.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-[22px] border border-card-border bg-card"
        />
      ))}
    </div>
  );
}
