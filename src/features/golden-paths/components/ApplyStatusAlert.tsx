import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert } from '@/shared/components/ui';
import type { ApplyStatus } from '../types';

interface ApplyStatusAlertProps {
  status: ApplyStatus;
}

export function ApplyStatusAlert({ status }: ApplyStatusAlertProps) {
  if (status.type === 'idle') return null;

  const title = status.type === 'success' ? 'Successfully Applied!' : 'Error';
  return (
    <Alert type={status.type === 'success' ? 'success' : 'error'} title={title}>
      {status.message}
      {status.details && status.details.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {status.details.map((detail, index) => (
            <li key={`${detail.resource}-${index}`} className="flex items-start gap-2">
              {detail.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" aria-hidden />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" aria-hidden />
              )}
              <div className="flex-1">
                <div>{detail.resource}</div>
                {detail.message ? (
                  <div className="text-xs text-slate-400 mt-0.5">{detail.message}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}
