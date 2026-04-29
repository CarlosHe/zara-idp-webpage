import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/shared/utils';

interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      {...rest}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
        {icon ?? <Package className="h-6 w-6 text-slate-400" aria-hidden />}
      </div>
      {/* WCAG: rendered as <p role="heading" aria-level="2"> so the empty
          state advertises itself as a section heading without forcing
          layouts that already use <h2> CardTitle to demote a level. */}
      <p role="heading" aria-level={2} className="text-sm font-medium text-slate-200">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
export type { EmptyStateProps };
