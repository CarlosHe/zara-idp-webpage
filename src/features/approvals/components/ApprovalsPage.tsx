import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/shared/hooks/redux';
import { ROUTES } from '@/shared/config';
import {
  fetchApprovals,
  fetchApproval,
  approveRequest,
  rejectRequest,
  setFilter,
  clearSelectedApproval,
  clearError,
} from '@/features/approvals/store/approvalsSlice';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Textarea,
  Alert,
} from '@/shared/components/ui';
import { PageHeader, DataEmptyState, LoadingState, ErrorState } from '@/shared/components/feedback';
import { cn, formatDateTime, formatRelativeTime } from '@/shared/utils';
import type { Approval, ApprovalStatus } from '@/shared/types';

const statusFilters: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export function ApprovalsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, filter } = useAppSelector((state) => state.approvals);

  useEffect(() => {
    dispatch(fetchApprovals(filter));
  }, [dispatch, filter]);

  const handleFilterChange = (newFilter: ApprovalStatus | 'all') => {
    dispatch(setFilter(newFilter));
  };

  // Filter items client-side if needed
  const safeItems = items || [];
  const filteredItems = filter === 'all' ? safeItems : safeItems.filter((a) => a.status === filter);
  const pendingCount = safeItems.filter((a) => a.status === 'pending').length;

  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchApprovals(filter))} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        icon={<CheckSquare className="h-6 w-6" />}
        iconClassName="text-amber-400"
        title="Approvals"
        description="Review and manage resource change approvals"
        onRefresh={() => dispatch(fetchApprovals(filter))}
        actions={
          pendingCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{pendingCount} pending</span>
            </div>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-2">
        {statusFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              filter === value
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <Card padding="none">
        <CardContent>
          {loading ? (
            <LoadingState message="Loading approvals..." />
          ) : filteredItems.length === 0 ? (
            <DataEmptyState
              icon={<CheckSquare className="h-6 w-6 text-slate-500" />}
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
                {filteredItems.map((approval) => (
                  <ApprovalRow key={approval.id} approval={approval} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ApprovalRowProps {
  approval: Approval;
}

function ApprovalRow({ approval }: ApprovalRowProps) {
  const operationColors: Record<string, string> = {
    create: 'text-emerald-400 bg-emerald-500/20',
    update: 'text-blue-400 bg-blue-500/20',
    delete: 'text-red-400 bg-red-500/20',
  };

  return (
    <TableRow>
      <TableCell>
        <Link
          to={ROUTES.APPROVALS.DETAIL(approval.id)}
          className="hover:text-blue-400 transition-colors"
        >
          <span className="font-medium">{approval.resourceName}</span>
          <span className="text-slate-500 ml-2">
            {approval.resourceKind}/{approval.resourceNamespace}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            operationColors[approval.operation]
          )}
        >
          {approval.operation.toUpperCase()}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-slate-400">{approval.requestedBy}</span>
      </TableCell>
      <TableCell>
        <StatusBadge status={approval.status} type="approval" />
      </TableCell>
      <TableCell>
        <span className="text-slate-500">{formatRelativeTime(approval.requestedAt)}</span>
      </TableCell>
      <TableCell>
        <span className="text-slate-500">{formatRelativeTime(approval.expiresAt)}</span>
      </TableCell>
      <TableCell>
        <Link to={ROUTES.APPROVALS.DETAIL(approval.id)}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

// Approval Detail Page
export function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedApproval, loading, submitting, error } = useAppSelector((state) => state.approvals);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchApproval(id));
    }
    return () => {
      dispatch(clearSelectedApproval());
      dispatch(clearError());
    };
  }, [dispatch, id]);

  const handleApprove = async () => {
    if (id) {
      await dispatch(approveRequest({ id }));
    }
  };

  const handleReject = async () => {
    if (id && rejectReason.trim()) {
      await dispatch(rejectRequest({ id, reason: rejectReason }));
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  if (loading && !selectedApproval) {
    return <LoadingState message="Loading approval..." />;
  }

  if (!selectedApproval) {
    return (
      <DataEmptyState
        icon={<CheckSquare className="h-6 w-6 text-slate-500" />}
        title="Approval not found"
        description="The requested approval could not be found."
      />
    );
  }

  const isPending = selectedApproval.status === 'pending';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to={ROUTES.APPROVALS.LIST} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" />
        Back to approvals
      </Link>

      {/* Error Alert */}
      {error && (
        <Alert type="error" title="Action failed">
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status={selectedApproval.status} type="approval" />
            <h1 className="text-2xl font-bold text-white">
              {selectedApproval.resourceKind}/{selectedApproval.resourceName}
            </h1>
          </div>
          <p className="text-slate-400 mt-1">
            {selectedApproval.operation.toUpperCase()} request in {selectedApproval.resourceNamespace}
          </p>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={submitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Resource Kind</p>
                <p className="text-slate-200">{selectedApproval.resourceKind}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Namespace</p>
                <p className="text-slate-200">{selectedApproval.resourceNamespace}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Resource Name</p>
                <p className="text-slate-200">{selectedApproval.resourceName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Operation</p>
                <p className="text-slate-200 capitalize">{selectedApproval.operation}</p>
              </div>
            </div>

            {selectedApproval.reason && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Reason</p>
                <p className="text-slate-200 bg-slate-800/50 p-3 rounded-lg">
                  {selectedApproval.reason}
                </p>
              </div>
            )}

            {selectedApproval.diff && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Changes</p>
                <pre className="text-sm text-slate-200 bg-slate-800/50 p-3 rounded-lg overflow-x-auto font-mono">
                  {selectedApproval.diff}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TimelineItem
                icon={<User className="h-4 w-4" />}
                label="Requested"
                value={selectedApproval.requestedBy}
                timestamp={selectedApproval.requestedAt}
                active
              />
              
              {selectedApproval.approvedBy && (
                <TimelineItem
                  icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
                  label="Approved"
                  value={selectedApproval.approvedBy}
                  timestamp={selectedApproval.approvedAt!}
                />
              )}
              
              {selectedApproval.rejectedBy && (
                <TimelineItem
                  icon={<XCircle className="h-4 w-4 text-red-400" />}
                  label="Rejected"
                  value={selectedApproval.rejectedBy}
                  timestamp={selectedApproval.rejectedAt!}
                />
              )}
              
              <TimelineItem
                icon={<Clock className="h-4 w-4 text-slate-400" />}
                label="Expires"
                timestamp={selectedApproval.expiresAt}
                isLast
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reject Modal/Form */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reject Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Reason for rejection"
                placeholder="Please provide a reason for rejecting this request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowRejectForm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  loading={submitting}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  timestamp: string;
  active?: boolean;
  isLast?: boolean;
}

function TimelineItem({ icon, label, value, timestamp, active, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
          )}
        >
          {icon}
        </div>
        {!isLast && <div className="w-px h-full bg-slate-700 mt-2" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {value && <p className="text-sm text-slate-400">{value}</p>}
        <p className="text-xs text-slate-500">{formatDateTime(timestamp)}</p>
      </div>
    </div>
  );
}
