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
    <div
      role="tablist"
      aria-label="Filter approvals by status"
      className="flex gap-2 border-b border-slate-700/50 pb-2"
    >
      {STATUS_FILTERS.map(({ value, label }) => {
        const selected = filter === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="approvals-list"
            onClick={() => onChange(value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected
                ? 'bg-blue-600/20 text-blue-300'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
