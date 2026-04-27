import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeActivityItem } from '../types/home';

interface RecentActivityCardProps {
  items: HomeActivityItem[];
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2403 — recent activity rows are read-only deep links
// into the audit log. The card explicitly avoids surfacing actor PII
// (we only render the actor field as a string the backend already
// scrubbed).
export function RecentActivityCard({ items, onAction }: RecentActivityCardProps) {
  return (
    <Card role="region" aria-label="Recent activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-400" aria-hidden />
          <span>Recent activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.action.path || '#'}
                  onClick={() => onAction('activity', item.action.kind, item.id)}
                  className="block rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 hover:border-slate-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <span className="block truncate text-sm text-slate-100">
                    {item.title || item.kind}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {item.actor ?? 'unknown'} • {item.namespace ?? 'global'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
