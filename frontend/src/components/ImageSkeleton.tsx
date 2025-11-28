import { Skeleton } from '@/components/ui/skeleton';

export function ImageSkeleton() {
  return (
    <Skeleton className="aspect-square w-full rounded-lg bg-neutral-800" />
  );
}

interface ImageSkeletonGridProps {
  count?: number;
}

export function ImageSkeletonGrid({ count = 12 }: ImageSkeletonGridProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-3 [&>*]:break-inside-avoid-column">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-3">
          <ImageSkeleton />
        </div>
      ))}
    </div>
  );
}
