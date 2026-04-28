// Sprint 28 / L-2805 — remediation effectiveness panel.
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { RemediationEffectivenessDTO } from '../types/types';

interface Props {
  data?: RemediationEffectivenessDTO;
  loading: boolean;
}

function formatHours(ms: number): string {
  if (ms <= 0) return '0 h';
  return `${(ms / 1000 / 60 / 60).toFixed(1)} h`;
}

export function RemediationPanel({ data, loading }: Props) {
  const accept = Math.round((data?.acceptanceRate ?? 0) * 100);
  const regress = Math.round((data?.regressionRate ?? 0) * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Remediation effectiveness</span>
          {data ? (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {accept}% accepted
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Proposed</dt>
              <dd className="font-semibold">{data?.proposed ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Accepted</dt>
              <dd className="font-semibold">{data?.accepted ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Rejected</dt>
              <dd className="font-semibold">{data?.rejected ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Reverted</dt>
              <dd className="font-semibold">{data?.reverted ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">
                Regression rate
              </dt>
              <dd className="font-semibold">{regress}%</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">
                Time saved
              </dt>
              <dd className="font-semibold">
                {formatHours(data?.timeSavedMs ?? 0)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
