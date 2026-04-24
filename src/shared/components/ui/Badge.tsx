import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';
import type { HealthStatus, SyncStatus, ApprovalStatus, RiskLevel } from '@/shared/types';
import {
  healthStatusConfig,
  syncStatusConfig,
  approvalStatusConfig,
  riskLevelConfig,
} from '@/shared/constants';

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-200',
        outline: 'border border-slate-600 text-slate-300',
        success: 'bg-emerald-500/15 text-emerald-300',
        warning: 'bg-yellow-500/15 text-yellow-300',
        danger: 'bg-red-500/15 text-red-300',
        info: 'bg-blue-500/15 text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...rest }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...rest}
    />
  ),
);
Badge.displayName = 'Badge';

type StatusType = 'health' | 'sync' | 'approval' | 'risk';
type StatusValue = HealthStatus | SyncStatus | ApprovalStatus | RiskLevel;

interface StatusBadgeProps {
  status: StatusValue;
  type: StatusType;
  className?: string;
}

const configs: Record<
  StatusType,
  Record<string, { color: string; bgColor: string; label: string }>
> = {
  health: healthStatusConfig,
  sync: syncStatusConfig,
  approval: approvalStatusConfig,
  risk: riskLevelConfig,
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, type, className }, ref) => {
    const typeConfig = configs[type];
    const config = typeConfig?.[status as string];

    if (!config) {
      return (
        <Badge ref={ref} className={className}>
          {status}
        </Badge>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
          config.bgColor,
          config.color,
          className,
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            config.color.replace('text-', 'bg-'),
          )}
          aria-hidden
        />
        {config.label}
      </span>
    );
  },
);
StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge, badgeVariants };
export type { BadgeProps };
