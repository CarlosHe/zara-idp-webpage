import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeAlertItem } from '../types/home';
import { SEVERITY_DOT, SEVERITY_LABEL, SEVERITY_TONE } from './HomeUtils';

interface AlertsCardProps {
  items: HomeAlertItem[];
  criticalCount: number;
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2403 — alerts surface drift, scorecard findings,
// freezes, and plugin-health hints. Each row deep-links into the
// owning feature; the card itself never mutates.
export function AlertsCard({ items, criticalCount, onAction }: AlertsCardProps) {
  return (
    <Card
      role="region"
      aria-label="Active alerts"
      data-testid="home-alerts-card"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden />
          <span>Alerts</span>
          <Badge variant="outline" aria-label={`${items.length} alerts`}>
            {items.length}
          </Badge>
          {criticalCount > 0 ? (
            <Badge
              variant="danger"
              aria-label={`${criticalCount} critical alerts`}
            >
              {criticalCount} critical
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No active alerts.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.action.path || '#'}
                  onClick={() => onAction('alerts', item.action.kind, item.id)}
                  className="block rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 hover:border-amber-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-block h-2 w-2 rounded-full ${SEVERITY_DOT[item.severity]}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-slate-100">
                          {item.title}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_TONE[item.severity]}`}
                          aria-label={`Severity ${SEVERITY_LABEL[item.severity]}`}
                        >
                          {SEVERITY_LABEL[item.severity]}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {item.message || item.source}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
