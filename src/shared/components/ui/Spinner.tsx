import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
    tone: {
      primary: 'text-blue-500',
      muted: 'text-slate-400',
      current: 'text-current',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'primary',
  },
});

interface SpinnerProps
  extends Omit<ComponentPropsWithoutRef<'svg'>, 'size'>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size, tone, className, label = 'Loading', ...rest }, ref) => (
    <Loader2
      ref={ref}
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, tone }), className)}
      {...rest}
    />
  ),
);
Spinner.displayName = 'Spinner';

interface LoadingStateProps extends ComponentPropsWithoutRef<'div'> {
  message?: string;
}

const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ message = 'Loading...', className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center py-12', className)}
      role="status"
      aria-live="polite"
      {...rest}
    >
      <Spinner size="lg" label={message} />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  ),
);
LoadingState.displayName = 'LoadingState';

export { Spinner, LoadingState, spinnerVariants };
export type { SpinnerProps, LoadingStateProps };
