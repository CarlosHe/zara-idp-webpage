import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';
import type { Approval } from '@/shared/types';

interface ApprovalRequestDetailsProps {
  approval: Approval;
}

export function ApprovalRequestDetails({ approval }: ApprovalRequestDetailsProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Request Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400">Resource Kind</p>
            <p className="text-slate-200">{approval.resourceKind}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Namespace</p>
            <p className="text-slate-200">{approval.resourceNamespace}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Resource Name</p>
            <p className="text-slate-200">{approval.resourceName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Operation</p>
            <p className="text-slate-200 capitalize">{approval.operation}</p>
          </div>
        </div>

        {approval.reason && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Reason</p>
            <p className="text-slate-200 bg-slate-800/50 p-3 rounded-lg">{approval.reason}</p>
          </div>
        )}

        {approval.diff && (
          <div>
            <p className="text-sm text-slate-400 mb-1">Changes</p>
            <pre className="text-sm text-slate-200 bg-slate-800/50 p-3 rounded-lg overflow-x-auto font-mono">
              {approval.diff}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
