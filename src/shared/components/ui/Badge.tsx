import { cn } from '@/shared/utils';
import type { HealthStatus, SyncStatus, ApprovalStatus, RiskLevel } from '@/shared/types';
import { healthStatusConfig, syncStatusConfig, approvalStatusConfig, riskLevelConfig } from '@/shared/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
        variant === 'default' && 'bg-slate-700 text-slate-200',
        variant === 'outline' && 'border border-slate-600 text-slate-300',
        className
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: HealthStatus | SyncStatus | ApprovalStatus | RiskLevel;
  type: 'health' | 'sync' | 'approval' | 'risk';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const configs: Record<string, Record<string, { color: string; bgColor: string; label: string }>> = {
    health: healthStatusConfig,
    sync: syncStatusConfig,
    approval: approvalStatusConfig,
    risk: riskLevelConfig,
  };

  const typeConfig = configs[type];
  const config = typeConfig?.[status as string];

  if (!config) {
    return <Badge>{status}</Badge>;
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full', config.bgColor, config.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.color.replace('text-', 'bg-'))} />
      {config.label}
    </span>
  );
}
