import { Shield, Clock } from 'lucide-react';
import { Badge } from '@/shared/components/ui';
import type { RuntimeAction } from '@/shared/types';

const ACTION_LABELS: Record<string, string> = {
  freeze: 'Freeze deployments',
  deny: 'Deny all changes',
  warn: 'Show warning',
  notify: 'Send notification',
  requireApproval: 'Require approval',
};

export interface PolicyActionDetailsProps {
  action: RuntimeAction;
}

export function PolicyActionDetails({ action }: PolicyActionDetailsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-400" />
        <span className="font-medium text-slate-200">
          {ACTION_LABELS[action.type] || action.type}
        </span>
      </div>

      {action.message && (
        <div>
          <p className="text-sm text-slate-400 mb-1">Message</p>
          <p className="text-slate-300 bg-slate-800/50 p-2 rounded">
            {action.message}
          </p>
        </div>
      )}

      {action.duration && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-400">Duration: {action.duration}</span>
        </div>
      )}

      {action.notifyChannels.length > 0 && (
        <div>
          <p className="text-sm text-slate-400 mb-1">Notify Channels</p>
          <div className="flex flex-wrap gap-2">
            {action.notifyChannels.map((channel) => (
              <Badge key={channel} variant="outline">
                {channel}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
