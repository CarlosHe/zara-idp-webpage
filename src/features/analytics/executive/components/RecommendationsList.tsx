// Sprint 28 / L-2805 — recommendations inbox.
//
// Renders the prioritised backlog the L-2808 generator produces.
// Items are sorted server-side by `(score desc, severity desc, id asc)`,
// so the UI only needs to render them in the order received.
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/Button';
import type { RecommendationDTO } from '../types/types';

interface Props {
  items: RecommendationDTO[];
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

function severityClass(sev: RecommendationDTO['severity']): string {
  switch (sev) {
    case 'critical':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'info':
    default:
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
  }
}

export function RecommendationsList({
  items,
  loading,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Platform recommendations</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No recommendations — every metric is within thresholds.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(item.severity)}`}
                      >
                        {item.severity}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.source} · score {item.score}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                    {item.detail ? (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.scope}
                    {item.key ? ` · ${item.key}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
