// Sprint 28 / L-2805 — DORA panel.
//
// Renders the four classic DORA signals (lead time, deploy frequency,
// MTTR, change-failure rate). The panel hides each metric when the
// backend returns the sentinel `-1` ("no samples").
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { DORAMetricsDTO } from '../types/types';

interface Props {
  data?: DORAMetricsDTO;
  loading: boolean;
}

function formatMs(ms: number): string {
  if (ms < 0) return '—';
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(1)} h`;
}

function formatRate(rate: number): string {
  if (rate < 0) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

function formatFreq(freq: number): string {
  if (freq <= 0) return '—';
  return `${freq.toFixed(2)} / day`;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function DORAPanel({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>DORA</span>
          {data ? (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {data.sampleSize} samples
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Lead time (p50)"
              value={formatMs(data?.leadTimeMsP50 ?? -1)}
              hint={`p95 ${formatMs(data?.leadTimeMsP95 ?? -1)}`}
            />
            <StatTile
              label="Deploy frequency"
              value={formatFreq(data?.deployFrequencyPerDay ?? 0)}
            />
            <StatTile
              label="Change-failure rate"
              value={formatRate(data?.changeFailureRate ?? -1)}
            />
            <StatTile label="MTTR" value={formatMs(data?.mttrMs ?? -1)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
