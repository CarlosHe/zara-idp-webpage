import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { Alert } from '@/shared/components/ui';
import { DataEmptyState, LoadingState } from '@/shared/components/feedback';
import { errorMessage } from '@/shared/lib/api';
import { ROUTES } from '@/shared/config';
import { useApprovalDetail } from '@/features/approvals/hooks/useApprovalDetail';
import { ApprovalDetailHeader } from './ApprovalDetailHeader';
import { ApprovalRequestDetails } from './ApprovalRequestDetails';
import { ApprovalTimeline } from './ApprovalTimeline';
import { ApprovalActionsDialog } from './ApprovalActionsDialog';

export function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    approval,
    loading,
    loadError,
    approveError,
    rejectError,
    submitting,
    showRejectForm,
    rejectReason,
    setShowRejectForm,
    setRejectReason,
    approve,
    reject,
  } = useApprovalDetail(id);

  if (loading && !approval) {
    return <LoadingState message="Loading approval..." />;
  }

  if (!approval) {
    return (
      <DataEmptyState
        icon={<CheckSquare className="h-6 w-6 text-slate-500" />}
        title="Approval not found"
        description="The requested approval could not be found."
      />
    );
  }

  const alertMessage =
    errorMessage(loadError) || errorMessage(approveError) || errorMessage(rejectError);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to={ROUTES.APPROVALS.LIST}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to approvals
      </Link>

      {alertMessage && (
        <Alert type="error" title="Action failed">
          {alertMessage}
        </Alert>
      )}

      <ApprovalDetailHeader
        approval={approval}
        submitting={submitting}
        onApprove={approve}
        onRequestReject={() => setShowRejectForm(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ApprovalRequestDetails approval={approval} />
        <ApprovalTimeline approval={approval} />
      </div>

      <ApprovalActionsDialog
        open={showRejectForm}
        reason={rejectReason}
        submitting={submitting}
        onReasonChange={setRejectReason}
        onCancel={() => setShowRejectForm(false)}
        onConfirm={reject}
      />
    </div>
  );
}
