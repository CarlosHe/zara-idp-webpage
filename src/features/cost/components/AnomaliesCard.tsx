import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { Anomaly } from '../types/cost';
import { ANOMALY_TONE, SEVERITY_TONE, formatMoney } from './costFormat';

interface AnomaliesCardProps {
  anomalies: Anomaly[];
}

// Sprint-26 / L-2603 + L-2605 — anomaly feed.
export function AnomaliesCard({ anomalies }: AnomaliesCardProps) {
  return (
    <Card data-testid="cost-anomalies">
      <CardHeader>
        <CardTitle className="text-sm uppercase text-slate-400">
          Anomalies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <p className="text-sm text-slate-400">No anomalies detected.</p>
        ) : (
          <ul className="space-y-3">
            {anomalies.slice(0, 12).map((a, idx) => (
              <li
                key={`${a.kind}-${a.scope.service}-${a.scope.resource}-${idx}`}
                className="rounded border border-slate-800 bg-slate-900/40 p-3"
                data-testid={`cost-anomaly-${a.kind}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className={ANOMALY_TONE[a.kind]}>{a.kind}</Badge>
                    <Badge className={SEVERITY_TONE[a.severity]}>
                      {a.severity}
                    </Badge>
                  </div>
                  <span className="font-mono text-emerald-200">
                    {formatMoney(a.observed)}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{a.message}</p>
                {a.zScore > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    z-score = {a.zScore.toFixed(2)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
