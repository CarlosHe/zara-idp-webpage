import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { ShowbackBucket } from '../types/cost';
import { formatMoney, formatPercent } from './costFormat';

interface ShowbackProps {
  title: string;
  buckets: ShowbackBucket[];
}

// Sprint-26 / L-2605 — showback rollup. Stacked horizontal bars
// scaled to the largest bucket so the chart is dependency-free
// (Tailwind only — no chart lib pulls).
export function Showback({ title, buckets }: ShowbackProps) {
  const max = Math.max(0, ...buckets.map((b) => b.total.minorUnits));

  return (
    <Card data-testid={`cost-showback-${slug(title)}`}>
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <p className="text-sm text-slate-400">No data in this dimension.</p>
        ) : (
          <ul className="space-y-3" role="list">
            {buckets.map((b) => (
              <li
                key={`${b.dimension}:${b.label}`}
                className="text-sm"
                data-testid={`cost-bucket-${b.label}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-200">{b.label}</span>
                  <span className="font-mono text-emerald-200">
                    {formatMoney(b.total)}{' '}
                    <span className="text-slate-500">
                      ({formatPercent(b.share)})
                    </span>
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded bg-slate-800 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={b.total.minorUnits}
                  aria-valuemin={0}
                  aria-valuemax={max}
                >
                  <div
                    className="h-full bg-emerald-500/70"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic showback bar width
                    style={{ width: max === 0 ? '0%' : `${(b.total.minorUnits / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
