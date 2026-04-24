import { cn } from '@/shared/utils';
import {
  getQuotaBarColor,
  getQuotaPercentage,
  getQuotaTextColor,
} from './namespaceStyles';

interface NamespaceQuotaBarProps {
  label: string;
  used: number | undefined;
  quota: number;
}

export function NamespaceQuotaBar({ label, used, quota }: NamespaceQuotaBarProps) {
  const percentage = getQuotaPercentage(used, quota);
  const clampedPercentage = Math.min(percentage, 100);

  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={cn('text-sm font-medium', getQuotaTextColor(percentage))}>
        {used ?? 0} / {quota}
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-1 mt-1">
        <div
          className={cn('h-1 rounded-full', getQuotaBarColor(percentage))}
          // eslint-disable-next-line no-restricted-syntax -- dynamic quota bar width
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
