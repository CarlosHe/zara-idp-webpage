import { AlertCircle, CheckSquare } from 'lucide-react';
import { PageHeader, ErrorState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { useApprovalsDashboard } from '@/features/approvals/hooks/useApprovalsDashboard';
import { ApprovalFilters } from './ApprovalFilters';
import { ApprovalListView } from './ApprovalListView';

export function ApprovalsPage() {
  const { filter, filteredItems, pendingCount, loading, error, refetch, setFilter } =
    useApprovalsDashboard();

  if (error) {
    return (
      <ErrorState message={errorMessage(error) || 'Failed to load approvals'} onRetry={refetch} />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<CheckSquare className="h-6 w-6" />}
        iconClassName="text-amber-400"
        title="Approvals"
        description="Review and manage resource change approvals"
        onRefresh={refetch}
        actions={
          pendingCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{pendingCount} pending</span>
            </div>
          ) : undefined
        }
      />

      <ApprovalFilters filter={filter} onChange={setFilter} />

      <ApprovalListView items={filteredItems} filter={filter} loading={loading} />
    </div>
  );
}
