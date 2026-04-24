import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

const skeletonVariants = cva('animate-shimmer rounded-md bg-slate-700/40', {
  variants: {
    shape: {
      rect: 'rounded-md',
      circle: 'rounded-full',
      pill: 'rounded-full',
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
});

interface SkeletonProps
  extends ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape, className, ...rest }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={cn(skeletonVariants({ shape }), className)}
      {...rest}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

interface SkeletonTextProps extends ComponentPropsWithoutRef<'div'> {
  lines?: number;
}

const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2', className)}
      aria-busy
      aria-live="polite"
      {...rest}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  ),
);
SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText, skeletonVariants };
export type { SkeletonProps, SkeletonTextProps };
