import { CheckCircle, Clock, User, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';
import { cn, formatDateTime } from '@/shared/utils';
import type { Approval } from '@/shared/types';

interface ApprovalTimelineProps {
  approval: Approval;
}

export function ApprovalTimeline({ approval }: ApprovalTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TimelineItem
            icon={<User className="h-4 w-4" />}
            label="Requested"
            value={approval.requestedBy}
            timestamp={approval.requestedAt}
            active
          />

          {approval.approvedBy && (
            <TimelineItem
              icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
              label="Approved"
              value={approval.approvedBy}
              timestamp={approval.approvedAt!}
            />
          )}

          {approval.rejectedBy && (
            <TimelineItem
              icon={<XCircle className="h-4 w-4 text-red-400" />}
              label="Rejected"
              value={approval.rejectedBy}
              timestamp={approval.rejectedAt!}
            />
          )}

          <TimelineItem
            icon={<Clock className="h-4 w-4 text-slate-400" />}
            label="Expires"
            timestamp={approval.expiresAt}
            isLast
          />
        </div>
      </CardContent>
    </Card>
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
            active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400',
          )}
        >
          {icon}
        </div>
        {!isLast && <div className="w-px h-full bg-slate-700 mt-2" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {value && <p className="text-sm text-slate-400">{value}</p>}
        <p className="text-xs text-slate-400">{formatDateTime(timestamp)}</p>
      </div>
    </div>
  );
}
