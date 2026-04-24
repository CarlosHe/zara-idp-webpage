import { CheckSquare } from 'lucide-react';
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { ApprovalRow } from './ApprovalRow';
import type { ApprovalFilter } from '@/features/approvals/hooks/useApprovalsDashboard';
import type { Approval } from '@/shared/types';

interface ApprovalListViewProps {
  items: Approval[];
  filter: ApprovalFilter;
  loading: boolean;
}

export function ApprovalListView({ items, filter, loading }: ApprovalListViewProps) {
  return (
    <Card padding="none">
      <CardContent>
        {loading ? (
          <LoadingState message="Loading approvals..." />
        ) : items.length === 0 ? (
          <DataEmptyState
            icon={<CheckSquare className="h-6 w-6 text-slate-400" />}
            title="No approvals found"
            description={
              filter === 'pending'
                ? 'No pending approvals at this time.'
                : 'No approvals match the selected filter.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((approval) => (
                <ApprovalRow key={approval.id} approval={approval} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
