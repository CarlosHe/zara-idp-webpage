import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { HomeServiceCard } from '../types/home';
import { SEVERITY_DOT } from './HomeUtils';

interface ServicesCardProps {
  items: HomeServiceCard[];
  onAction: (widget: string, kind: string, id?: string) => void;
}

// Sprint-24 / L-2403 — services owned by the principal's teams.
// Sprint 17/18 catalog work feeds this card; until then the feed is
// empty by design and the card renders the empty state.
export function ServicesCard({ items, onAction }: ServicesCardProps) {
  return (
    <Card role="region" aria-label="Services owned by your team">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-blue-300" aria-hidden />
          <span>Your services</span>
          <Badge variant="outline" aria-label={`${items.length} services`}>
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">
            No services attributed to your team yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={`${item.namespace ?? ''}:${item.name}`}>
                <Link
                  to={item.action.path || '#'}
                  onClick={() =>
                    onAction('services', item.action.kind, item.name)
                  }
                  className="flex items-center gap-3 rounded-md border border-slate-700/60 bg-slate-800/40 px-3 py-2 hover:border-blue-500/60 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${SEVERITY_DOT[item.health]}`}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-sm text-slate-100">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.namespace ?? 'global'}
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
