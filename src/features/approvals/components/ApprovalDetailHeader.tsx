import { CheckCircle, XCircle } from 'lucide-react';
import { Button, StatusBadge } from '@/shared/components/ui';
import type { Approval } from '@/shared/types';

interface ApprovalDetailHeaderProps {
  approval: Approval;
  submitting: boolean;
  onApprove: () => void;
  onRequestReject: () => void;
}

export function ApprovalDetailHeader({
  approval,
  submitting,
  onApprove,
  onRequestReject,
}: ApprovalDetailHeaderProps) {
  const isPending = approval.status === 'pending';

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <StatusBadge status={approval.status} type="approval" />
          <h1 className="text-2xl font-bold text-white">
            {approval.resourceKind}/{approval.resourceName}
          </h1>
        </div>
        <p className="text-slate-400 mt-1">
          {approval.operation.toUpperCase()} request in {approval.resourceNamespace}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={onRequestReject} disabled={submitting}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="primary" onClick={onApprove} loading={submitting}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}
