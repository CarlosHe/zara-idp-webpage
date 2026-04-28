// Sprint 28 / L-2805 — catalog quality panel.
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import type { CatalogQualityDTO } from '../types/types';

interface Props {
  data?: CatalogQualityDTO;
  loading: boolean;
}

function bar(missing: number, total: number) {
  const pct = total > 0 ? Math.min(100, (missing / total) * 100) : 0;
  return (
    <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700">
      <div
        className="h-2 rounded bg-amber-500"
        // dynamic percentage width — Tailwind cannot express runtime-computed widths.
        // eslint-disable-next-line no-restricted-syntax
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

function row(label: string, missing: number, total: number) {
  const pct = total > 0 ? Math.round((missing / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {missing} / {total} ({pct}%)
        </span>
      </div>
      {bar(missing, total)}
    </div>
  );
}

export function CatalogQualityPanel({ data, loading }: Props) {
  const total = data?.total ?? 0;
  const clean = data ? Math.round(data.percentClean * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Catalog quality</span>
          {data ? (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {clean}% clean
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : total === 0 ? (
          <p className="text-sm text-slate-500">No catalog entities tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {row('Missing owner', data?.missingOwner ?? 0, total)}
            {row('Missing docs', data?.missingDocs ?? 0, total)}
            {row('Missing SLO', data?.missingSlo ?? 0, total)}
            {row('Missing runbook', data?.missingRunbook ?? 0, total)}
            {row('Missing API doc', data?.missingApiDoc ?? 0, total)}
            {row('Stale entities', data?.staleEntities ?? 0, total)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
