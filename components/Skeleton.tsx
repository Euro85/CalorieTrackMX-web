export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function PatientCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-4">
      <Skeleton className="w-11 h-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-24 mt-1" />
      </div>
      <Skeleton className="w-4 h-4" />
    </div>
  );
}
