// Sprint 28 / L-2805 — approval SLA panel.
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { ApprovalSLADTO } from '../types/types';

interface Props {
  data?: ApprovalSLADTO;
  loading: boolean;
}

function formatMs(ms: number): string {
  if (ms < 0) return '—';
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = ms / 60_000;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

export function ApprovalSLAPanel({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Approval SLA</span>
          {data ? (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {(data.breachRate * 100).toFixed(1)}% breach
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
              <dt className="text-slate-500 dark:text-slate-400">Requested</dt>
              <dd className="font-semibold">{data?.requested ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Granted</dt>
              <dd className="font-semibold">{data?.granted ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Rejected</dt>
              <dd className="font-semibold">{data?.rejected ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Breached</dt>
              <dd className="font-semibold">{data?.breached ?? 0}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Latency p50</dt>
              <dd className="font-semibold">
                {formatMs(data?.latencyMsP50 ?? -1)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Latency p95</dt>
              <dd className="font-semibold">
                {formatMs(data?.latencyMsP95 ?? -1)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
