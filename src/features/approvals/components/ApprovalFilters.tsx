import { cn } from '@/shared/utils';
import type { ApprovalStatus } from '@/shared/types';
import type { ApprovalFilter } from '@/features/approvals/hooks/useApprovalsDashboard';

const STATUS_FILTERS: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

interface ApprovalFiltersProps {
  filter: ApprovalFilter;
  onChange: (filter: ApprovalFilter) => void;
}

export function ApprovalFilters({ filter, onChange }: ApprovalFiltersProps) {
  return (
    <div className="flex gap-2 border-b border-slate-700/50 pb-2">
      {STATUS_FILTERS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            filter === value
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
