import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils';

const alertVariants = cva('flex gap-3 rounded-lg border p-4', {
  variants: {
    type: {
      info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
      error: 'bg-red-500/10 border-red-500/30 text-red-300',
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
} as const;

interface AlertProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'>,
    VariantProps<typeof alertVariants> {
  title?: ReactNode;
  children: ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ type, title, children, className, ...rest }, ref) => {
    const Icon = alertIcons[type ?? 'info'];
    const role = type === 'error' || type === 'warning' ? 'alert' : 'status';
    return (
      <div
        ref={ref}
        role={role}
        className={cn(alertVariants({ type }), className)}
        {...rest}
      >
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          {title ? <p className="mb-1 font-medium">{title}</p> : null}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    );
  },
);
Alert.displayName = 'Alert';

export { Alert, alertVariants };
export type { AlertProps };
