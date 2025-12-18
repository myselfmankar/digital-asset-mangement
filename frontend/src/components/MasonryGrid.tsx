import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MasonryGridProps {
  children: ReactNode;
  className?: string;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
}

const gapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function MasonryGrid({
  children,
  className,
  gap = 'md',
}: MasonryGridProps) {
  return (
    <div
      className={cn(
        'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5',
        gapClasses[gap],
        '[&>*]:break-inside-avoid-column [&>*]:mb-3 sm:[&>*]:mb-3 lg:[&>*]:mb-3 xl:[&>*]:mb-3 2xl:[&>*]:mb-3',
        className
      )}
    >
      {children}
    </div>
  );
}
